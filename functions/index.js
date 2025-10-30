/**
 * 🐟 Balık Sefası - WhatsApp Bildirim Sistemi
 * Firebase Functions v3 + Node.js 22
 * Rezervasyon onaylandığında (status: confirmed) otomatik WhatsApp mesajı gönderir
 */

require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const accessToken = process.env.META_ACCESS_TOKEN;
const phoneId = process.env.META_PHONE_ID;

console.log("🔥 ENV META_ACCESS_TOKEN:", accessToken ? "Var ✅" : "Yok ❌");
console.log("🔥 ENV META_PHONE_ID:", phoneId ? "Var ✅" : "Yok ❌")

/**
 * Telefon numarasını WhatsApp formatına çevirir (+90...)
 * @param {string} phone - Ham telefon numarası
 * @return {string} Formatlanmış telefon (+90XXXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  
  // Sadece rakamları al
  const cleaned = phone.replace(/\D/g, "");
  
  // 0 ile başlıyorsa +90 ile değiştir
  if (cleaned.startsWith("0")) {
    return "90" + cleaned.substring(1);
  }
  
  // 90 ile başlıyorsa olduğu gibi kullan
  if (cleaned.startsWith("90")) {
    return cleaned;
  }
  
  // Diğer durumlarda başına 90 ekle
  return "90" + cleaned;
}

/**
 * Tarihi Türkçe formatına çevirir
 * @param {string} dateString - Tarih (YYYY-MM-DD)
 * @return {string} Türkçe tarih (15 Kasım 2024)
 */
function formatDateTurkish(dateString) {
  try {
    const date = new Date(dateString);
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Istanbul",
    };
    return date.toLocaleDateString("tr-TR", options);
  } catch (error) {
    console.error("⚠️ Tarih formatlama hatası:", error);
    return dateString;
  }
}

/**
 * 🎯 Ana Cloud Function: Rezervasyon Onaylandığında WhatsApp Gönder
 * Trigger: Firestore onUpdate
 * Collection: reservations/{reservationId}
 * Koşul: status === "confirmed" && whatsappSent !== true
 */
exports.onReservationApproved = functions
  .region("us-central1")
  .firestore
  .document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const reservationId = context.params.reservationId;

      console.log(`🔔 Rezervasyon güncellendi: ${reservationId}`);
      console.log(`📊 Status: ${before.status} → ${after.status}`);

      // ✅ Kontrol 1: Status "confirmed" mi?
      if (after.status !== "confirmed") {
        console.log("ℹ️ Status 'confirmed' değil, işlem yapılmadı.");
        return null;
      }

      // ✅ Kontrol 2: Daha önce WhatsApp gönderilmiş mi?
      if (after.whatsappSent === true) {
        console.log("ℹ️ WhatsApp mesajı zaten gönderilmiş, tekrar gönderilmedi.");
        return null;
      }

      // ✅ Kontrol 3: Status değişti mi? (confirmed → confirmed tekrarını engelle)
      if (before.status === "confirmed" && after.status === "confirmed") {
        console.log("ℹ️ Status zaten 'confirmed' idi, tekrar mesaj gönderilmedi.");
        return null;
      }

      console.log("✨ Rezervasyon onaylandı! WhatsApp mesajı hazırlanıyor...");

      // 📝 Rezervasyon bilgilerini al
      const userName = after.userName || "Değerli Müşterimiz";
      const userPhone = after.userPhone || "";
      const date = after.date || "";
      const timeSlotDisplay = after.timeSlotDisplay || "Belirtilmemiş";
      const boatName = after.boatName || "BALIK SEFASI";

      // 📞 Telefon numarası kontrolü
      if (!userPhone) {
        console.error("❌ Telefon numarası bulunamadı!");
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: "Telefon numarası eksik",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 📱 Telefon numarasını formatla
      const formattedPhone = formatPhoneNumber(userPhone);
      console.log(`📱 Formatlanmış telefon: +${formattedPhone}`);

      // 📅 Tarihi Türkçe formatla
      const formattedDate = formatDateTurkish(date);

      // 💬 WhatsApp mesajını oluştur
      const message = `🐟 Balık Sefası

Merhaba ${userName},

Rezervasyonunuz onaylandı! 🎉

📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlotDisplay}
⛵ Tekne: ${boatName}

Teşekkürler, iyi avlar dileriz ⚓
www.baliksefasi.com`;

      // 🔑 .env'den okunan API bilgilerini kullan (global değişkenler)
      if (!accessToken || !phoneId) {
        console.error("❌ META_ACCESS_TOKEN veya META_PHONE_ID bulunamadı!");
        console.error("Lütfen .env dosyasını kontrol edin.");
        
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: "API credentials eksik",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 🚀 WhatsApp Cloud API'ye mesaj gönder
      console.log("📤 WhatsApp API'ye istek gönderiliyor...");
      
      const apiUrl = `https://graph.facebook.com/v22.0/${phoneId}/messages`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: message,
          },
        }),
      });

      const responseData = await response.json();

      // ✅ Başarılı mı kontrol et
      if (response.ok && responseData.messages) {
        console.log("✅ WhatsApp mesajı başarıyla gönderildi!");
        console.log("📊 Response:", JSON.stringify(responseData));

        // Firestore'u güncelle (başarılı)
        await change.after.ref.update({
          whatsappSent: true,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappMessageId: responseData.messages[0]?.id || null,
          whatsappPhone: formattedPhone,
        });

        console.log("✅ Firestore güncellendi: whatsappSent = true");
        return null;
      } else {
        // ❌ Hata durumu
        console.error("❌ WhatsApp API hatası!");
        console.error("Status:", response.status);
        console.error("Response:", JSON.stringify(responseData));

        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: responseData.error?.message || "API hatası",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
      }
    } catch (error) {
      console.error("❌ Cloud Function hatası:", error.message);
      console.error("Stack:", error.stack);

      // Hata durumunda Firestore'u güncelle
      try {
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: error.message,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error("❌ Firestore güncelleme hatası:", updateError.message);
      }

      return null;
    }
  });
