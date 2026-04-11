# 📱 Meta WhatsApp Template Kurulum Rehberi

## 🎯 Doğrulama Kodu Template'i Oluşturma

WhatsApp telefon doğrulama sistemi için Meta Business Manager'da yeni bir template oluşturmanız gerekiyor.

---

## 📋 Adım Adım Kurulum

### 1️⃣ Meta Business Manager'a Giriş

1. https://business.facebook.com adresine git
2. WhatsApp hesabınızı seç
3. Sol menüden **"WhatsApp Manager"** seç
4. **"Message Templates"** bölümüne git

### 2️⃣ Yeni Template Oluştur

**"Create Template"** butonuna tıkla ve aşağıdaki bilgileri gir:

---

## 📝 Template Bilgileri

### **Template Name (Şablon Adı)**
```
verification_code
```
⚠️ **ÖNEMLİ:** Bu isim kodda kullanılıyor, değiştirmeyin!

---

### **Category (Kategori)**
```
AUTHENTICATION
```
⚠️ **ÖNEMLİ:** Bu kategori seçilmeli! Doğrulama kodları için **ücretsiz** mesaj gönderimi sağlar.

---

### **Language (Dil)**
```
Turkish (tr)
```

---

### **Header (Başlık)**
```
Yok (boş bırak)
```
Opsiyonel - İsterseniz ekleyebilirsiniz ama gerekli değil.

---

### **Body (Mesaj İçeriği)**

Aşağıdaki metni **tam olarak** kopyalayın:

```
Merhaba! 👋

Balık Sefası rezervasyon doğrulama kodunuz:

*{{1}}*

Bu kodu 5 dakika içinde girin. Kimseyle paylaşmayın.

🔒 Güvenliğiniz için bu kod sadece bir kez kullanılabilir.
```

**Değişken Açıklaması:**
- `{{1}}` → Doğrulama kodu (örn: 123456)

---

### **Footer (Alt Bilgi)**
```
Balık Sefası - İstanbul Boğazı
```
Opsiyonel - İsterseniz ekleyebilirsiniz.

---

### **Buttons (Butonlar)**
```
Yok (boş bırak)
```
Doğrulama kodu için buton gerekmez.

---

## 3️⃣ Template'i Kaydet ve Gönder

1. **"Submit"** butonuna tıkla
2. Meta'nın incelemesini bekle

---

## ⏱️ Onay Süresi

- **Normal Süre:** 1-24 saat
- **Hızlı Onay:** Bazen 1 saat içinde
- **Gecikme:** Nadiren 48 saate kadar çıkabilir

### Onay Durumunu Kontrol Etme

1. Meta Business Manager → Message Templates
2. Template listesinde `verification_code` şablonunu bul
3. Durum sütununda:
   - 🟡 **Pending** → İnceleniyor
   - 🟢 **Approved** → Onaylandı, kullanıma hazır!
   - 🔴 **Rejected** → Reddedildi (sebep gösterilir)

---

## ✅ Onaylandıktan Sonra

Template onaylandığında sistem **otomatik olarak çalışmaya başlar!**

Hiçbir kod değişikliği gerekmez. Sadece:

1. Template onayını bekle
2. Onaylandığında test et
3. Kullanmaya başla!

---

## 🧪 Test Etme

Template onaylandıktan sonra test için:

1. Website'e git: http://localhost:3000/rezervasyon
2. Rezervasyon işlemini başlat
3. Telefon numaranı gir
4. WhatsApp'ına kod gelecek
5. Kodu gir ve doğrula

---

## 🚨 Sorun Giderme

### Template Reddedilirse

**Olası Sebepler:**
- Kategori yanlış seçilmiş (AUTHENTICATION olmalı)
- Mesaj içeriği politikalara uygun değil
- Değişken formatı yanlış ({{1}} olmalı)

**Çözüm:**
1. Ret sebebini oku
2. Gerekli düzeltmeleri yap
3. Tekrar gönder

### Template Onaylanmıyor

**48 saatten uzun sürüyorsa:**
1. Meta Business Support'a ulaş
2. Template ID'yi belirt
3. Durum sorgula

---

## 💰 Maliyet

### Authentication Kategorisi
- ✅ **Tamamen Ücretsiz!**
- Meta, doğrulama kodları için ücret almaz
- Sınırsız doğrulama kodu gönderebilirsiniz

### Diğer Kategoriler (Bilgi için)
- Marketing: Ücretli
- Utility: Ücretli
- Service: Ücretli

⚠️ **Mutlaka AUTHENTICATION kategorisi seçin!**

---

## 📊 Örnek Template Görünümü

WhatsApp'ta müşteriye şöyle görünecek:

```
┌─────────────────────────────────┐
│  Balık Sefası                    │
├─────────────────────────────────┤
│  Merhaba! 👋                     │
│                                  │
│  Balık Sefası rezervasyon       │
│  doğrulama kodunuz:             │
│                                  │
│  *123456*                        │
│                                  │
│  Bu kodu 5 dakika içinde girin. │
│  Kimseyle paylaşmayın.          │
│                                  │
│  🔒 Güvenliğiniz için bu kod    │
│  sadece bir kez kullanılabilir. │
├─────────────────────────────────┤
│  Balık Sefası - İstanbul Boğazı │
└─────────────────────────────────┘
```

---

## 🔧 Teknik Detaylar

### API Çağrısı

Kod şu şekilde gönderilir:

```javascript
{
  "messaging_product": "whatsapp",
  "to": "905551234567",
  "type": "template",
  "template": {
    "name": "verification_code",
    "language": { "code": "tr" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "123456" }
        ]
      }
    ]
  }
}
```

### Değişken Eşleştirme

- `{{1}}` → `parameters[0].text` → Doğrulama kodu

---

## 📞 Destek

### Meta Business Support
- https://business.facebook.com/support
- WhatsApp Business API Support

### Proje Desteği
- Kod sorunları için: Developer
- Template sorunları için: Meta Support

---

## ✨ Özet Kontrol Listesi

Kurulum tamamlandığında:

- [ ] Template adı: `verification_code`
- [ ] Kategori: `AUTHENTICATION`
- [ ] Dil: Turkish (tr)
- [ ] Body'de `{{1}}` değişkeni var
- [ ] Template gönderildi
- [ ] Onay bekleniyor/alındı
- [ ] Test edildi
- [ ] Çalışıyor! 🎉

---

**Template onaylandığında sistem hazır! Fake rezervasyonlar engellenecek! 🚀**
