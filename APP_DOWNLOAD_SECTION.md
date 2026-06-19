# Uygulama İndirme Bölümü — 11 Haziran 2026

## Yapılanlar

### Yeni Component: `components/ui/AppDownloadSection.tsx`

Ana sayfaya eklenen uygulama indirme bölümü. Hero section'dan hemen sonra görünür.

**İçerik:**
- "Uygulamamız Yayında" animasyonlu rozet
- Başlık ve açıklama metni
- 4 özellik kartı (rezervasyon, harita, hava durumu, bildirimler)
- **App Store butonu** → `APP_STORE_URL` sabitine bağlı (`id6745787870`)
- **Android APK butonu** → `/public/baliksefasi.apk` dosyasına bağlı
- Telefon mockup (logo + uygulama önizlemesi)
- Animasyonlu ★★★★★ ve "Ücretsiz" rozetleri

**Önemli sabitler (güncellenebilir):**
```ts
const APP_STORE_URL = 'https://apps.apple.com/tr/app/balık-sefası/id6745787870';
const APK_URL = '/baliksefasi.apk'; // /public klasöründe olmalı
```

---

### Değişiklik: `app/page.tsx`

- `AppDownloadSection` import edildi
- Hero section'dan hemen sonra `id="uygulama"` section'ı olarak eklendi

---

### Değişiklik: `eas.json` (mobil proje)

```json
"apk": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

Android APK build almak için:
```bash
eas build --platform android --profile apk
```

---

## APK Yükleme Adımları

1. `eas build --platform android --profile apk` ile build al
2. EAS dashboard'dan `.apk` dosyasını indir
3. `/public/baliksefasi.apk` olarak kaydet
4. Siteyi deploy et → buton otomatik çalışır
