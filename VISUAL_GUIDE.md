# 🎨 Görsel Tasarım Kılavuzu

## 🎨 Renk Paleti

### Ana Renkler

```
┌─────────────────────────────────────────┐
│  NAVY (Koyu Lacivert)                   │
│  #003366                                 │
│  ████████████████████████████████████   │
│                                          │
│  Kullanım: Başlıklar, header, footer    │
│  Ton: Profesyonel, güvenilir            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TEAL (Turkuaz)                          │
│  #00A9A5                                 │
│  ████████████████████████████████████   │
│                                          │
│  Kullanım: Butonlar, vurgular, ikonlar  │
│  Ton: Canlı, modern, deniz              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  WHITE (Beyaz)                           │
│  #FFFFFF                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                          │
│  Kullanım: Arka planlar, yazılar         │
│  Ton: Temiz, minimal                     │
└─────────────────────────────────────────┘
```

### Renk Varyasyonları

```css
/* Navy Tonları */
navy-dark:  #002244  ████  (Daha koyu, hover efektleri)
navy:       #003366  ████  (Ana renk)
navy-light: #004488  ████  (Daha açık, gradient)

/* Teal Tonları */
teal-dark:  #008985  ████  (Daha koyu, hover efektleri)
teal:       #00A9A5  ████  (Ana renk)
teal-light: #00C9C5  ████  (Daha açık, vurgular)
```

## 📐 Tipografi

### Font Ailesi: Poppins

```
┌─────────────────────────────────────────┐
│  Poppins Light (300)                     │
│  Kullanım: Alt başlıklar, açıklamalar   │
│  Örnek: "Tekne kiralama hizmetleri"     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Poppins Regular (400)                   │
│  Kullanım: Gövde metni, paragraflar     │
│  Örnek: "İstanbul Boğazı'nda..."        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Poppins Medium (500)                    │
│  Kullanım: Butonlar, kart başlıkları    │
│  Örnek: "Rezervasyon Yap"               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Poppins SemiBold (600)                  │
│  Kullanım: Bölüm başlıkları             │
│  Örnek: "Hizmetlerimiz"                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Poppins Bold (700)                      │
│  Kullanım: Ana başlıklar, hero          │
│  Örnek: "İstanbul Boğazı'nda"           │
└─────────────────────────────────────────┘
```

### Font Boyutları

```
Mobile          Tablet          Desktop
------          ------          -------
text-3xl        text-4xl        text-6xl    (Hero başlık)
text-xl         text-2xl        text-3xl    (Bölüm başlık)
text-lg         text-xl         text-2xl    (Alt başlık)
text-base       text-lg         text-xl     (Gövde)
text-sm         text-base       text-lg     (Küçük metin)
```

## 🎭 Animasyon Stilleri

### FadeIn (Belirme)

```
Başlangıç:              Bitiş:
opacity: 0              opacity: 1
                        
░░░░░░░░░░  ──────►    ██████████
(Görünmez)              (Görünür)

Süre: 0.6s
Easing: ease-out
```

### SlideUp (Yukarı Kayma)

```
Başlangıç:              Bitiş:
opacity: 0              opacity: 1
y: +30px                y: 0

    ↓                       ↑
    ↓                       │
    ▼                       │
  ░░░░░  ──────►          ████
  (Aşağıda)               (Yerinde)

Süre: 0.6s
Easing: [0.22, 1, 0.36, 1] (Apple)
```

### SlideIn (Yandan Kayma)

```
Başlangıç:              Bitiş:
opacity: 0              opacity: 1
x: -30px                x: 0

←──────                 ────────
░░░░░  ──────►          ████████
(Solda)                 (Yerinde)

Süre: 0.6s
Easing: [0.22, 1, 0.36, 1] (Apple)
```

## 🔘 Buton Stilleri

### Primary Button

