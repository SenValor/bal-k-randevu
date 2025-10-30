# 🍎 Apple Vision Pro Glass Menu Rehberi

## ✅ Oluşturulan Dosyalar

1. **components/ui/GlassMenu.tsx** - Glassmorphism menü
2. **components/ui/Header.tsx** - Dark theme header (güncellendi)

## 🎯 Özellikler

### Apple Vision Pro Tarzı Glassmorphism

1. ✅ **Backdrop Blur** - 20px blur efekti
2. ✅ **Yarı Saydam** - from-gray-900/95 to-black/95
3. ✅ **Spring Animations** - stiffness: 120, damping: 15
4. ✅ **Responsive Design** - Mobile bottom sheet, desktop top-right panel
5. ✅ **Icon Animations** - Hamburger ↔ X geçişi
6. ✅ **Hover Effects** - Scale 1.05 + color transitions

## 🎨 Tasarım

### Hamburger Button
```tsx
- Size: 48x48px
- Background: white/10 + backdrop-blur
- Border: white/20
- Icon: Menu/X (lucide-react)
- Hover: scale 1.05
- Tap: scale 0.95
```

### Mobile Menu (Bottom Sheet)
```tsx
- Height: 85vh
- Position: Fixed bottom
- Border Radius: rounded-t-3xl (top)
- Handle Bar: 48x6px white/30
- Items: 2xl font, full width
- Icon Box: 48x48px gradient
```

### Desktop Menu (Top Right)
```tsx
- Width: 340px
- Position: Fixed top-right
- Border Radius: rounded-3xl (all)
- Items: lg font, compact
- Icon Box: 40x40px gradient
- Shadow: 2xl
```

## 🎬 Animasyonlar

### Menu Open/Close
```tsx
// Mobile (Bottom Sheet)
initial: { y: "100%", opacity: 0 }
animate: { y: 0, opacity: 1 }
exit: { y: "100%", opacity: 0 }

// Desktop (Top Right)
initial: { scale: 0.9, opacity: 0, y: -20 }
animate: { scale: 1, opacity: 1, y: 0 }
exit: { scale: 0.9, opacity: 0, y: -20 }

// Spring Config
type: "spring"
stiffness: 120
damping: 15
```

### Icon Transition
```tsx
// Menu → X
initial: { rotate: 90, opacity: 0 }
animate: { rotate: 0, opacity: 1 }
exit: { rotate: -90, opacity: 0 }
duration: 0.2s
```

### Menu Items
```tsx
// Stagger animation
delay: index * 0.1 (mobile)
delay: index * 0.08 (desktop)

// Hover
scale: 1.02 (mobile)
scale: 1.05, x: 4 (desktop)
```

## 📱 Responsive Breakpoints

### Mobile (<768px)
- Bottom sheet style
- Full width
- 85vh height
- Handle bar visible
- Large touch targets (py-5)
- 2xl font size

### Desktop (≥768px)
- Top-right panel
- 340px width
- Auto height
- No handle bar
- Compact items (py-3)
- lg font size

## 🎨 Color Scheme

### Background
```css
/* Gradient */
from-gray-900/95 to-black/95

/* Backdrop */
backdrop-blur-2xl
```

### Items
```css
/* Normal */
bg-white/5
border-white/10

/* Hover */
bg-white/10
border-white/20
```

### Icon Box
```css
/* Normal */
from-teal/20 to-teal-dark/20

/* Hover */
from-teal/30 to-teal-dark/30
```

### Text
```css
/* Normal */
text-white

/* Hover */
text-teal
```

## 🎯 Menu Items

```tsx
const menuItems = [
  { icon: Home, label: "Ana Sayfa", href: "/" },
  { icon: Calendar, label: "Rezervasyon Yap", href: "/rezervasyon" },
  { icon: Image, label: "Galeri", href: "/galeri" },
  { icon: Mail, label: "İletişim", href: "/iletisim" },
  { icon: Info, label: "Hakkımızda", href: "/hakkimizda" },
];
```

## 🎨 Header Güncellemeleri

### Öncesi
```tsx
// Light theme
bg-white/95
text-navy
User icon
```

### Sonrası
```tsx
// Dark theme
bg-black/30 backdrop-blur-md
border-b border-white/10
text-white drop-shadow-lg
GlassMenu component
```

## 🎬 Kullanım

