# ✨ Derinlik Katmanları Rehberi

## 🎯 Apple Vision Pro Tarzı 3 Özel Katman

### 1. LightLayer.tsx - Işık Parlaması Efekti

**Özellikler:**
- Mouse hareketine tepki veren ana ışık
- 3 farklı glow katmanı (ana, üst sağ, alt sol)
- Lens flare efekti
- Küçük vurgu ışıkları
- Sürekli pulse animasyonları

**Teknik:**
```tsx
// Mouse tracking
const mouseX = useMotionValue(0);
const mouseY = useMotionValue(0);
const x = useSpring(mouseX, { damping: 25, stiffness: 150 });

// Glow katmanları
- Ana glow: 600x600px, mouse takibi
- İkincil glow: 500x500px, üst sağ
- Üçüncül glow: 450x450px, alt sol
- Lens flare: 32x32px, mouse takibi
- Vurgu ışıkları: 20-24px, sabit pozisyon
```

**Renkler:**
- `from-teal/40` → Turkuaz parlaklık
- `from-teal-light/30` → Açık turkuaz
- `from-navy-light/30` → Lacivert ton
- `bg-white/20` → Beyaz lens flare

**Animasyonlar:**
- Scale: 1 → 1.2 → 1 (4s)
- Opacity: 0.3 → 0.5 → 0.3 (4s)
- Position: Smooth spring animation

### 2. GlassCard.tsx - Glassmorphism Panel

**Özellikler:**
- Backdrop blur (cam efekti)
- Yarı saydam beyaz overlay
- Animasyonlu border glow
- Glass shine gradient
- Alt glow çizgisi

**Teknik:**
```tsx
// Glassmorphism
backdrop-blur-xl bg-white/5
border border-white/10
shadow-2xl shadow-black/20

// Shine effect
bg-gradient-to-br from-white/10 via-transparent

// Border glow
border border-teal/20 (animated opacity)

// Bottom glow
bg-gradient-to-r from-transparent via-teal/50
```

**Animasyonlar:**
- Giriş: opacity 0→1, y 20→0, scale 0.95→1
- Hover: scale 1.02, y -5
- Border glow: opacity 0.3→0.6→0.3 (3s)

**Variants:**
- `GlassCard`: Büyük kart (p-8, rounded-3xl)
- `GlassCardSmall`: Küçük kart (p-4, rounded-2xl)

### 3. ParticlesLayer.tsx - Floating Particles

**Özellikler:**
- Canvas-based rendering
- 80 adet partikül
- Yukarı doğru hareket
- Opacity değişimi
- Rastgele renkler
- Glow efekti

**Teknik:**
```tsx
// Particle properties
x, y: Rastgele pozisyon
size: 1-4px
speedY: -0.2 to -0.7 (yukarı)
speedX: -0.15 to 0.15 (yanlara)
opacity: 0.2-0.7 (değişken)
opacitySpeed: ±0.01

// Renkler
- rgba(255, 255, 255, ...) // Beyaz
- rgba(0, 169, 165, ...)   // Teal
- rgba(0, 201, 197, ...)   // Teal-light
- rgba(0, 68, 136, ...)    // Navy-light
```

**Animasyon:**
- Sürekli yukarı hareket
- Opacity fade in/out
- Ekran dışına çıkınca reset
- Shadow blur: 10px
- Mix blend mode: screen

## 🎭 Katman Sıralaması (Z-Index)

```
Z-0:  Arka plan gradient
Z-10: Boğaz görseli
Z-20: Dekoratif blur circles
Z-25: LightLayer (ışık parlaması)
Z-26: ParticlesLayer (partiküller)
Z-30: İçerik (GlassCard + metin)
Z-50: Scroll progress bar
```

## 🎨 Görsel Derinlik Hissi

### Katman 1 (En Uzak)
```
Arka plan gradient
├── Navy-dark → Navy → Navy-light
├── Scroll: +200px
└── Scale: 1 → 1.3
```

### Katman 2 (Orta)
```
Boğaz görseli + Overlay
├── Opacity: 0.9 → 0.3
├── Scroll: +150px
└── Gradient overlay
```

### Katman 3 (Yakın)
```
Dekoratif blur circles
├── Teal/Navy glow
├── Scroll: +100px
└── Blur: 3xl
```

### Katman 4 (Çok Yakın)
```
LightLayer
├── Mouse-reactive glow
├── Pulse animasyonları
└── Lens flare
```

### Katman 5 (Çok Yakın)
```
ParticlesLayer
├── Floating particles
├── Opacity değişimi
└── Yukarı hareket
```

### Katman 6 (En Ön)
```
GlassCard + İçerik
├── Glassmorphism
├── Backdrop blur
└── Scroll animasyonları
```

## 🎬 Animasyon Akışı

