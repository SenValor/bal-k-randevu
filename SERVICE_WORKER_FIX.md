# 🔧 Service Worker Cache Temizleme

## ❌ Sorun
Firebase Storage Rules güncellenmiş ama görseller hala yüklenmiyor.
Service Worker eski CORS ayarlarını cache'lemiş.

## ✅ Çözüm

### Adım 1: Service Worker'ı Temizle

1. **DevTools'u Aç**: `Cmd + Option + I` (Mac) veya `F12`
2. **Application** sekmesine git
3. Sol menüden **Service Workers** seç
4. Tüm service worker'ları **Unregister** et
5. **Storage** > **Clear site data** tıkla
6. Tüm seçenekleri işaretle ve **Clear data** tıkla

### Adım 2: Hard Refresh

Tarayıcıyı tamamen yenile:
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

### Adım 3: Incognito/Private Mode'da Test Et

Yeni bir gizli pencere aç ve test et:
- **Mac**: `Cmd + Shift + N`
- **Windows**: `Ctrl + Shift + N`

URL: `http://localhost:3000`

## 🎯 Beklenen Sonuç

Console'da şunu göreceksin:
```
✅ Görsel yüklendi: https://firebasestorage.googleapis.com/...
```

Ve görseller ana sayfada görünecek! 🎨