### Header'da
```tsx
import GlassMenu from './GlassMenu';

<header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
  <div className="flex items-center justify-between">
    <Logo />
    <GlassMenu />
  </div>
</header>
```

### Standalone
```tsx
import GlassMenu from "@/components/ui/GlassMenu";

<GlassMenu />
```

## 🎨 Customization

### Menu Items Değiştirme
```tsx
// GlassMenu.tsx içinde
const menuItems: MenuItem[] = [
  { icon: YourIcon, label: "Your Label", href: "/your-path" },
  // ...
];
```

### Renk Değiştirme
```tsx
// Teal → Blue
from-teal/20 → from-blue/20
text-teal → text-blue
```

### Boyut Değiştirme
```tsx
// Desktop panel width
w-[340px] → w-[400px]

// Mobile height
h-[85vh] → h-[90vh]
```

## 🎯 Z-Index Hierarchy

```
Header: z-50
Backdrop: z-[55]
Menu Panel: z-[56]
Hamburger Button: z-[60]
```

## 🎨 Glassmorphism Effect

### Backdrop Blur
```css
backdrop-blur-md    /* Header */
backdrop-blur-sm    /* Overlay */
backdrop-blur-2xl   /* Menu Panel */
backdrop-blur-md    /* Menu Items */
```

### Transparency
```css
bg-black/30         /* Header */
bg-black/50         /* Overlay */
bg-gray-900/95      /* Menu Panel */
bg-white/5          /* Menu Items */
```

## 🎬 Animation Timeline

```
1. Click hamburger
   ↓
2. Icon rotates (200ms)
   ↓
3. Backdrop fades in (300ms)
   ↓
4. Menu panel slides/scales in (spring)
   ↓
5. Items stagger in (100ms/80ms delay each)
```

## 🎯 Accessibility

### Keyboard Support
```tsx
// Items are <a> tags
- Tab navigation
- Enter to activate
- Escape to close (can be added)
```

### Screen Readers
```tsx
// Icons have aria-hidden
aria-hidden="true"

// Semantic HTML
<nav> for menu
<a> for links
```

## 🚀 Performance

### Optimizations
- ✅ AnimatePresence for unmount animations
- ✅ Framer Motion hardware acceleration
- ✅ CSS backdrop-filter (GPU)
- ✅ Conditional rendering (isOpen)
- ✅ onClick outside to close

### Bundle Size
- GlassMenu: ~3KB
- Dependencies: framer-motion (already installed)
- Icons: lucide-react (already installed)

## 🎉 Apple Vision Pro Benzerlikleri

### Vision Pro
1. ✅ Glassmorphism
2. ✅ Backdrop blur
3. ✅ Smooth spring animations
4. ✅ Minimal design
5. ✅ Large touch targets
6. ✅ Premium feel

### Bizim Menu
1. ✅ Backdrop blur 20px
2. ✅ Yarı saydam panels
3. ✅ Spring physics
4. ✅ Clean typography
5. ✅ Generous spacing
6. ✅ Teal accent color

## 🎨 Best Practices

### Do's ✅
- Use backdrop-blur for glass effect
- Keep animations smooth (spring)
- Provide visual feedback (hover/tap)
- Use semantic HTML
- Support keyboard navigation

### Don'ts ❌
- Don't use too many blur layers (performance)
- Don't make touch targets too small
- Don't skip exit animations
- Don't forget mobile optimization
- Don't use too many colors

## 🌟 Gelişmiş Özellikler

### Close on Outside Click
```tsx
// Already implemented
<motion.div onClick={() => setIsOpen(false)}>
  {/* Backdrop */}
</motion.div>
```

### Close on Escape
```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, []);
```

### Active Link Highlight
```tsx
const pathname = usePathname();

<a
  className={pathname === item.href ? 'bg-teal/20' : 'bg-white/5'}
>
```

## 🎉 Sonuç

### Eklenen Özellikler
- ✅ Apple Vision Pro tarzı glassmorphism menu
- ✅ Responsive (mobile bottom sheet, desktop panel)
- ✅ Smooth spring animations
- ✅ Icon transitions
- ✅ Stagger animations
- ✅ Hover effects
- ✅ Dark theme header
- ✅ Backdrop blur

### Kullanım
- ✅ Header'da hamburger button
- ✅ Click to open/close
- ✅ 5 menu items
- ✅ Mobile ve desktop optimize

---

**Apple Vision Pro seviyesinde premium glassmorphism menu! 🍎✨**
