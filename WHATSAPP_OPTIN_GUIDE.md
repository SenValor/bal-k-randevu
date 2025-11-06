# 📱 WhatsApp Opt-in Sistemi - Kullanım Kılavuzu

## ✅ Sistem Kuruldu!

WhatsApp opt-in (onay) sistemi başarıyla entegre edildi. Artık müşteriler rezervasyon yaparken WhatsApp bildirimleri almayı onaylayabilir ve otomatik "Hoş geldiniz" mesajı alabilir.

---

## 🎯 Amaç

**Problem**: Meta WhatsApp Business API'nin 24 saat kuralı var. Müşteriye ilk mesajı göndermek için müşterinin size mesaj atması gerekiyor.

**Çözüm**: Müşteri rezervasyon yaparken WhatsApp onayı verirse, otomatik "Hoş geldiniz" mesajı gönderiliyor. Böylece 24 saat penceresi açılıyor ve sonraki onay mesajları sorunsuz gidiyor.

---

## 🔄 Akış

### 1️⃣ Müşteri Rezervasyon Yapar
- Rezervasyon formunu doldurur
- **Son adımda** WhatsApp onay checkbox'ını görür:
  ```
  ☑️ WhatsApp Bildirimleri
  Rezervasyon onayı ve bilgilendirme mesajlarını 
  WhatsApp üzerinden almak istiyorum. (Önerilir - Hızlı bildirim için)
  ```
- Checkbox'ı işaretler (veya işaretlemez)
- Rezervasyonu tamamlar

### 2️⃣ Firestore'a Kayıt
Rezervasyon oluşturulduğunda şu alanlar eklenir:
```javascript
{
  whatsappConsent: true,              // Onay durumu
  whatsappConsentDate: "2024-11-05T08:00:00Z",  // Onay tarihi
  // ... diğer rezervasyon bilgileri
}
```

### 3️⃣ Firebase Function Tetiklenir (onCreate)
**Function**: `onReservationCreated`

**Kontrol**:
```javascript
if (whatsappConsent === true) {
  // Hoş geldiniz mesajı gönder
}
```

**Mesaj İçeriği**:
```
🐟 Balık Sefası'na Hoş Geldiniz!

Merhaba [Müşteri Adı],

Rezervasyonunuz başarıyla alındı! 🎉

🎫 Rezervasyon No: BS-2024-001234

Rezervasyonunuz inceleniyor ve en kısa sürede onaylanacaktır. 
Onay sonrası size tekrar bilgi vereceğiz.

📱 Bu numaradan size bildirimler göndereceğiz.
Sorularınız için bize WhatsApp'tan yazabilirsiniz.

Teşekkürler! 🙏

📞 İletişim: 0533 379 85 89
🌐 www.baliksefasi.com
```

### 4️⃣ Firestore Güncellenir
Mesaj gönderildikten sonra:
```javascript
{
  welcomeMessageSent: true,           // Hoş geldiniz mesajı gönderildi
  welcomeMessageSentAt: timestamp,    // Gönderim zamanı
  welcomeMessageId: "wamid.xxx",      // WhatsApp mesaj ID
}
```

### 5️⃣ Admin Onaylar
- Admin panelde rezervasyonu onaylar
- `onReservationApproved` function tetiklenir
- **24 saat penceresi açık** olduğu için onay mesajı sorunsuz gider

---

## 🎨 UI/UX

### Rezervasyon Formu
**Konum**: Son adım (Onay sayfası)

**Görünüm**:
- 🟢 Yeşil arka planlı kutu
- ☑️ Checkbox (varsayılan: işaretsiz)
- 💬 MessageCircle ikonu
- Açıklayıcı metin
- "(Önerilir - Hızlı bildirim için)" vurgusu

**Hover Efekti**: Kutu biraz daha yeşil olur

---

## 📊 Admin Paneli

### Rezervasyon Listesi
Her rezervasyonda **2 badge** görebilirsiniz:

#### 1. Hoş Geldiniz Badge (Mavi/Gri)
- **Mavi 👋**: Hoş geldiniz mesajı gönderildi (Opt-in başarılı)
- **Gri ⏳**: Hoş geldiniz mesajı bekliyor
- **Yok**: Müşteri WhatsApp onayı vermedi

#### 2. Onay Mesajı Badge (Yeşil/Sarı)
- **Yeşil ✓**: Onay mesajı gönderildi
- **Sarı ⏳**: Onay mesajı henüz gönderilmedi
- Sadece **onaylanmış** rezervasyonlarda görünür

**Örnek**:
```
[Onaylandı] [💬 👋] [💬 ✓]  ← Hem hoş geldiniz hem onay mesajı gitti
[Onaylandı] [💬 ✓]          ← Sadece onay mesajı gitti (opt-in yok)
[Bekliyor]  [💬 👋]          ← Hoş geldiniz mesajı gitti, onay bekleniyor
```

---

## 🔧 Firestore Veri Yapısı

