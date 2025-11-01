# 🐟 Balık Sefası - WhatsApp Bildirim Sistemi

## ✅ Kurulum Tamamlandı!

Firebase Cloud Function başarıyla yapılandırıldı. Sistem artık rezervasyon onaylandığında otomatik WhatsApp mesajı gönderecek.

## 📋 Sistem Nasıl Çalışıyor?

### 1. Firestore Trigger
```javascript
reservations/{reservationId} → onUpdate
```
- Rezervasyon belgesi güncellendiğinde tetiklenir
- Sadece `status: "pending"` → `"approved"` değişikliğinde çalışır

### 2. Telefon Formatı
```javascript
"05551234567" → "905551234567"  // 0 ile başlıyorsa +90 ile değiştirilir
"5551234567"  → "905551234567"  // Başına 90 eklenir
"905551234567" → "905551234567" // Olduğu gibi kullanılır
```

### 3. WhatsApp Mesajı
```
🐟 Balık Sefası

Merhaba [Müşteri Adı],

Rezervasyonunuz onaylandı! 🎉

📅 Tarih: 15 Kasım 2024
🕐 Saat: 14:00-16:00
⛵ Tekne: Balık Sefası

Rezervasyon No: ABC12345

Lütfen randevu saatinden 15 dakika önce hazır olunuz.

Teşekkürler, iyi avlar dileriz! ⚓

📞 İletişim: 0555 123 45 67
🌐 www.baliksefasi.com
```

### 4. Firestore Güncelleme
Mesaj gönderildikten sonra rezervasyon belgesine eklenir:
```javascript
{
  whatsappSent: true,           // veya false (hata durumunda)
  whatsappSentAt: timestamp,    // Gönderim zamanı
  notificationStatus: "sent"    // "sent", "failed", veya "error"
}
```

## 🚀 Deploy Edildi

Function'lar deploy edildi:
- ✅ `onReservationApproved` - Otomatik trigger
- ✅ `sendTestWhatsApp` - Test endpoint

## 🧪 Test Etme

### A) Admin Panelden Test

1. Admin paneline git: `/admin-sefa3986/reservations`
2. Bir rezervasyonu seç
3. Status'u "Onayla" butonuna tıkla
4. Firebase Console > Functions > Logs'a git
5. Logları kontrol et

**Başarılı log örneği:**
```
🔔 Rezervasyon güncellendi: abc123def456
✨ Rezervasyon onaylandı! WhatsApp mesajı hazırlanıyor...
📱 WhatsApp mesajı gönderiliyor: +905551234567
✅ WhatsApp mesajı başarıyla gönderildi!
✅ Rezervasyon belgesi güncellendi (whatsappSent: true)
```

### B) Test Endpoint ile Manuel Test

```bash
# Function URL'ini al
npx firebase-tools functions:list

# Test mesajı gönder
curl -X POST https://us-central1-baliksefasi-developer.cloudfunctions.net/sendTestWhatsApp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5551234567",
    "message": "Test mesajı 🎉"
  }'
```

**Başarılı response:**
```json
{
  "success": true,
  "message": "WhatsApp mesajı başarıyla gönderildi",
  "phone": "905551234567"
}
```

## 📊 Logları İzleme

```bash
# Gerçek zamanlı log izleme
npx firebase-tools functions:log --follow

# Son 50 log
npx firebase-tools functions:log --limit 50

# Sadece onReservationApproved function'ı
npx firebase-tools functions:log --only onReservationApproved
```

## 🔧 Rezervasyon Veri Yapısı

### Gerekli Alanlar
```javascript
{
  status: "pending" | "approved" | "cancelled",
  customerName: string,        // Müşteri adı
  phone: string,               // Telefon numarası (0 veya 90 ile başlayabilir)
  date: string,                // Tarih (ISO format veya string)
  timeSlot: string,            // Saat dilimi (örn: "14:00-16:00")
  boatName: string             // Tekne adı
}
```

### Eklenen Alanlar (Mesaj Gönderildikten Sonra)
```javascript
{
  whatsappSent: boolean,       // Mesaj gönderildi mi?
  whatsappSentAt: timestamp,   // Gönderim zamanı
  notificationStatus: string,  // "sent", "failed", "error"
  whatsappError: string        // Hata mesajı (varsa)
}
```

## ⚠️ Önemli Notlar

### 1. Telefon Numarası
- Firestore'da `phone` alanında olmalı
- "0" ile başlıyorsa otomatik "+90" ile değiştirilir
- Sadece rakamlar kullanılır (boşluk, tire vb. temizlenir)

### 2. Status Değişikliği
- Sadece `pending` → `approved` durumunda mesaj gönderilir
- `approved` → `approved` (tekrar onay) mesaj göndermez
- `pending` → `cancelled` mesaj göndermez

### 3. Meta WhatsApp API
- Access token'ın geçerli olması gerekir
- Phone ID doğru olmalı
- Test numaraları Meta Developer Console'da eklenmiş olmalı

### 4. Rate Limiting
- Meta API'nin rate limit'leri vardır
- Çok fazla mesaj gönderilirse geçici olarak engellenebilir
- Production'da Business verification gereklidir

## 🐛 Sorun Giderme

### Mesaj Gönderilmiyor

**1. Config Kontrolü**
```bash
npx firebase-tools functions:config:get
```
Çıktıda `meta.access_token` ve `meta.phone_id` görünmeli.

**2. Logları Kontrol Et**
```bash
npx firebase-tools functions:log --follow
```

**3. Telefon Numarası**
- Firestore'da `phone` alanı var mı?
- Geçerli bir numara mı?
- Meta'da test listesinde mi?

**4. Token Geçerliliği**
- Meta Developer Console'da token'ı kontrol et
- Süresi dolmuş olabilir, yenile

### Hata: "META_ACCESS_TOKEN bulunamadı"

```bash
# Config'i yeniden ayarla
npx firebase-tools functions:config:set \
  meta.access_token="YOUR_TOKEN" \
  meta.phone_id="810169405521329"

# Deploy et
npx firebase-tools deploy --only functions
```

### Hata: "WhatsApp API hatası: 401"

Token geçersiz veya süresi dolmuş. Meta Developer Console'dan yeni token al:
1. https://developers.facebook.com/ → WhatsApp
2. API Setup → Temporary access token
3. Token'ı kopyala
4. Config'i güncelle ve deploy et

## 📞 Destek

Sorun yaşarsanız:
1. Firebase Console > Functions > Logs
2. Meta Developer Console > WhatsApp > API Setup
3. Test endpoint ile manuel test yapın

## 🎉 Başarılı Kurulum!

Sistem hazır! Admin bir rezervasyonu onayladığında:
1. ⚡ Function otomatik tetiklenir
2. 📱 WhatsApp mesajı anında gönderilir
3. 📝 Firestore güncellenir
4. 📊 Loglar kaydedilir

İyi avlar! 🐟⚓
