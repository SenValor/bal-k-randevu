# Bileşen Dokümantasyonu

## 🎬 Motion Components (Animasyon Wrapper'ları)

### FadeIn

Scroll yapıldığında içeriği yumuşak bir şekilde görünür hale getirir.

```tsx
import FadeIn from '@/components/motion/FadeIn';

<FadeIn delay={0.2} duration={0.6}>
  <div>İçerik</div>
</FadeIn>
```

**Props:**
- `children`: ReactNode - Animasyonlu içerik
- `delay?`: number - Animasyon başlangıç gecikmesi (saniye, varsayılan: 0)
- `duration?`: number - Animasyon süresi (saniye, varsayılan: 0.6)
- `className?`: string - Ek CSS sınıfları

### SlideUp

İçeriği aşağıdan yukarı kaydırarak görünür hale getirir.

```tsx
import SlideUp from '@/components/motion/SlideUp';

<SlideUp delay={0.3} distance={30}>
  <div>İçerik</div>
</SlideUp>
```

**Props:**
- `children`: ReactNode - Animasyonlu içerik
- `delay?`: number - Animasyon başlangıç gecikmesi (varsayılan: 0)
- `duration?`: number - Animasyon süresi (varsayılan: 0.6)
- `distance?`: number - Kaydırma mesafesi px (varsayılan: 30)
- `className?`: string - Ek CSS sınıfları

### SlideIn

İçeriği yandan kaydırarak görünür hale getirir.

```tsx
import SlideIn from '@/components/motion/SlideIn';

<SlideIn direction="left" delay={0.4}>
  <div>İçerik</div>
</SlideIn>
```

**Props:**
- `children`: ReactNode - Animasyonlu içerik
- `delay?`: number - Animasyon başlangıç gecikmesi (varsayılan: 0)
- `duration?`: number - Animasyon süresi (varsayılan: 0.6)
- `distance?`: number - Kaydırma mesafesi px (varsayılan: 30)
- `direction?`: 'left' | 'right' - Kaydırma yönü (varsayılan: 'left')
- `className?`: string - Ek CSS sınıfları

## 🎨 UI Components

### Button

Modern, animasyonlu buton bileşeni.

```tsx
import Button from '@/components/ui/Button';

<Button 
  variant="primary" 
  size="lg" 
  onClick={() => console.log('Tıklandı')}
>
  Rezervasyon Yap
</Button>
```

**Props:**
- `children`: ReactNode - Buton içeriği
- `variant?`: 'primary' | 'secondary' | 'outline' - Buton stili (varsayılan: 'primary')
- `size?`: 'sm' | 'md' | 'lg' - Buton boyutu (varsayılan: 'md')
- `fullWidth?`: boolean - Tam genişlik (varsayılan: false)
- `className?`: string - Ek CSS sınıfları
- Tüm HTML button özellikleri

**Variants:**
- `primary`: Teal arka plan, beyaz yazı
- `secondary`: Navy arka plan, beyaz yazı
- `outline`: Şeffaf arka plan, navy kenarlık

**Sizes:**
- `sm`: Küçük (px-4 py-2)
- `md`: Orta (px-6 py-3)
- `lg`: Büyük (px-8 py-4)

### Card

Hizmet kartları için kullanılan bileşen.

```tsx
import Card from '@/components/ui/Card';
import { Anchor } from 'lucide-react';

<Card
  icon={Anchor}
  title="Tekne Kiralama"
  description="Lüks teknelerimizle Boğaz'ın eşsiz manzarasının keyfini çıkarın"
  onClick={() => console.log('Kart tıklandı')}
/>
```

**Props:**
- `icon`: LucideIcon - Lucide React ikonu
- `title`: string - Kart başlığı
- `description`: string - Kart açıklaması
- `onClick?`: () => void - Tıklama olayı
- `className?`: string - Ek CSS sınıfları

**Özellikler:**
- Hover'da yukarı kayma animasyonu
- Gradient ikon arka planı
- Shadow efektleri
- Responsive tasarım

### Header

Sabit üst header bileşeni.

```tsx
import Header from '@/components/ui/Header';

<Header />
```

**Özellikler:**
- Sabit pozisyon (fixed top)
- Logo ve marka adı
- Kullanıcı ikonu
- Blur arka plan efekti
- Scroll'da gölge

### Navigation

