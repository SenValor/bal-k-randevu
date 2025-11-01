# 🔄 Cache Temizleme Rehberi

## Sorun
Kullanıcılar yeni sistemi göremiyorlar çünkü tarayıcıları eski JavaScript/CSS dosyalarını cache'den yüklüyor.

## ✅ Uygulanan Çözümler

### 1. Otomatik Cache Temizleme (Version Sistemi)
- Ana sayfada (`/src/app/page.tsx`) otomatik version kontrolü yapılıyor
- Yeni versiyon tespit edildiğinde:
  - Tüm cache'ler temizleniyor
  - localStorage temizleniyor (Firebase auth korunuyor)
  - Kullanıcıya bildirim gösteriliyor
  - 3 saniye sonra sayfa otomatik yenileniyor

**Her yeni deploy'da yapılması gerekenler:**
```typescript
// /src/app/page.tsx dosyasında APP_VERSION değerini artırın
const APP_VERSION = '2.0.0'; // → '2.0.1', '2.1.0', vb.
```

### 2. Agresif Cache-Control Headers
`next.config.ts` dosyasına eklenen header'lar:
```typescript
{
  key: 'Cache-Control',
  value: 'no-cache, no-store, must-revalidate, max-age=0',
},
{
  key: 'Pragma',
  value: 'no-cache',
},
{
  key: 'Expires',
  value: '0',
}
```

### 3. Cache Temizleme Script'i
`/public/clear-cache.js` dosyası:
- Service Worker'ları temizler
- Cache Storage'ı temizler
- Eski localStorage verilerini temizler

### 4. Kullanıcı Bildirimi
Yeni versiyon yüklendiğinde üstte mavi banner gösteriliyor:
```
🎉 Yeni versiyon yükleniyor! Sayfa otomatik yenilenecek...
```

## 📋 Deploy Checklist

Her yeni deploy öncesi:

1. ✅ `APP_VERSION` değerini artırın (`/src/app/page.tsx`)
2. ✅ Build alın: `npm run build`
3. ✅ Deploy edin
4. ✅ İlk kullanıcı sayfayı açtığında otomatik cache temizlenecek

## 🔧 Manuel Cache Temizleme (Kullanıcılar İçin)

Eğer otomatik sistem çalışmazsa, kullanıcılara şu adımları söyleyin:

### Chrome/Edge:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbelleğe alınmış resimler ve dosyalar" seçin
3. "Verileri temizle" butonuna tıklayın
4. Sayfayı yenileyin: `Ctrl + F5` (Windows) veya `Cmd + Shift + R` (Mac)

### Safari:
1. `Cmd + Option + E` - Cache'i temizle
2. Sayfayı yenileyin: `Cmd + R`

### Firefox:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbellek" seçin
3. "Şimdi Temizle" butonuna tıklayın
4. Sayfayı yenileyin: `Ctrl + F5` (Windows) veya `Cmd + Shift + R` (Mac)

## 🎯 Sonuç

Bu sistem sayesinde:
- ✅ Kullanıcılar her zaman en güncel versiyonu görecek
- ✅ Cache sorunları otomatik çözülecek
- ✅ Manuel müdahale gerekmeyecek
- ✅ Yeni özellikler anında yayınlanacak

## 📞 Destek

Sorun devam ederse:
- WhatsApp: +90 531 089 25 37
- Email: info@baliksefasi.com
