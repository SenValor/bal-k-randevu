import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Firebase Admin SDK'yı başlat
admin.initializeApp();

// Türkçe tarih formatı için yardımcı fonksiyon
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  };
  return date.toLocaleDateString('tr-TR', options);
};

// WhatsApp mesajı gönderme fonksiyonu
const sendWhatsAppMessage = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    // Environment variables'dan token ve phone ID al
    const accessToken = functions.config().meta?.access_token;
    const phoneId = functions.config().meta?.phone_id;

    if (!accessToken || !phoneId) {
      console.error('❌ META_ACCESS_TOKEN veya META_PHONE_ID tanımlı değil!');
      console.error('Firebase config ayarlamak için:');
      console.error('firebase functions:config:set meta.access_token="YOUR_TOKEN" meta.phone_id="YOUR_PHONE_ID"');
      return false;
    }

    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Türkiye için +90 ekle (eğer yoksa)
    const formattedPhone = cleanPhone.startsWith('90') 
      ? cleanPhone 
      : `90${cleanPhone}`;

    console.log(`📱 WhatsApp mesajı gönderiliyor: +${formattedPhone}`);

    // Meta WhatsApp Cloud API endpoint
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    // API isteği
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 saniye timeout
      }
    );

    if (response.status === 200) {
      console.log('✅ WhatsApp mesajı başarıyla gönderildi!');
      console.log('📊 Response:', JSON.stringify(response.data));
      return true;
    } else {
      console.error('⚠️ Beklenmeyen response status:', response.status);
      return false;
    }

  } catch (error: any) {
    console.error('❌ WhatsApp mesajı gönderilemedi!');
    
    if (error.response) {
      // API'den gelen hata
      console.error('📛 API Error Status:', error.response.status);
      console.error('📛 API Error Data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // İstek gönderildi ama cevap alınamadı
      console.error('📛 No response received:', error.message);
    } else {
      // İstek oluşturulurken hata
      console.error('📛 Error:', error.message);
    }
    
    return false;
  }
};

// Rezervasyon onaylandığında tetiklenen Cloud Function
export const onReservationApproved = functions.firestore
  .document('reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const reservationId = context.params.reservationId;

      console.log(`🔔 Rezervasyon güncellendi: ${reservationId}`);

      // Status değişikliğini kontrol et
      const statusChanged = before.status !== after.status;
      const isApproved = after.status === 'approved';
      const wasPending = before.status === 'pending';

      if (!statusChanged) {
        console.log('ℹ️ Status değişmedi, işlem yapılmıyor.');
        return null;
      }

      if (!isApproved || !wasPending) {
        console.log(`ℹ️ Status değişikliği: ${before.status} → ${after.status}`);
        console.log('ℹ️ Sadece pending → approved durumunda mesaj gönderilir.');
        return null;
      }

      console.log('✨ Rezervasyon onaylandı! WhatsApp mesajı gönderiliyor...');

      // Rezervasyon bilgilerini al
      const {
        customerName,
        phoneNumber,
        date,
        timeSlot,
        boatName,
        email
      } = after;

      // Gerekli alanları kontrol et
      if (!phoneNumber) {
        console.error('❌ Telefon numarası bulunamadı!');
        return null;
      }

      // Tarihi formatla
      const formattedDate = formatDate(date);

      // WhatsApp mesajını oluştur
      const message = `🐟 Balık Sefası

Merhaba ${customerName || 'Değerli Müşterimiz'},

Rezervasyonunuz onaylandı! 🎉

📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlot}
⛵ Tekne: ${boatName || 'Balık Sefası'}

Rezervasyon Detayları:
• Rezervasyon No: ${reservationId.substring(0, 8).toUpperCase()}
• Durum: Onaylandı ✅

Lütfen randevu saatinden 15 dakika önce hazır olunuz.

Teşekkürler, iyi avlar! ⚓

📞 İletişim: 0555 123 45 67
🌐 www.baliksefasi.com`;

      // WhatsApp mesajını gönder
      const success = await sendWhatsAppMessage(phoneNumber, message);

      if (success) {
        // Firestore'da mesaj gönderim kaydı oluştur
        await admin.firestore()
          .collection('reservations')
          .doc(reservationId)
          .update({
            whatsappSent: true,
            whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationStatus: 'sent'
          });

        console.log('✅ Rezervasyon belgesi güncellendi (whatsappSent: true)');
      } else {
        // Hata durumunda kaydet
        await admin.firestore()
          .collection('reservations')
          .doc(reservationId)
          .update({
            whatsappSent: false,
            whatsappError: 'Mesaj gönderilemedi',
            notificationStatus: 'failed'
          });

        console.log('⚠️ Rezervasyon belgesi güncellendi (whatsappSent: false)');
      }

      return null;

    } catch (error: any) {
      console.error('❌ Cloud Function hatası:', error.message);
      console.error('Stack trace:', error.stack);
      return null;
    }
  });

// Yeni duyuru oluşturulduğunda tüm kullanıcılara Expo push bildirimi gönder
export const onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    try {
      const ann = snap.data();
      const announcementId = context.params.announcementId;

      if (!ann.isActive) {
        console.log('ℹ️ Duyuru aktif değil, bildirim gönderilmiyor.');
        return null;
      }

      console.log(`🔔 Yeni duyuru: ${announcementId} — "${ann.title}"`);

      // expoPushToken kayıtlı tüm kullanıcıları çek
      const usersSnap = await admin.firestore()
        .collection('users')
        .get();

      const tokens: string[] = [];
      usersSnap.forEach((doc) => {
        const token = doc.data().expoPushToken;
        if (token && typeof token === 'string' && token.startsWith('ExponentPushToken[')) {
          tokens.push(token);
        }
      });

      if (tokens.length === 0) {
        console.log('ℹ️ Push token bulunan kullanıcı yok.');
        return null;
      }

      console.log(`📱 ${tokens.length} kullanıcıya bildirim gönderiliyor...`);

      const title = `${ann.emoji ?? '📢'} ${ann.title}`;
      const body: string = ann.body ?? '';

      // Expo Push API en fazla 100 mesaj kabul eder; batch'lere böl
      const BATCH = 100;
      for (let i = 0; i < tokens.length; i += BATCH) {
        const chunk = tokens.slice(i, i + BATCH).map((to) => ({
          to,
          title,
          body,
          data: { announcementId },
          sound: 'default',
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(chunk),
        });

        const result = await response.json() as any;
        console.log(`📊 Batch ${Math.floor(i / BATCH) + 1} sonuç:`, JSON.stringify(result));
      }

      console.log('✅ Tüm push bildirimleri gönderildi.');
      return null;
    } catch (error: any) {
      console.error('❌ onAnnouncementCreated hatası:', error.message);
      return null;
    }
  });

// Test için manuel mesaj gönderme fonksiyonu (HTTP trigger)
export const sendTestWhatsApp = functions.https.onRequest(async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      res.status(400).json({
        success: false,
        error: 'phoneNumber ve message parametreleri gerekli'
      });
      return;
    }

    const success = await sendWhatsAppMessage(phoneNumber, message);

    res.status(200).json({
      success,
      message: success 
        ? 'WhatsApp mesajı başarıyla gönderildi' 
        : 'WhatsApp mesajı gönderilemedi'
    });

  } catch (error: any) {
    console.error('Test endpoint hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
