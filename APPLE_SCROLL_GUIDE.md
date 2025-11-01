# 🍎 Apple-Style Scroll Animasyonları Rehberi

## 🎯 Neler Eklendi?

### 1. **HeroSection** - Parallax Hero
Apple.com'daki gibi katmanlı scroll efekti:
- Arka plan yavaş kayar (parallax)
- Metin daha hızlı kayar
- Opacity değişimleri
- Scale animasyonları
- Scroll indicator (fare simgesi)

### 2. **Services** - Fade Up Cards
- Kartlar scroll'da yukarı kayarak beliriyor
- Kademeli delay (0.15s artışlarla)
- Rounded top section (-mt-20 ile overlap)
- Apple tarzı easing: [0.22, 1, 0.36, 1]

### 3. **FeaturesSection** - Animated Stats
- Gradient arka plan animasyonu
- İstatistikler scale ile beliriyor
- Hover'da büyüme efekti
- Pulse eden dekoratif elementler

### 4. **GallerySection** - Testimonials
- Alternatif kartlar farklı yönde hareket ediyor
- Parallax efekti (y1 ve y2)
- Hover animasyonları
- Gradient kartlar

## 🎬 Animasyon Teknikleri

### Scroll-Based Transforms

```tsx
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start start", "end start"],
});

const yText = useTransform(scrollYProgress, [0, 1], [0, -250]);
const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
```

**Nasıl Çalışır:**
- `scrollYProgress`: 0'dan 1'e scroll ilerlemesi
- `useTransform`: Scroll değerini başka bir değere dönüştürür
- `[0, 1]`: Input range (scroll başlangıç-bitiş)
- `[0, -250]`: Output range (transform değerleri)

### Viewport-Based Animations

```tsx
<motion.div
  initial={{ opacity: 0, y: 80 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
>
```

**Parametreler:**
- `initial`: Başlangıç durumu
- `whileInView`: Görünür olduğunda
- `viewport.once`: Sadece bir kez animasyon
- `viewport.margin`: Tetikleme mesafesi (-100px = 100px önce)
- `ease`: Apple tarzı cubic-bezier

## 🎨 Scroll Snap

```css
main {
  scroll-snap-type: y proximity;
}

section {
  scroll-snap-align: start;
  scroll-snap-stop: normal;
}
```

**Ayarlar:**
- `proximity`: Yumuşak snap (mandatory kadar sert değil)
- `start`: Section başlangıcına snap
- `normal`: Smooth scroll korunur

## 📊 Performans Optimizasyonları

### 1. GPU Acceleration
```css
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 2. Transform Usage
Transform ve opacity kullanımı (layout shift yok):
```tsx
style={{ y: yText, opacity: opacityText }}
```

### 3. Will-Change (Otomatik)
Framer Motion otomatik olarak `will-change` ekler.

## 🎯 Kullanım Örnekleri

### Basit Parallax

```tsx
const ref = useRef(null);
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"],
});

const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

return (
  <motion.div ref={ref} style={{ y }}>
    İçerik
  </motion.div>
);
```

### Fade In on Scroll

```tsx
<motion.div
  initial={{ opacity: 0, y: 60 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8 }}
>
  İçerik
</motion.div>
```

### Scale Animation

```tsx
const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

<motion.div style={{ scale }}>
  İçerik
</motion.div>
```

## 🔧 Özelleştirme

### Animasyon Hızını Değiştirme

```tsx
// Daha yavaş
transition={{ duration: 1.2 }}

// Daha hızlı
transition={{ duration: 0.4 }}
```

### Easing Değiştirme

```tsx
// Apple tarzı (varsayılan)
ease: [0.22, 1, 0.36, 1]

// Daha yumuşak
ease: "easeOut"

// Daha sert
ease: "easeInOut"
```

### Parallax Mesafesini Ayarlama

```tsx
// Daha az hareket
const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

// Daha fazla hareket
const y = useTransform(scrollYProgress, [0, 1], [0, -300]);
```

## 🎭 Efekt Kombinasyonları

### Hero Efekti (Apple.com)

```tsx
const yText = useTransform(scrollYProgress, [0, 1], [0, -250]);
const yBg = useTransform(scrollYProgress, [0, 1], [0, 100]);
const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
```

### Card Reveal (Apple Watch)

```tsx
initial={{ opacity: 0, y: 80 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ delay: i * 0.15, duration: 0.8 }}
```

### Stat Counter (Apple Vision Pro)

```tsx
initial={{ opacity: 0, scale: 0.5 }}
whileInView={{ opacity: 1, scale: 1 }}
whileHover={{ scale: 1.1 }}
```

## 📱 Responsive Davranış

Animasyonlar tüm cihazlarda çalışır:

```tsx
// Mobilde daha az hareket
const isMobile = window.innerWidth < 768;
const distance = isMobile ? -100 : -250;

const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
```

## 🐛 Yaygın Sorunlar

### Problem: Animasyon çalışmıyor
**Çözüm**: `'use client'` direktifi ekleyin

### Problem: Scroll çok hızlı
**Çözüm**: `scroll-snap-type: y proximity` kullanın

### Problem: Performans düşük
**Çözüm**: 
- `viewport.once: true` kullanın
- Transform/opacity kullanın (width/height değil)
- `will-change` ekleyin (otomatik)

### Problem: Layout shift
**Çözüm**: 
- `initial` değerlerini ayarlayın
- Min-height belirleyin
- Transform kullanın (position değil)

## 🎨 Renk ve Stil İpuçları

### Gradient Backgrounds

```tsx
className="bg-gradient-to-br from-navy via-navy-light to-teal"
```

### Backdrop Blur

```tsx
className="backdrop-blur-md bg-white/95"
```

### Shadow Layers

```tsx
className="shadow-lg hover:shadow-2xl transition-shadow duration-300"
```

## 🚀 İleri Seviye

### Custom Hook Oluşturma

```tsx
function useParallax(distance = 100) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  
  return { ref, y };
}

// Kullanım
const { ref, y } = useParallax(200);
<motion.div ref={ref} style={{ y }}>...</motion.div>
```

### Scroll Progress Bar

```tsx
const { scrollYProgress } = useScroll();

<motion.div
  style={{ scaleX: scrollYProgress }}
  className="fixed top-0 left-0 right-0 h-1 bg-teal origin-left z-50"
/>
```

### Stagger Children

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {items.map((item) => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

## 📚 Referanslar

- [Framer Motion Docs](https://www.framer.com/motion/)
- [useScroll Hook](https://www.framer.com/motion/use-scroll/)
- [useTransform Hook](https://www.framer.com/motion/use-transform/)
- [Apple.com](https://www.apple.com) - İnspiration

## ✨ Sonuç

Bu setup ile:
- ✅ Apple.com tarzı premium scroll
- ✅ Smooth parallax efektleri
- ✅ Performanslı animasyonlar
- ✅ Responsive tasarım
- ✅ 60 FPS smooth scroll

**Mutlu kodlamalar!** 🚀