Alt navigation bar bileşeni.

```tsx
import Navigation from '@/components/ui/Navigation';

<Navigation />
```

**Özellikler:**
- Sabit pozisyon (fixed bottom)
- 3 navigasyon öğesi:
  - Ana Sayfa
  - Rezervasyonlarım
  - Profil
- Aktif tab göstergesi
- Smooth geçiş animasyonları
- Layout animation (Framer Motion)

## 🎯 Kullanım Örnekleri

### Animasyonlu Bölüm

```tsx
<section className="py-16">
  <SlideUp delay={0.2}>
    <h2 className="text-3xl font-bold text-center">Başlık</h2>
  </SlideUp>

  <div className="grid grid-cols-3 gap-8 mt-8">
    <SlideUp delay={0.3}>
      <Card icon={Icon1} title="Başlık 1" description="Açıklama 1" />
    </SlideUp>
    <SlideUp delay={0.4}>
      <Card icon={Icon2} title="Başlık 2" description="Açıklama 2" />
    </SlideUp>
    <SlideUp delay={0.5}>
      <Card icon={Icon3} title="Başlık 3" description="Açıklama 3" />
    </SlideUp>
  </div>
</section>
```

### Hero Bölümü

```tsx
<section className="relative h-screen">
  <div className="absolute inset-0 bg-gradient-to-br from-navy to-teal" />
  
  <div className="relative z-10 flex items-center justify-center h-full">
    <FadeIn delay={0.2}>
      <h1 className="text-6xl font-bold text-white">
        Hoş Geldiniz
      </h1>
    </FadeIn>
    
    <FadeIn delay={0.4}>
      <p className="text-xl text-white/90 mt-4">
        Alt başlık
      </p>
    </FadeIn>
    
    <FadeIn delay={0.6}>
      <Button variant="primary" size="lg">
        Başla
      </Button>
    </FadeIn>
  </div>
</section>
```

### Kart Grid'i

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {services.map((service, index) => (
    <SlideUp key={service.id} delay={0.2 + index * 0.1}>
      <Card
        icon={service.icon}
        title={service.title}
        description={service.description}
        onClick={() => handleServiceClick(service.id)}
      />
    </SlideUp>
  ))}
</div>
```

## 🎨 Stil Özelleştirme

### Renk Değişkenleri

```css
/* tailwind.config.ts */
colors: {
  navy: {
    DEFAULT: '#003366',
    dark: '#002244',
    light: '#004488',
  },
  teal: {
    DEFAULT: '#00A9A5',
    light: '#00C9C5',
    dark: '#008985',
  },
}
```

### Animasyon Timing

```tsx
// Hızlı animasyon
<SlideUp duration={0.4}>...</SlideUp>

// Yavaş animasyon
<SlideUp duration={1.0}>...</SlideUp>

// Gecikmeli başlangıç
<FadeIn delay={0.5}>...</FadeIn>
```

## 🔧 İleri Seviye Kullanım

### Özel Easing

```tsx
// SlideUp.tsx içinde
transition={{ 
  duration, 
  delay, 
  ease: [0.22, 1, 0.36, 1] // Apple tarzı easing
}}
```

### Viewport Margin

```tsx
// FadeIn.tsx içinde
const isInView = useInView(ref, { 
  once: true, 
  margin: '-100px' // Görünüm eşiği
});
```

### Layout Animations

```tsx
<motion.div layoutId="uniqueId">
  {/* İçerik */}
</motion.div>
```

## 📱 Responsive Kullanım

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobil: 1 sütun, Tablet: 2 sütun, Desktop: 3 sütun */}
</div>

<h1 className="text-3xl md:text-4xl lg:text-6xl">
  {/* Responsive font boyutları */}
</h1>
```

## 🎭 Performans İpuçları

1. **Lazy Loading**: Büyük bileşenleri dinamik import ile yükleyin
2. **Memoization**: Sık render olan bileşenlerde `React.memo` kullanın
3. **Viewport Optimization**: `margin` prop'u ile animasyon tetikleme noktasını ayarlayın
4. **Once Property**: `once: true` ile animasyonları sadece bir kez çalıştırın

```tsx
// Performanslı kullanım
const isInView = useInView(ref, { 
  once: true,        // Sadece bir kez animasyon
  margin: '-100px'   // Erken tetikleme
});
```
