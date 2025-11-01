# 🍎 Apple Dock Rehberi

## ✅ Oluşturulan Dosyalar

1. **components/ui/Dock.tsx** - Ana Dock bileşeni
2. **components/ui/Dock.css** - Apple tarzı stiller
3. **components/ui/DockWrapper.tsx** - Layout için wrapper
4. **app/layout.tsx** - Dock entegrasyonu

## 🎯 Özellikler

### Apple macOS Dock Benzerlikleri

1. ✅ **Magnification Effect** - İkonlar hover'da büyür
2. ✅ **Smooth Spring Animation** - Yumuşak geçişler
3. ✅ **Tooltip Labels** - Hover'da isim gösterir
4. ✅ **Glassmorphism** - Yarı saydam blur efekti
5. ✅ **Distance-Based Scaling** - Mesafeye göre büyüme
6. ✅ **Touch Support** - Mobil uyumlu

## 🎨 Görsel Tasarım

### Panel Özellikleri
```css
Background: rgba(6, 0, 16, 0.75)
Backdrop Filter: blur(20px) saturate(180%)
Border: 1px solid rgba(255, 255, 255, 0.1)
Border Radius: 20px
Shadow: Multi-layer (depth effect)
```

### İkon Özellikleri
```css
Background: Linear gradient (teal/navy)
Border: 1px solid rgba(255, 255, 255, 0.15)
Border Radius: 14px
Shadow: Glow effect on hover
Size: 50px base → 70px magnified
```

### Tooltip
```css
Background: rgba(20, 20, 30, 0.95)
Backdrop Filter: blur(10px)
Font Size: 12px
Arrow: CSS triangle
```

## 🎬 Animasyon Sistemi

### Magnification Logic

```tsx
// Mouse pozisyonunu takip et
const mouseX = useMotionValue(Infinity);

// İkon ile mouse arası mesafe
const distanceCalc = useTransform(mouseX, (val: number) => {
  const bounds = ref.current?.getBoundingClientRect();
  return val - bounds.x - bounds.width / 2;
});

// Mesafeye göre boyut
const widthSync = useTransform(
  distanceCalc,
  [-distance, 0, distance],
  [baseSize, magnification, baseSize]
);

// Spring animation
const width = useSpring(widthSync, {
  mass: 0.1,
  stiffness: 150,
  damping: 12
});
```

### Spring Parametreleri

```tsx
{
  mass: 0.1,        // Hafif (hızlı tepki)
  stiffness: 150,   // Orta sertlik
  damping: 12       // Yumuşak durma
}
```

**Etki:**
- `mass` ↓ = Daha hızlı hareket
- `stiffness` ↑ = Daha sert yay
- `damping` ↑ = Daha az sallanma

## 📊 Props API

### Dock Component

```tsx
interface DockProps {
  items: DockItem[];           // Zorunlu
  panelHeight?: number;        // Default: 68
  baseItemSize?: number;       // Default: 50
  magnification?: number;      // Default: 70
  distance?: number;           // Default: 140
  spring?: SpringConfig;       // Default: { mass: 0.1, ... }
}
```

### DockItem

```tsx
interface DockItem {
  icon: ReactNode;            // Zorunlu - Lucide icon
  label: string;              // Zorunlu - Tooltip text
  onClick: () => void;        // Zorunlu - Click handler
  className?: string;         // Opsiyonel - Custom style
}
```

## 🎯 Kullanım Örnekleri

### Basit Kullanım

```tsx
import Dock from "@/components/ui/Dock";
import { Home, Calendar } from "lucide-react";

const items = [
  {
    icon: <Home size={20} />,
    label: "Ana Sayfa",
    onClick: () => router.push("/")
  },
  {
    icon: <Calendar size={20} />,
    label: "Takvim",
    onClick: () => router.push("/calendar")
  }
];

<Dock items={items} />
```

### Özelleştirilmiş

```tsx
<Dock
  items={items}
  panelHeight={80}           // Daha yüksek panel
  baseItemSize={60}          // Daha büyük ikonlar
  magnification={90}         // Daha fazla büyüme
  distance={200}             // Daha geniş etki alanı
  spring={{
    mass: 0.05,              // Daha hızlı
    stiffness: 200,          // Daha sert
    damping: 15              // Daha az sallanma
  }}
/>
```

### Custom İkonlar

```tsx
import { Anchor, Fish, Users, Settings } from "lucide-react";

const items = [
  {
    icon: <Anchor size={20} className="text-teal" />,
    label: "Tekneler",
    onClick: () => router.push("/boats")
  },
  {
    icon: <Fish size={20} className="text-teal-light" />,
    label: "Balık Avı",
    onClick: () => router.push("/fishing")
  }
];
```

## 🎨 Stil Özelleştirme

### CSS Variables

```css
/* Dock.css içinde değiştir */

/* Panel rengi */
background: rgba(6, 0, 16, 0.75);  /* Daha koyu */
background: rgba(20, 20, 30, 0.8); /* Daha açık */

/* Blur miktarı */
backdrop-filter: blur(20px);  /* Daha bulanık */
backdrop-filter: blur(10px);  /* Daha net */

/* Border radius */
border-radius: 20px;  /* Daha oval */
border-radius: 12px;  /* Daha köşeli */
```

### İkon Renkleri

