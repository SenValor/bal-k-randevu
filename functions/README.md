# 🐟 Balık Sefası - Firebase Cloud Functions

Firebase Cloud Functions ile WhatsApp bildirim sistemi.

## 📋 Özellikler

- ✅ Rezervasyon onaylandığında otomatik WhatsApp mesajı
- ✅ Meta WhatsApp Cloud API entegrasyonu
- ✅ Firestore trigger ile gerçek zamanlı izleme
- ✅ Production-ready hata yönetimi
- ✅ Türkçe tarih formatı
- ✅ Test endpoint'i

## 🚀 Kurulum

### 1. Dependencies Yükle

```bash
cd functions
npm install
```

### 2. Firebase CLI Yükle (eğer yoksa)

```bash
npm install -g firebase-tools
firebase login
```

### 3. Firebase Projesini Başlat

```bash
# Proje root dizininde
firebase init functions

# Mevcut projeyi seç: baliksefasi-developer
# TypeScript seç
# ESLint: İsteğe bağlı
# Dependencies yükle: Yes
```

### 4. Environment Variables Ayarla

```bash
# Meta WhatsApp API credentials
firebase functions:config:set \
  meta.access_token="YOUR_META_ACCESS_TOKEN" \
  meta.phone_id="810169405521329"
```

**NOT:** Production'da bu değerleri Firebase Console > Functions > Configuration'dan da ayarlayabilirsiniz.

### 5. Build ve Deploy

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🔧 Kullanım

### Otomatik Tetikleme

Function otomatik olarak çalışır. Admin panelinden bir rezervasyonun `status` alanı `"pending"`'den `"approved"`'a değiştiğinde:

1. ✅ Firestore trigger tetiklenir
2. 📱 WhatsApp mesajı gönderilir
3. 📝 Rezervasyon belgesi güncellenir (`whatsappSent: true`)

### Manuel Test

Test endpoint'i ile manuel mesaj gönderebilirsiniz:

```bash
# Function URL'ini al
firebase functions:list

# Test isteği gönder
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendTestWhatsApp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5551234567",
    "message": "Test mesajı 🎉"
  }'
```

## 📊 Mesaj Formatı

```
🐟 Balık Sefası

Merhaba [Müşteri Adı],

Rezervasyonunuz onaylandı! 🎉

📅 Tarih: 15 Kasım 2024
🕐 Saat: 14:00-16:00
⛵ Tekne: Balık Sefası

Rezervasyon Detayları:
• Rezervasyon No: ABC12345
• Durum: Onaylandı ✅

Lütfen randevu saatinden 15 dakika önce hazır olunuz.

Teşekkürler, iyi avlar! ⚓

📞 İletişim: 0555 123 45 67
🌐 www.baliksefasi.com
```

## 🔍 Logları İzleme

```bash
# Tüm loglar
firebase functions:log

# Sadece son 10 satır
firebase functions:log --limit 10

# Gerçek zamanlı izleme
firebase functions:log --follow
```

## 📁 Firestore Yapısı

### Rezervasyon Belgesi (Before)

```json
{
  "customerName": "Ahmet Yılmaz",
  "phoneNumber": "5551234567",
  "email": "ahmet@example.com",
  "date": "2024-11-15",
  "timeSlot": "14:00-16:00",
  "boatName": "Balık Sefası",
  "status": "pending",
  "createdAt": "2024-10-30T10:00:00Z"
}
```

### Rezervasyon Belgesi (After - Onaylandıktan Sonra)

```json
{
  "customerName": "Ahmet Yılmaz",
  "phoneNumber": "5551234567",
  "email": "ahmet@example.com",
  "date": "2024-11-15",
  "timeSlot": "14:00-16:00",
  "boatName": "Balık Sefası",
  "status": "approved",
  "createdAt": "2024-10-30T10:00:00Z",
  "whatsappSent": true,
  "whatsappSentAt": "2024-10-30T10:05:00Z",
  "notificationStatus": "sent"
}
```

## 🛠️ Geliştirme

### Local Test (Emulator)

```bash
cd functions
npm run serve

# Emulator UI: http://localhost:4000
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Sadece functions
firebase deploy --only functions

# Belirli bir function
firebase deploy --only functions:onReservationApproved
```

## 🔐 Güvenlik

- ✅ Environment variables ile token güvenliği
- ✅ Telefon numarası validasyonu
- ✅ Timeout mekanizması (10 saniye)
- ✅ Hata yakalama ve loglama
- ✅ Firestore güvenlik kuralları

## 📱 WhatsApp Cloud API Gereksinimleri

1. **Meta Business Account** oluşturun
2. **WhatsApp Business API** aktif edin
3. **Phone Number ID** alın
4. **Access Token** oluşturun
5. **Test numaraları** ekleyin (production öncesi)

### Meta Developer Console

- URL: https://developers.facebook.com/
- WhatsApp > API Setup
- Phone Number ID: `810169405521329`

## ⚠️ Önemli Notlar

1. **Telefon Formatı**: Türkiye için +90 otomatik eklenir
2. **Rate Limiting**: Meta API limitlerine dikkat edin
3. **Test Mode**: İlk başta test numaraları ekleyin
4. **Production**: Business verification gerekli
5. **Maliyet**: Meta'nın fiyatlandırmasını kontrol edin

## 🐛 Sorun Giderme

### "META_ACCESS_TOKEN tanımlı değil" Hatası

```bash
firebase functions:config:set meta.access_token="YOUR_TOKEN"
firebase deploy --only functions
```

### WhatsApp Mesajı Gönderilmiyor

1. Token'ın geçerli olduğunu kontrol edin
2. Phone ID'nin doğru olduğunu kontrol edin
3. Telefon numarasının test listesinde olduğunu kontrol edin
4. Logları inceleyin: `firebase functions:log`

### Function Tetiklenmiyor

1. Firestore kurallarını kontrol edin
2. Function'ın deploy edildiğini kontrol edin: `firebase functions:list`
3. Status değişikliğinin `pending` → `approved` olduğunu kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin
2. Meta Developer Console'u kontrol edin
3. Firebase Console > Functions > Logs

## 📄 Lisans

MIT License - Balık Sefası © 2024
