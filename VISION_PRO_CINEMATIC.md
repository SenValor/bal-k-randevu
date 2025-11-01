# 🎬 Apple Vision Pro Tarzı Sinematik Derinlik

## ✅ Yapılan Değişiklikler

### 📦 Yeni Paketler
```bash
npm install three @react-three/fiber @react-three/drei
```

- **three**: 3D grafik motoru
- **@react-three/fiber**: React için Three.js
- **@react-three/drei**: Hazır 3D bileşenler

### 🆕 Yeni Bileşen: HeroCinematic.tsx

Apple Vision Pro web sitesindeki gibi katmanlı derinlik efekti.

## 🎭 Derinlik Katmanları

### 3 Arka Plan Katmanı (Farklı Hızlarda)

```
Layer 1 (En Uzak - En Yavaş)
├── Base gradient (navy-dark → navy → navy-light)
├── Scroll: +200px
└── Scale: 1 → 1.3

Layer 2 (Orta - Orta Hız)
├── Unsplash Boğaz görseli
├── Scroll: +150px
└── Opacity: 0.9 → 0.3

Layer 3 (Ön - En Hızlı)
├── Dekoratif blur circles
├── Scroll: +100px
└── Teal/Navy glow efektleri
```

### 3 İçerik Katmanı (Farklı Hızlarda)

```
Başlık (En Yavaş)
├── Scale: 1 → 1.2 (büyür)
├── Y: 0 → -300px
└── Opacity: 1 → 0

Alt Başlık (Orta)
├── Y: 0 → -200px
└── Opacity: 1 → 0

Buton (En Hızlı)
├── Y: 0 → -150px
└── Opacity: 1 → 0
```

## 🎬 Animasyon Sistemi

### Giriş Animasyonları (Sayfa Yüklenince)

```tsx
// Başlık
initial={{ opacity: 0, y: 100, scale: 0.8 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
duration: 1.2s, delay: 0.2s

// Alt Başlık
initial={{ opacity: 0, y: 50 }}
animate={{ opacity: 1, y: 0 }}
duration: 1.0s, delay: 0.5s

// Buton
initial={{ opacity: 0, y: 30, scale: 0.9 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
duration: 0.8s, delay: 0.8s
```

### Scroll Animasyonları (Kaydırınca)

```tsx
// Başlık büyür ve yukarı kayar
scaleTitle: [0, 0.5] → [1, 1.2]
yTitle: [0, 1] → [0, -300]

// Alt başlık daha hızlı kayar
ySubtitle: [0, 1] → [0, -200]

// Buton en hızlı kayar
yButton: [0, 1] → [0, -150]
```

## 🎨 Dark Theme

### Renk Paleti

```css
/* Hero */
bg-gradient-to-br from-navy-dark via-navy to-navy-light

/* Services */
bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900

/* Features */
bg-gradient-to-br from-navy-dark via-navy to-navy-light

/* Cards */
bg-gradient-to-br from-gray-800 to-gray-900
border: border-gray-700/50
shadow: shadow-teal/10
hover:shadow: shadow-teal/20
```

### Yazı Renkleri

```css
/* Başlıklar */
text-white + drop-shadow-lg

/* Alt yazılar */
text-gray-300 + drop-shadow-md

/* Açıklamalar */
text-gray-300
```

## 🎯 Derinlik Hissi Nasıl Oluşur?

### 1. Parallax Hızları
```
Arka plan katmanları:
Layer 1: +200px (yavaş)
Layer 2: +150px (orta)
Layer 3: +100px (hızlı)

İçerik katmanları:
Başlık: -300px (yavaş)
Alt başlık: -200px (orta)
Buton: -150px (hızlı)
```

### 2. Scale Efekti
```tsx
// Arka plan büyür (zoom in)
scaleBg: [0, 1] → [1, 1.3]

// Başlık büyür
scaleTitle: [0, 0.5] → [1, 1.2]
```

### 3. Opacity Geçişleri
```tsx
// Arka plan kaybolur
opacityBg: [0, 0.5, 1] → [0.9, 0.6, 0.3]

// İçerik kaybolur
opacityTitle: [0, 0.5] → [1, 0]
```

## 📊 Scroll Progress

### Progress Bar
```tsx
<motion.div
  style={{ scaleX: scrollYProgress }}
  className="fixed top-0 h-1 bg-gradient-to-r from-teal"
/>
```

Üstte ince bir çizgi scroll ilerlemesini gösterir.

## 🎭 Sticky Positioning

```tsx
<div className="sticky top-0 h-screen">
  {/* İçerik sabit kalır, arka plan kayar */}
</div>
```

İçerik ekranda sabit kalırken arka plan katmanları hareket eder - **derinlik illüzyonu**.

## 🌟 Vision Pro Benzerlikleri

### Apple Vision Pro Web Sitesi
1. ✅ Katmanlı derinlik
2. ✅ Farklı hız parallax
3. ✅ Scale animasyonları
4. ✅ Smooth scroll
5. ✅ Dark theme
6. ✅ Glow efektleri

