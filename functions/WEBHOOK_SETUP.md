# 📩 WhatsApp Webhook Kurulum Rehberi

## 🎯 Ne Yapıyor?

Kullanıcı WhatsApp hattınıza mesaj attığında:
- **İptal/Değişiklik** içeren mesajlarda → Özel iptal cevabı
- **Diğer mesajlarda** → Genel bilgilendirme cevabı

Mevcut template mesaj sistemi (onay/iptal bildirimleri) **KESİNLİKLE DEĞİŞMEDİ**.

---

## 🚀 Deploy Adımları

### 1. Environment Variables Ayarla

```bash
cd functions

# .env dosyasına ekle (zaten mevcut olanları koru)
# Sadece WA_VERIFY_TOKEN eklemen yeterli
echo "WA_VERIFY_TOKEN=baliksefasi_webhook_2024" >> .env
```

> **Not:** `WA_TOKEN` ve `WA_PHONE_NUMBER_ID` zaten mevcut `META_ACCESS_TOKEN` ve `META_PHONE_ID` değerlerini kullanıyor.

### 2. Deploy Et

```bash
# Functions klasöründe
cd functions

# Deploy
firebase deploy --only functions

# Veya sadece webhook fonksiyonunu deploy et
firebase deploy --only functions:whatsappWebhook
```

### 3. Webhook URL'ini Al

Deploy sonrası şu formatta bir URL alacaksın:
```
https://us-central1-baliksefasi-developer.cloudfunctions.net/whatsappWebhook
```

---

## 🔧 Meta Business Suite Ayarları

### 1. Webhook URL'i Ekle

1. [Meta Business Suite](https://business.facebook.com/) → WhatsApp → Configuration
2. **Webhook** bölümüne git
3. **Callback URL:** `https://us-central1-baliksefasi-developer.cloudfunctions.net/whatsappWebhook`
4. **Verify Token:** `baliksefasi_webhook_2024`
5. **Subscribe** butonuna tıkla

### 2. Webhook Fields

Şu alanları seçili yap:
- ✅ `messages`

---

## 🧪 Test Etme

### 1. Webhook Doğrulama Testi (GET)

```bash
curl "https://us-central1-baliksefasi-developer.cloudfunctions.net/whatsappWebhook?hub.mode=subscribe&hub.verify_token=baliksefasi_webhook_2024&hub.challenge=test123"
```

Beklenen cevap: `test123`

### 2. Mesaj Testi

WhatsApp'tan hattınıza şu mesajları atın:
- "iptal etmek istiyorum" → İptal cevabı dönmeli
- "merhaba" → Genel cevap dönmeli

### 3. Logları İzle

```bash
firebase functions:log --only whatsappWebhook
```

---

## 📋 Eklenen Fonksiyonlar

| Fonksiyon | Tip | Açıklama |
|-----------|-----|----------|
| `whatsappWebhook` | HTTP | GET: Meta doğrulama, POST: Gelen mesaj işleme |

---

## 🔐 Güvenlik

- ✅ Webhook verify token ile doğrulama
- ✅ Token'lar loglarda maskeleniyor
- ✅ Sadece `whatsapp_business_account` eventleri işleniyor
- ✅ 200 OK hemen dönülüyor (timeout önleme)

---

## 📊 Firestore Koleksiyonu

Gelen mesajlar `whatsapp_incoming` koleksiyonuna kaydediliyor:

```javascript
{
  from: "905xxxxxxxxx",
  message: "iptal etmek istiyorum",
  messageType: "text",
  isCancelRequest: true,
  timestamp: Timestamp,
  rawTimestamp: "1234567890",
  replySent: true
}
```

---

## ⚠️ Önemli Notlar

1. **24 Saat Kuralı:** Kullanıcı mesaj attığında 24 saatlik pencere açılır, bu sürede text mesaj gönderebilirsiniz.

2. **Template Mesajlar:** Mevcut `onReservationApproved` ve `onReservationCancelled` fonksiyonları **DEĞİŞMEDİ**.

3. **Region:** Tüm fonksiyonlar `us-central1` bölgesinde çalışıyor.

---

## 🐛 Sorun Giderme

### "Webhook doğrulama başarısız"
- `WA_VERIFY_TOKEN` değerinin Meta'daki ile aynı olduğundan emin ol

### "Otomatik cevap gönderilemiyor"
- `META_ACCESS_TOKEN` geçerli mi kontrol et
- Token'ın `whatsapp_business_messaging` iznine sahip olduğundan emin ol

### "Mesajlar gelmiyor"
- Meta'da webhook subscription aktif mi kontrol et
- `messages` field'ı seçili mi kontrol et

---

## 📞 Destek Numarasını Değiştirme

`index.js` dosyasında şu satırları bul ve güncelle:

```javascript
📞 *Destek:* 0532 xxx xx xx
```

Gerçek destek numaranızla değiştirin.