### Sayfa Yüklenince
```
1. Arka plan fade in
2. LightLayer glow başlar (0.5s)
3. ParticlesLayer belirir (0.5s)
4. GlassCard fade + scale in (0.8s, delay 0.3s)
5. Başlık fade + scale in (1.2s, delay 0.5s)
6. Alt başlık fade in (1.0s, delay 0.7s)
7. Buton fade + scale in (0.8s, delay 0.9s)
8. Scroll indicator (delay 1.2s)
```

### Scroll Yapınca
```
1. Arka plan katmanları farklı hızlarda kayar
2. LightLayer sabit kalır (mouse-reactive)
3. ParticlesLayer sabit kalır (sürekli animasyon)
4. GlassCard scale + fade out
5. İçerik katmanları farklı hızlarda kayar
```

## 💡 Performans Optimizasyonları

### LightLayer
- ✅ CSS transforms (GPU-accelerated)
- ✅ Spring animations (smooth)
- ✅ Pointer-events: none
- ✅ Will-change otomatik

### GlassCard
- ✅ Backdrop-filter (GPU)
- ✅ Transform animations
- ✅ Minimal re-renders

### ParticlesLayer
- ✅ Canvas rendering
- ✅ RequestAnimationFrame
- ✅ Particle pooling
- ✅ Mix blend mode: screen
- ✅ Cleanup on unmount

## 🎨 Renk Paleti

### Arka Plan
```css
from-navy-dark (#002244)
via-navy (#003366)
to-navy-light (#004488)
```

### Işık Efektleri
```css
teal (#00A9A5)
teal-light (#00C9C5)
teal-dark (#008985)
white (rgba(255,255,255))
```

### Glassmorphism
```css
bg-white/5 (5% beyaz)
border-white/10 (10% beyaz)
from-white/10 (10% beyaz gradient)
```

## 🔧 Özelleştirme

### LightLayer - Işık Yoğunluğu
```tsx
// Daha parlak
from-teal/60 via-teal/40

// Daha soluk
from-teal/20 via-teal/10
```

### GlassCard - Blur Miktarı
```tsx
// Daha bulanık
backdrop-blur-2xl

// Daha net
backdrop-blur-md
```

### ParticlesLayer - Partikül Sayısı
```tsx
// Daha az
const particleCount = 50;

// Daha fazla
const particleCount = 150;
```

### ParticlesLayer - Hız
```tsx
// Daha yavaş
speedY: -(Math.random() * 0.3 + 0.1)

// Daha hızlı
speedY: -(Math.random() * 0.8 + 0.4)
```

## 🎯 Kullanım

### HeroCinematic İçinde
```tsx
// Light Layer
<div className="absolute inset-0 z-25">
  <LightLayer />
</div>

// Particles Layer
<div className="absolute inset-0 z-26">
  <ParticlesLayer />
</div>

// Glass Card
<GlassCard delay={0.3}>
  <h1>Başlık</h1>
  <p>Alt başlık</p>
  <Button />
</GlassCard>
```

### Bağımsız Kullanım
```tsx
// Herhangi bir bölümde
<div className="relative">
  <LightLayer />
  <GlassCard>
    <p>İçerik</p>
  </GlassCard>
</div>
```

## 🌟 Vision Pro Benzerlikleri

### Apple Vision Pro Web Sitesi
1. ✅ Katmanlı derinlik
2. ✅ Glassmorphism
3. ✅ Floating particles
4. ✅ Light effects
5. ✅ Mouse-reactive
6. ✅ Smooth animations

### Bizim Implementasyon
1. ✅ 6 derinlik katmanı
2. ✅ Glassmorphism card
3. ✅ 80 floating particles
4. ✅ Mouse-reactive glow
5. ✅ Lens flare
6. ✅ Pulse animations

## 📊 Efekt Karşılaştırması

### Önceki (Basit Parallax)
```
- 3 arka plan katmanı
- Basit scroll animasyonları
- Tek renk gradient
```

### Yeni (Vision Pro Tarzı)
```
- 6 derinlik katmanı
- Mouse-reactive ışık
- Floating particles
- Glassmorphism
- Lens flare
- Pulse animations
- Glow effects
```

## 🎭 Görsel Efekt Sırası

```
Arka Plan (En Uzak)
    ↓
Boğaz Görseli
    ↓
Blur Circles
    ↓
Light Glow (Mouse-reactive)
    ↓
Floating Particles
    ↓
Glass Card (En Ön)
    ↓
İçerik
```

## 🚀 Sonuç

### Eklenen Özellikler
- ✅ LightLayer (mouse-reactive glow)
- ✅ GlassCard (glassmorphism)
- ✅ ParticlesLayer (floating particles)
- ✅ 6 katmanlı derinlik
- ✅ Lens flare efekti
- ✅ Pulse animasyonları

### Görsel Etki
- ✨ Apple Vision Pro seviyesinde derinlik
- ✨ Sinematik atmosfer
- ✨ Premium glassmorphism
- ✨ Canlı, dinamik sahne
- ✨ Mouse etkileşimi

---

**Apple Vision Pro tarzı derinlik katmanları başarıyla eklendi! ✨🎬**