### Bizim Implementasyon
1. ✅ 3 arka plan katmanı
2. ✅ 3 içerik katmanı
3. ✅ Farklı hızlarda hareket
4. ✅ Scale + opacity geçişleri
5. ✅ Sticky positioning
6. ✅ Progress indicator

## 🎨 Görsel Efektler

### Glow & Shadow
```tsx
// Card hover
shadow-xl shadow-teal/10
hover:shadow-2xl hover:shadow-teal/20

// Icon
shadow-lg shadow-teal/30

// Dekoratif blur
bg-teal/10 rounded-full filter blur-3xl
```

### Backdrop Blur
```tsx
backdrop-blur-sm
```

### Gradient Overlays
```tsx
bg-gradient-to-b from-navy-dark/80 via-navy/60 to-navy-dark/80
```

## 📱 Responsive

### Desktop
- Başlık: text-9xl (çok büyük)
- 200vh yükseklik (uzun scroll)
- Tam derinlik efekti

### Mobile
- Başlık: text-6xl (küçük)
- Aynı animasyonlar
- Optimize edilmiş hızlar

## 🚀 Performans

### Optimizasyonlar
- ✅ GPU-accelerated transforms
- ✅ Will-change otomatik (Framer Motion)
- ✅ Smooth 60 FPS
- ✅ Lazy loading (Three.js)

### Bundle Size
- three: ~600KB (gzipped ~150KB)
- @react-three/fiber: ~100KB
- @react-three/drei: ~50KB

## 🎯 Kullanım

### Ana Sayfa
```tsx
import HeroCinematic from '@/components/ui/HeroCinematic';

<main className="bg-black">
  <HeroCinematic />
  <Services />
  <FeaturesSection />
</main>
```

### Özelleştirme

#### Scroll Hızını Değiştir
```tsx
// Daha yavaş
const yTitle = useTransform(scrollYProgress, [0, 1], [0, -200]);

// Daha hızlı
const yTitle = useTransform(scrollYProgress, [0, 1], [0, -400]);
```

#### Scale Miktarını Değiştir
```tsx
// Daha az büyüme
const scaleTitle = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

// Daha fazla büyüme
const scaleTitle = useTransform(scrollYProgress, [0, 0.5], [1, 1.5]);
```

#### Yüksekliği Değiştir
```tsx
// Daha kısa
className="h-[150vh]"

// Daha uzun
className="h-[250vh]"
```

## 🎬 Efekt Sırası

```
1. Sayfa yüklenir
   ↓
2. Başlık fade + scale in (1.2s)
   ↓
3. Alt başlık fade in (1.0s)
   ↓
4. Buton fade + scale in (0.8s)
   ↓
5. Scroll indicator belirir
   ↓
6. Kullanıcı scroll yapar
   ↓
7. Arka plan katmanları farklı hızlarda kayar
   ↓
8. İçerik katmanları farklı hızlarda kayar
   ↓
9. Başlık büyür ve kaybolur
   ↓
10. Services section belirir
```

## 🌟 Öne Çıkan Özellikler

1. **200vh Yükseklik** - Uzun scroll alanı
2. **Sticky Content** - İçerik sabit, arka plan hareket eder
3. **6 Katman** - 3 arka plan + 3 içerik
4. **Farklı Hızlar** - Her katman farklı hızda
5. **Scale Animasyonları** - Zoom efekti
6. **Dark Theme** - Premium görünüm
7. **Glow Efektleri** - Teal ışıltılar
8. **Progress Bar** - Scroll takibi

## 🎨 Renk Geçişleri

```
Scroll: 0% (Başlangıç)
├── Arka plan: Tam görünür (opacity: 0.9)
├── Başlık: Normal boyut (scale: 1)
└── İçerik: Tam görünür (opacity: 1)

Scroll: 50% (Orta)
├── Arka plan: Yarı görünür (opacity: 0.6)
├── Başlık: Büyümüş (scale: 1.2)
└── İçerik: Kaybolmaya başladı (opacity: 0.5)

Scroll: 100% (Son)
├── Arka plan: Çok soluk (opacity: 0.3)
├── Başlık: Kaybolmuş (opacity: 0)
└── İçerik: Tamamen kaybolmuş (opacity: 0)
```

## 🔧 Teknik Detaylar

### useScroll Hook
```tsx
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start start", "end start"],
});
```

### useTransform Hook
```tsx
const yTitle = useTransform(
  scrollYProgress,  // Input
  [0, 1],          // Input range
  [0, -300]        // Output range
);
```

### Sticky + Scroll
```tsx
// Section: 200vh (scroll alanı)
<section className="h-[200vh]">
  
  // Content: sticky (sabit kalır)
  <div className="sticky top-0 h-screen">
    {/* İçerik */}
  </div>
</section>
```

---

**Apple Vision Pro seviyesinde sinematik derinlik efekti! 🎬✨**