```css
.dock-icon {
  /* Teal gradient */
  background: linear-gradient(135deg, 
    rgba(0, 169, 165, 0.15), 
    rgba(0, 68, 136, 0.15)
  );
}

.dock-icon:hover {
  /* Daha parlak */
  background: linear-gradient(135deg, 
    rgba(0, 169, 165, 0.25), 
    rgba(0, 68, 136, 0.25)
  );
}
```

## 📱 Responsive Davranış

### Desktop (>1024px)
- Panel: 68px yükseklik
- İkonlar: 50px → 70px
- Gap: 8px
- Padding: 8px 16px

### Tablet (769-1024px)
- Panel: 68px yükseklik
- Gap: 7px
- Padding: 7px 14px

### Mobile (<768px)
- Panel: 68px yükseklik
- Gap: 6px
- Padding: 6px 12px
- Border radius: 16px
- Font size: 11px

## 🎯 Pozisyonlama

```css
.dock-container {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
}
```

**Özellikler:**
- `fixed`: Scroll'da sabit kalır
- `bottom: 12px`: Alt boşluk
- `left: 50%` + `translateX(-50%)`: Ortala
- `z-index: 9999`: Her şeyin üstünde

## 🎬 Animasyon Detayları

### Hover Animasyonu

```tsx
// 1. Mouse pozisyonu güncellenir
onMouseMove={(e) => mouseX.set(e.pageX)}

// 2. Her ikon mesafeyi hesaplar
const distanceCalc = useTransform(mouseX, ...)

// 3. Mesafeye göre boyut belirlenir
const widthSync = useTransform(distanceCalc, ...)

// 4. Spring animation uygulanır
const width = useSpring(widthSync, springConfig)

// 5. İkon boyutu değişir
style={{ width, height: width }}
```

### Tooltip Animasyonu

```tsx
<AnimatePresence>
  {isHovered && (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.div>
  )}
</AnimatePresence>
```

### Tap Animasyonu

```tsx
whileTap={{ scale: 0.9 }}
```

## 🎨 Glow Efektleri

### Normal Durum
```css
box-shadow: 
  0 4px 12px rgba(0, 0, 0, 0.3),
  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
```

### Hover Durum
```css
box-shadow: 
  0 6px 20px rgba(0, 169, 165, 0.3),
  0 0 0 1px rgba(0, 169, 165, 0.2) inset;
```

## 🔧 Troubleshooting

### İkonlar Büyümüyor
```tsx
// Mouse tracking kontrol et
onMouseMove={(e) => mouseX.set(e.pageX)}
onMouseLeave={() => mouseX.set(Infinity)}
```

### Tooltip Görünmüyor
```tsx
// z-index kontrol et
.dock-tooltip {
  z-index: 10000;
}
```

### Animasyon Yavaş
```tsx
// Spring parametrelerini ayarla
spring={{
  mass: 0.05,      // Daha hızlı
  stiffness: 200,  // Daha sert
  damping: 15      // Daha az sallanma
}}
```

## 🎯 Best Practices

### 1. İkon Sayısı
- **Optimal:** 4-6 ikon
- **Maksimum:** 8 ikon
- Daha fazla ikon ekranı doldurur

### 2. İkon Boyutları
```tsx
baseItemSize: 50    // Küçük ekranlar
magnification: 70   // %40 büyüme

baseItemSize: 60    // Büyük ekranlar
magnification: 90   // %50 büyüme
```

### 3. Distance Parametresi
```tsx
distance: 140  // Normal (3 ikon etkilenir)
distance: 200  // Geniş (4-5 ikon etkilenir)
distance: 100  // Dar (2 ikon etkilenir)
```

### 4. Accessibility
```tsx
// Keyboard navigation
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      item.onClick();
    }
  }}
>
```

## 🌟 Gelişmiş Özellikler

### Dinamik İkonlar

```tsx
const [items, setItems] = useState([...]);

// Yeni ikon ekle
setItems([...items, newItem]);

// İkon kaldır
setItems(items.filter(item => item.label !== "X"));
```

### Notification Badge

```tsx
// DockItem'a badge ekle
interface DockItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;  // Yeni!
}

// Render
{item.badge && (
  <div className="dock-badge">{item.badge}</div>
)}
```

### Active State

```tsx
// DockItem'a active ekle
interface DockItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;  // Yeni!
}

// Style
className={`dock-icon ${item.active ? 'active' : ''}`}
```

## 📊 Performans

### Optimizasyonlar
- ✅ `will-change: width, height`
- ✅ GPU-accelerated transforms
- ✅ RequestAnimationFrame (Framer Motion)
- ✅ Pointer-events optimization
- ✅ Minimal re-renders

### Bundle Size
- Dock.tsx: ~2KB
- Dock.css: ~1KB
- Framer Motion: Zaten yüklü

## 🎉 Sonuç

### Eklenen Özellikler
- ✅ Apple macOS Dock benzeri UI
- ✅ Magnification effect
- ✅ Smooth spring animations
- ✅ Tooltip labels
- ✅ Glassmorphism design
- ✅ Mobile responsive
- ✅ Touch support

### Kullanım
- ✅ Tüm sayfalarda alt kısımda
- ✅ 4 varsayılan ikon (Home, Calendar, User, Settings)
- ✅ Özelleştirilebilir
- ✅ Performanslı

---

**Apple Dock tarzı premium navigasyon! 🍎✨**