```
┌──────────────────────────────┐
│    Rezervasyon Yap           │  ← Beyaz yazı
└──────────────────────────────┘
████████████████████████████████  ← Teal arka plan
        ↓ Hover
┌──────────────────────────────┐
│    Rezervasyon Yap           │  ← Beyaz yazı
└──────────────────────────────┘
████████████████████████████████  ← Teal-dark + scale(1.02)
```

### Secondary Button

```
┌──────────────────────────────┐
│    Daha Fazla Bilgi          │  ← Beyaz yazı
└──────────────────────────────┘
████████████████████████████████  ← Navy arka plan
        ↓ Hover
┌──────────────────────────────┐
│    Daha Fazla Bilgi          │  ← Beyaz yazı
└──────────────────────────────┘
████████████████████████████████  ← Navy-light + scale(1.02)
```

### Outline Button

```
┌──────────────────────────────┐
│    İptal                     │  ← Navy yazı
└──────────────────────────────┘
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← Şeffaf + Navy border
        ↓ Hover
┌──────────────────────────────┐
│    İptal                     │  ← Beyaz yazı
└──────────────────────────────┘
████████████████████████████████  ← Navy arka plan
```

## 🃏 Kart Tasarımı

```
┌─────────────────────────────────┐
│                                  │
│         ┌─────────┐              │
│         │  ████   │              │  ← Gradient ikon
│         │  ████   │              │     (Teal → Teal-dark)
│         └─────────┘              │
│                                  │
│      Tekne Kiralama              │  ← Navy başlık (bold)
│                                  │
│  Lüks teknelerimizle Boğaz'ın   │  ← Gray-600 açıklama
│  eşsiz manzarasının keyfini     │
│  çıkarın                         │
│                                  │
└─────────────────────────────────┘
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← Gölge (shadow-lg)

Hover Efekti:
- Y: -8px (yukarı kayma)
- Scale: 1.02 (hafif büyüme)
- Shadow: shadow-2xl (daha büyük gölge)
```

## 📱 Layout Yapısı

### Mobile (< 768px)

```
┌─────────────────────────┐
│  Header (Fixed)         │
│  [Logo]        [User]   │
├─────────────────────────┤
│                         │
│    Hero Section         │
│    (Full Width)         │
│                         │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │   Card 1          │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │   Card 2          │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │   Card 3          │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│  Navigation (Fixed)     │
│  [Home][Rez][Profile]   │
└─────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌───────────────────────────────┐
│  Header (Fixed)               │
│  [Logo]              [User]   │
├───────────────────────────────┤
│                               │
│      Hero Section             │
│      (Full Width)             │
│                               │
├───────────────────────────────┤
│                               │
│  ┌──────────┐  ┌──────────┐  │
│  │  Card 1  │  │  Card 2  │  │
│  └──────────┘  └──────────┘  │
│                               │
│  ┌──────────┐                 │
│  │  Card 3  │                 │
│  └──────────┘                 │
│                               │
├───────────────────────────────┤
│  Navigation (Fixed)           │
│  [Home]  [Rezervasyon] [Prof] │
└───────────────────────────────┘
```

### Desktop (> 1024px)

```
┌─────────────────────────────────────────┐
│  Header (Fixed)                         │
│  [Logo]                        [User]   │
├─────────────────────────────────────────┤
│                                         │
│          Hero Section                   │
│          (Full Width)                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐    ┌──────┐    ┌──────┐     │
│  │Card 1│    │Card 2│    │Card 3│     │
│  └──────┘    └──────┘    └──────┘     │
│                                         │
├─────────────────────────────────────────┤
│  Navigation (Fixed)                     │
│  [Ana Sayfa]  [Rezervasyonlarım] [Prof] │
└─────────────────────────────────────────┘
```

## 🌊 Gradient Örnekleri

### Hero Background

```
from-navy/80 ──────► via-navy/60 ──────► to-navy/80

████████████████░░░░░░░░░░░░████████████████
(Koyu)          (Açık)          (Koyu)
```

### Features Section

```
from-navy ──────────────────► to-navy-light

████████████████████████████████████████████
(Koyu lacivert)              (Açık lacivert)
```

