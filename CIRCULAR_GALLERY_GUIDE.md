# 🎡 3D Circular Gallery Rehberi

## ✅ Oluşturulan Dosyalar

1. **components/ui/CircularGallery.tsx** - 3D WebGL gallery
2. **components/ui/CircularGallery.css** - Gallery stilleri
3. **app/page.tsx** - Gallery entegrasyonu

## 🎯 Özellikler

### Apple Vision Pro Tarzı 3D Gallery

1. ✅ **3D Circular Layout** - Dairesel düzende görseller
2. ✅ **Bend Effect** - WebGL ile bükülme efekti
3. ✅ **Smooth Scrolling** - Yumuşak kaydırma
4. ✅ **Touch Support** - Mobil sürükleme
5. ✅ **Auto Fade** - Mesafeye göre opacity
6. ✅ **Current Label** - Aktif görselin ismi

## 🎨 Teknoloji

### OGL (WebGL Lightweight)

```bash
npm install ogl
```

**Neden OGL?**
- ✅ Three.js'den 10x daha hafif (~20KB)
- ✅ WebGL low-level control
- ✅ Performanslı
- ✅ Custom shaderlar

### 3D Rendering Pipeline

```
Canvas → Renderer → Scene → Camera → Meshes → Shaders
```

## 🎬 3D Bend Effect

### Vertex Shader

```glsl
attribute vec2 uv;
attribute vec3 position;
uniform float uBend;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Bend effect
  float bendAmount = uBend * pos.x;
  pos.z += bendAmount * bendAmount * 0.5;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

**Nasıl Çalışır:**
- X pozisyonuna göre Z ekseninde bükülme
- Quadratic curve (x²) ile smooth bend
- `uBend` parametresi ile kontrol

### Fragment Shader

```glsl
precision highp float;
uniform sampler2D tMap;
uniform float uAlpha;
varying vec2 vUv;

void main() {
  vec4 tex = texture2D(tMap, vUv);
  gl_FragColor = vec4(tex.rgb, tex.a * uAlpha);
}
```

**Özellikler:**
- Texture mapping
- Alpha blending
- Mesafeye göre fade

## 📊 Props API

### CircularGallery

```tsx
interface CircularGalleryProps {
  items: GalleryItem[];        // Zorunlu
  bend?: number;               // Default: 3
  textColor?: string;          // Default: "#ffffff"
  borderRadius?: number;       // Default: 0.05
  scrollSpeed?: number;        // Default: 2
  scrollEase?: number;         // Default: 0.05
}
```

### GalleryItem

```tsx
interface GalleryItem {
  image: string;    // URL veya path
  text: string;     // Label text
}
```

## 🎯 Kullanım

### Basit Kullanım

```tsx
import CircularGallery from "@/components/ui/CircularGallery";

const items = [
  { image: "/img/1.jpg", text: "Balık Turu" },
  { image: "/img/2.jpg", text: "Boğaz" },
  { image: "/img/3.jpg", text: "Gün Batımı" },
];

<CircularGallery items={items} />
```

### Özelleştirilmiş

```tsx
<CircularGallery
  items={galleryItems}
  bend={5}                    // Daha fazla bükülme
  textColor="#00A9A5"         // Teal renk
  scrollSpeed={3}             // Daha hızlı scroll
  scrollEase={0.01}           // Daha smooth
/>
```

### Unsplash Görselleri

```tsx
const items = [
  { 
    image: "https://images.unsplash.com/photo-xxx?q=80&w=2070", 
    text: "Başlık" 
  },
];
```

## 🎨 3D Düzen

### Circular Positioning

```tsx
const radius = 3;
const angle = (i / itemCount) * Math.PI * 2;

mesh.position.x = Math.sin(angle) * radius;
mesh.position.z = Math.cos(angle) * radius - 5;
mesh.rotation.y = -angle;
```

**Parametreler:**
- `radius: 3` - Daire yarıçapı
- `angle` - Her item için açı (360° / itemCount)
- `z: -5` - Kamera mesafesi

### Scroll Animation

```tsx
// Smooth scroll
scrollCurrent += (scrollTarget - scrollCurrent) * scrollEase;

