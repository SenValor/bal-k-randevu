# 🚀 Hızlı Kurulum Rehberi

## Adım 1: Dependencies Yükle

```bash
cd functions
npm install
```

Bu komut şu paketleri yükler:
- `firebase-admin`: Firestore ve diğer Firebase servisleri
- `firebase-functions`: Cloud Functions runtime
- `axios`: HTTP istekleri için

## Adım 2: Firebase Config Ayarla

```bash
# Meta WhatsApp API bilgilerini ayarla
firebase functions:config:set \
  meta.access_token="EAAMrZBZCLxZBZBkBO4..." \
  meta.phone_id="810169405521329"

# Ayarları kontrol et
firebase functions:config:get
```

**Çıktı şöyle olmalı:**
```json
{
  "meta": {
    "access_token": "EAAMrZBZCLxZBZBkBO4...",
    "phone_id": "810169405521329"
  }
}
```

## Adım 3: Build

```bash
npm run build
```

Bu komut TypeScript kodunu JavaScript'e derler (`lib/` klasörüne).

## Adım 4: Deploy

```bash
firebase deploy --only functions
```

**Başarılı deploy çıktısı:**
```
✔  functions[onReservationApproved(us-central1)] Successful update operation.
✔  functions[sendTestWhatsApp(us-central1)] Successful update operation.

✔  Deploy complete!
```

## Adım 5: Test Et

### A) Admin Panelden Test

1. Admin paneline git: `/admin-sefa3986/reservations`
2. Bir rezervasyonu "Onayla" butonuna tıkla
3. Firebase Console > Functions > Logs'a git
4. Logları kontrol et:
   - ✅ "Rezervasyon onaylandı! WhatsApp mesajı gönderiliyor..."
   - ✅ "WhatsApp mesajı başarıyla gönderildi!"

### B) Manuel Test Endpoint

```bash
# Function URL'ini al
firebase functions:list

# Test mesajı gönder
curl -X POST https://us-central1-baliksefasi-developer.cloudfunctions.net/sendTestWhatsApp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5551234567",
    "message": "Test mesajı 🎉"
  }'
```

## 🔍 Sorun Giderme

### Hata: "Cannot find module 'firebase-functions'"

**Çözüm:**
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
```

### Hata: "META_ACCESS_TOKEN tanımlı değil"

**Çözüm:**
```bash
firebase functions:config:set meta.access_token="YOUR_TOKEN"
firebase deploy --only functions
```

### Hata: "WhatsApp mesajı gönderilemedi"

**Olası Sebepler:**
1. ❌ Token geçersiz veya süresi dolmuş
2. ❌ Phone ID yanlış
3. ❌ Telefon numarası test listesinde değil
4. ❌ WhatsApp Business API aktif değil

**Çözüm:**
1. Meta Developer Console'a git
2. Token'ı yenile
3. Test numarası ekle
4. API durumunu kontrol et

## 📊 Logları İzle

```bash
# Gerçek zamanlı log izleme
firebase functions:log --follow

# Son 50 log
firebase functions:log --limit 50

# Sadece hataları göster
firebase functions:log --only onReservationApproved
```

## ✅ Başarı Kontrolü

Function çalışıyorsa şu logları göreceksiniz:

```
🔔 Rezervasyon güncellendi: abc123...
✨ Rezervasyon onaylandı! WhatsApp mesajı gönderiliyor...
📱 WhatsApp mesajı gönderiliyor: +905551234567
✅ WhatsApp mesajı başarıyla gönderildi!
✅ Rezervasyon belgesi güncellendi (whatsappSent: true)
```

## 🎉 Tamamlandı!

Artık sistem hazır! Admin bir rezervasyonu onayladığında otomatik olarak müşteriye WhatsApp mesajı gönderilecek.

## 📞 İletişim

Sorun yaşarsanız:
1. README.md dosyasını okuyun
2. Firebase Console > Functions > Logs'u kontrol edin
3. Meta Developer Console'u kontrol edin