### Icon Background

```
from-teal ──────────────────► to-teal-dark

████████████████████████████████████████████
(Turkuaz)                    (Koyu turkuaz)
```

## 🎯 Spacing Sistemi

```
Padding/Margin Scale:
────────────────────
p-2   = 0.5rem  = 8px
p-4   = 1rem    = 16px
p-6   = 1.5rem  = 24px
p-8   = 2rem    = 32px
p-12  = 3rem    = 48px
p-16  = 4rem    = 64px
p-20  = 5rem    = 80px
p-24  = 6rem    = 96px

Kullanım Örnekleri:
──────────────────
Section padding:    py-16 (64px üst/alt)
Card padding:       p-6 (24px her yönden)
Button padding:     px-8 py-4 (32px yatay, 16px dikey)
Container padding:  px-4 (16px yatay)
```

## 🔲 Border Radius

```
rounded-lg    = 0.5rem  = 8px   (Küçük elemanlar)
rounded-xl    = 0.75rem = 12px  (Orta elemanlar)
rounded-2xl   = 1rem    = 16px  (Kartlar)
rounded-full  = 9999px          (Butonlar, ikonlar)

Örnekler:
─────────
Button:     rounded-full
Card:       rounded-2xl
Icon bg:    rounded-full
Input:      rounded-lg
```

## 🌈 Shadow Sistemi

```
shadow-sm     ░░░  (Hafif gölge)
shadow        ░░░░  (Normal gölge)
shadow-lg     ░░░░░  (Büyük gölge - kartlar)
shadow-2xl    ░░░░░░  (Çok büyük - hover)

Kullanım:
─────────
Card default:   shadow-lg
Card hover:     shadow-2xl
Header:         shadow-sm
Navigation:     shadow-lg
```

## 🎨 Renk Kombinasyonları

### Başarılı Kombinasyonlar

```
✅ Navy arka plan + Beyaz yazı
   ████████████████  "Başlık"

✅ Teal arka plan + Beyaz yazı
   ████████████████  "Buton"

✅ Beyaz arka plan + Navy yazı
   ░░░░░░░░░░░░░░░░  "İçerik"

✅ Gradient (Navy → Teal) + Beyaz yazı
   ████████████████  "Hero"

✅ Beyaz arka plan + Gray-600 yazı
   ░░░░░░░░░░░░░░░░  "Açıklama"
```

### Kaçınılması Gerekenler

```
❌ Teal arka plan + Navy yazı (Kontrast düşük)
❌ Navy arka plan + Teal yazı (Okunabilirlik zor)
❌ Gray arka plan + Gray yazı (Kontrast yok)
```

## 📊 Görsel Hiyerarşi

```
Önem Sırası:
────────────
1. Hero Başlık        (text-6xl, bold, white)
2. Bölüm Başlıkları   (text-4xl, bold, navy)
3. Kart Başlıkları    (text-xl, semibold, navy)
4. Gövde Metni        (text-base, regular, gray-600)
5. Küçük Metin        (text-sm, light, gray-500)

Görsel Ağırlık:
───────────────
En Ağır:  Hero section (büyük, bold, renkli)
Ağır:     Butonlar (renkli, gölgeli)
Orta:     Kartlar (beyaz, gölgeli)
Hafif:    Açıklamalar (gray, ince)
```

## 🎬 Animasyon Timing

```
Hızlı (0.3s):     Hover efektleri, buton tıklamaları
Normal (0.6s):    Sayfa geçişleri, scroll animasyonları
Yavaş (1.0s):     Özel efektler, dikkat çekici animasyonlar

Delay Pattern:
──────────────
Element 1:  delay-0.2s
Element 2:  delay-0.3s  (+0.1s)
Element 3:  delay-0.4s  (+0.1s)
Element 4:  delay-0.5s  (+0.1s)

Bu pattern, kademeli görünüm sağlar.
```

---

**Bu kılavuz, Balık Sefası projesinin görsel tutarlılığını sağlamak için hazırlanmıştır.**