### Rezervasyon Belgesi
```javascript
{
  // Mevcut alanlar
  reservationNumber: "BS-2024-001234",
  userName: "Ahmet Yılmaz",
  userPhone: "5551234567",
  status: "pending",
  
  // Yeni opt-in alanları
  whatsappConsent: true,                    // Müşteri onayı
  whatsappConsentDate: "2024-11-05T08:00:00Z",  // Onay tarihi
  
  // Hoş geldiniz mesajı alanları
  welcomeMessageSent: true,                 // Gönderildi mi?
  welcomeMessageSentAt: timestamp,          // Gönderim zamanı
  welcomeMessageId: "wamid.xxx",            // WhatsApp mesaj ID
  welcomeMessageError: null,                // Hata varsa
  
  // Onay mesajı alanları (mevcut)
  whatsappSent: true,                       // Onay mesajı gönderildi mi?
  whatsappSentAt: timestamp,                // Gönderim zamanı
  whatsappMessageId: "wamid.yyy",           // WhatsApp mesaj ID
  whatsappError: null,                      // Hata varsa
}
```

---

## 🚀 Firebase Functions

### 1. onReservationCreated (YENİ)
**Trigger**: `onCreate` - Yeni rezervasyon oluşturulduğunda

**Koşul**: `whatsappConsent === true`

**Görev**: Hoş geldiniz mesajı gönder

**Log Örneği**:
```
🆕 Yeni rezervasyon oluşturuldu: abc123def456
✨ WhatsApp onayı var! Hoş geldiniz mesajı gönderiliyor...
📱 Formatlanmış telefon: +905551234567
✅ Hoş geldiniz mesajı başarıyla gönderildi!
✅ Firestore güncellendi: welcomeMessageSent = true
```

### 2. onReservationApproved (MEVCUT)
**Trigger**: `onUpdate` - Rezervasyon onaylandığında

**Koşul**: `status === "confirmed" && whatsappSent !== true`

**Görev**: Onay mesajı gönder

---

## 📈 İstatistikler

### Opt-in Oranı
Firestore query ile hesaplayabilirsiniz:
```javascript
// Toplam rezervasyon
const total = await getDocs(collection(db, 'reservations'));

// WhatsApp onayı verenler
const optIn = await getDocs(
  query(collection(db, 'reservations'), where('whatsappConsent', '==', true))
);

const optInRate = (optIn.size / total.size) * 100;
console.log(`Opt-in Oranı: ${optInRate}%`);
```

### Mesaj Başarı Oranı
```javascript
// Hoş geldiniz mesajı gönderildi
const welcomeSent = await getDocs(
  query(collection(db, 'reservations'), where('welcomeMessageSent', '==', true))
);

// Onay mesajı gönderildi
const approvalSent = await getDocs(
  query(collection(db, 'reservations'), where('whatsappSent', '==', true))
);
```

---

## 🐛 Sorun Giderme

### Hoş Geldiniz Mesajı Gönderilmiyor

**1. Checkbox İşaretli mi?**
- Firestore'da `whatsappConsent: true` olmalı
- Admin panelde mavi badge görünmeli

**2. Function Çalışıyor mu?**
```bash
# Logları kontrol et
npx firebase-tools functions:log --only onReservationCreated
```

**3. Telefon Numarası Doğru mu?**
- Firestore'da `userPhone` alanı var mı?
- Meta'da test listesinde mi?

**4. Token Geçerli mi?**
- `.env` dosyasında `META_ACCESS_TOKEN` var mı?
- Token süresi dolmuş olabilir

### Onay Mesajı Gönderilmiyor (24 Saat Kuralı)

**Sebep**: Müşteri hoş geldiniz mesajını almadı, 24 saat penceresi açılmadı.

**Çözüm**:
1. Müşteriye manuel "Hoş geldiniz" mesajı gönderin
2. Veya müşteriden size mesaj atmasını isteyin
3. Sonra onay mesajı gönderebilirsiniz

---

## 📞 Destek

### Firebase Console
- **Functions**: https://console.firebase.google.com/project/baliksefasi-developer/functions
- **Firestore**: https://console.firebase.google.com/project/baliksefasi-developer/firestore

### Meta Developer Console
- **WhatsApp**: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-dev-console

### Loglar
```bash
# Tüm function logları
npx firebase-tools functions:log --follow

# Sadece onCreate
npx firebase-tools functions:log --only onReservationCreated

# Sadece onUpdate
npx firebase-tools functions:log --only onReservationApproved
```

---

## ✅ Kontrol Listesi

- [x] Frontend: WhatsApp onay checkbox'ı eklendi
- [x] Frontend: Hem misafir hem üye formu güncellendi
- [x] Backend: `whatsappConsent` ve `whatsappConsentDate` Firestore'a kaydediliyor
- [x] Functions: `onReservationCreated` onCreate trigger eklendi
- [x] Functions: Hoş geldiniz mesajı template'i oluşturuldu
- [x] Functions: `welcomeMessageSent` alanları Firestore'a yazılıyor
- [x] Admin: Hoş geldiniz mesajı badge'i eklendi
- [x] Admin: Onay mesajı badge'i mevcut
- [x] Dokümantasyon: Bu kılavuz oluşturuldu

---

## 🎉 Başarılı Kurulum!

Sistem hazır! Artık:
1. ✅ Müşteri rezervasyon yaparken WhatsApp onayı verebilir
2. ✅ Onay verirse otomatik "Hoş geldiniz" mesajı alır
3. ✅ 24 saat penceresi açılır
4. ✅ Admin onayladığında sorunsuz bildirim gider
5. ✅ Admin panelde tüm mesaj durumlarını görebilirsiniz

İyi avlar! 🐟⚓