// Update positions
const angle = (i / itemCount) * Math.PI * 2 + scrollCurrent;
mesh.position.x = Math.sin(angle) * radius;
mesh.position.z = Math.cos(angle) * radius - 5;
```

## 🎬 Animasyonlar

### Auto Fade

```tsx
// Mesafeye göre opacity
const distance = Math.abs(mesh.position.z + 5);
const alpha = Math.max(0, 1 - distance / 5);
mesh.program.uniforms.uAlpha.value = alpha;
```

**Etki:**
- Kameraya yakın: alpha = 1 (görünür)
- Kameradan uzak: alpha = 0 (görünmez)
- Smooth geçiş

### Current Index

```tsx
const normalizedScroll = ((scrollCurrent % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
const index = Math.round((normalizedScroll / (Math.PI * 2)) * itemCount) % itemCount;
setCurrentIndex(index);
```

### Label Animation

```tsx
<motion.div
  key={currentIndex}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {items[currentIndex]?.text}
</motion.div>
```

## 🎮 Etkileşim

### Mouse Wheel

```tsx
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  scrollTarget.current += e.deltaY * 0.001 * scrollSpeed;
};
```

### Touch/Drag

```tsx
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  const touchY = e.touches[0].clientY;
  const delta = touchStartY - touchY;
  scrollTarget.current += delta * 0.01 * scrollSpeed;
  touchStartY = touchY;
};
```

## 🎨 Görsel Tasarım

### Container

```css
background: linear-gradient(180deg, 
  rgba(0, 0, 0, 0) 0%, 
  rgba(0, 0, 16, 0.5) 50%, 
  rgba(0, 0, 0, 0) 100%
);
```

### Canvas

```css
cursor: grab;
cursor: grabbing; /* active */
```

### Label

```css
font-size: 2rem;
font-weight: 700;
text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
letter-spacing: 0.05em;
```

### Hints

```css
backdrop-filter: blur(10px);
background: rgba(0, 0, 0, 0.3);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 20px;
```

## 📱 Responsive

### Desktop
- Label: 2rem
- Bottom: 80px
- Hint: 0.875rem

### Tablet (769-1024px)
- Label: 1.75rem
- Bottom: 70px

### Mobile (<768px)
- Label: 1.5rem
- Bottom: 60px
- Hint: 0.75rem

## 🎯 Parametreler

### bend (Default: 3)

```tsx
bend={1}   // Az bükülme
bend={3}   // Orta (default)
bend={5}   // Fazla bükülme
```

### scrollSpeed (Default: 2)

```tsx
scrollSpeed={1}   // Yavaş
scrollSpeed={2}   // Normal
scrollSpeed={4}   // Hızlı
```

### scrollEase (Default: 0.05)

```tsx
scrollEase={0.01}  // Çok smooth (yavaş)
scrollEase={0.05}  // Normal
scrollEase={0.1}   // Hızlı tepki
```

## 🎬 Render Loop

```tsx
const animate = (time: number) => {
  // 1. Smooth scroll
  scrollCurrent += (scrollTarget - scrollCurrent) * scrollEase;
  
  // 2. Update mesh positions
  meshes.forEach((mesh, i) => {
    const angle = (i / itemCount) * Math.PI * 2 + scrollCurrent;
    mesh.position.x = Math.sin(angle) * radius;
    mesh.position.z = Math.cos(angle) * radius - 5;
    mesh.rotation.y = -angle;
    
    // 3. Update alpha
    const distance = Math.abs(mesh.position.z + 5);
    const alpha = Math.max(0, 1 - distance / 5);
    mesh.program.uniforms.uAlpha.value = alpha;
  });
  
  // 4. Update current index
  setCurrentIndex(calculateIndex());
  
  // 5. Render
  renderer.render({ scene, camera });
  
  requestAnimationFrame(animate);
};
```

## 🎨 Shader Uniforms

```tsx
uniforms: {
  tMap: { value: texture },      // Texture
  uBend: { value: bend },         // Bend amount
  uAlpha: { value: 1 },           // Opacity
  uTime: { value: 0 },            // Animation time
}
```

## 🔧 Özelleştirme

### Daha Fazla Item

```tsx
// Radius'u artır
const radius = 4;

// Mesh boyutunu küçült
width: 1.2,
height: 1.6,
```

### Farklı Şekil

```tsx
// Elips
mesh.position.x = Math.sin(angle) * radiusX;
mesh.position.z = Math.cos(angle) * radiusZ - 5;

// Spiral
mesh.position.y = i * 0.2;
```

### Custom Shader

```glsl
// Wave effect
pos.y += sin(pos.x * 2.0 + uTime) * 0.1;

// Glow
vec3 glow = vec3(0.0, 0.6, 0.6) * (1.0 - vUv.y);
gl_FragColor = vec4(tex.rgb + glow, tex.a * uAlpha);
```

## 🚀 Performans

### Optimizasyonlar
- ✅ OGL (lightweight WebGL)
- ✅ Texture caching
- ✅ RequestAnimationFrame
- ✅ Alpha culling
- ✅ Smooth easing

### Bundle Size
- OGL: ~20KB (gzipped)
- CircularGallery: ~3KB
- Total: ~23KB

## 🎯 Best Practices

### 1. Görsel Sayısı
- **Optimal:** 4-8 görsel
- **Maksimum:** 12 görsel
- Daha fazla performansı düşürür

### 2. Görsel Boyutu
```tsx
// Unsplash
?q=80&w=2070&auto=format&fit=crop

// Optimize
- Width: 1920px max
- Quality: 80%
- Format: WebP
```

### 3. Scroll Ease
```tsx
scrollEase={0.02}  // Çok smooth (Apple tarzı)
scrollEase={0.05}  // Normal
scrollEase={0.1}   // Hızlı tepki
```

## 🌟 Apple Vision Pro Benzerlikleri

### Apple Vision Pro
1. ✅ 3D spatial layout
2. ✅ Depth-based fade
3. ✅ Smooth scrolling
4. ✅ Bend effect
5. ✅ Glassmorphism hints

### Bizim Gallery
1. ✅ Circular 3D layout
2. ✅ Distance-based alpha
3. ✅ Smooth easing
4. ✅ WebGL bend shader
5. ✅ Blur backdrop hints

## 🎉 Sonuç

### Eklenen Özellikler
- ✅ 3D WebGL circular gallery
- ✅ Bend effect shader
- ✅ Smooth scroll animation
- ✅ Touch/drag support
- ✅ Auto fade
- ✅ Current label
- ✅ Apple Vision Pro estetik

### Kullanım
- ✅ Hero section altında
- ✅ 6 örnek görsel
- ✅ Scroll veya drag ile gezinme
- ✅ Mobil uyumlu

---

**Apple Vision Pro tarzı 3D sinematik galeri! 🎡✨**
