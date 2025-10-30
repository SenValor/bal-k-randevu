# 🏗️ Proje Yapısı ve Mimari

## 📐 Sayfa Yapısı

```
┌─────────────────────────────────────────┐
│           HEADER (Fixed Top)            │
│  [Logo] Balık Sefası        [User Icon] │
└─────────────────────────────────────────┘
│                                         │
│         HERO SECTION (70vh)             │
│    ┌─────────────────────────────┐     │
│    │   Background Image/Gradient  │     │
│    │                              │     │
│    │   İstanbul Boğazı'nda        │     │
│    │   Unutulmaz Anlar            │     │
│    │                              │     │
│    │   [Rezervasyon Yap Button]   │     │
│    └─────────────────────────────┘     │
│                                         │
│         SERVICES SECTION                │
│         Hizmetlerimiz                   │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ Card │  │ Card │  │ Card │         │
│  │ Icon │  │ Icon │  │ Icon │         │
│  │Title │  │Title │  │Title │         │
│  │ Desc │  │ Desc │  │ Desc │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
│         FEATURES SECTION                │
│    (Navy Gradient Background)           │
│                                         │
│    Neden Balık Sefası?                  │
│                                         │
│    10+        500+       15+            │
│   Yıllık     Mutlu      Tekne           │
│  Deneyim    Müşteri     Filosu          │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        NAVIGATION (Fixed Bottom)         │
│  [Home]  [Rezervasyonlarım]  [Profil]   │
└─────────────────────────────────────────┘
```

## 🧩 Bileşen Hiyerarşisi

```
RootLayout (app/layout.tsx)
├── Header
│   ├── Logo + Brand Name
│   └── User Icon Button
│
├── Main Content (children)
│   └── Home Page (app/page.tsx)
│       ├── Hero Section
│       │   ├── Background (Image/Gradient)
│       │   └── Content
│       │       ├── FadeIn (Heading)
│       │       ├── FadeIn (Subheading)
│       │       └── FadeIn (Button)
│       │
│       ├── Services Section
│       │   ├── SlideUp (Section Header)
│       │   └── Grid
│       │       ├── SlideUp (Card 1)
│       │       ├── SlideUp (Card 2)
│       │       └── SlideUp (Card 3)
│       │
│       └── Features Section
│           ├── SlideUp (Section Header)
│           └── Grid
│               ├── SlideUp (Stat 1)
│               ├── SlideUp (Stat 2)
│               └── SlideUp (Stat 3)
│
└── Navigation
    ├── Home Tab
    ├── Reservations Tab
    └── Profile Tab
```

## 📦 Bileşen Bağımlılıkları

```
┌─────────────────────────────────────────┐
│         Motion Components                │
│  (Framer Motion Wrapper'ları)            │
├─────────────────────────────────────────┤
│  FadeIn.tsx                              │
│  ├── useRef (React)                      │
│  ├── useInView (Framer Motion)           │
│  └── motion.div (Framer Motion)          │
│                                          │
│  SlideUp.tsx                             │
│  ├── useRef (React)                      │
│  ├── useInView (Framer Motion)           │
│  └── motion.div (Framer Motion)          │
│                                          │
│  SlideIn.tsx                             │
│  ├── useRef (React)                      │
│  ├── useInView (Framer Motion)           │
│  └── motion.div (Framer Motion)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           UI Components                  │
├─────────────────────────────────────────┤
│  Button.tsx                              │
│  ├── motion.button (Framer Motion)       │
│  └── HTMLMotionProps                     │
│                                          │
│  Card.tsx                                │
│  ├── motion.div (Framer Motion)          │
│  └── LucideIcon                          │
│                                          │
│  Header.tsx                              │
│  ├── motion.header (Framer Motion)       │
│  ├── motion.div (Logo)                   │
│  ├── motion.button (User)                │
│  └── Lucide Icons (Waves, User)          │
│                                          │
│  Navigation.tsx                          │
│  ├── motion.nav (Framer Motion)          │
│  ├── motion.button (Tabs)                │
│  ├── motion.div (Active Indicator)       │
│  ├── useState (React)                    │
│  └── Lucide Icons (Home, Calendar, etc)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Library Files                   │
├─────────────────────────────────────────┤
│  firebaseClient.ts                       │
│  ├── initializeApp (Firebase)            │
│  ├── getFirestore (Firebase)             │
│  └── getAuth (Firebase)                  │
│                                          │
│  utils.ts                                │
│  └── cn() (Tailwind merge)               │
└─────────────────────────────────────────┘
```

## 🎨 Stil Akışı

```
globals.css
├── @import "tailwindcss"
├── @font-face (Poppins)
├── :root (CSS Variables)
└── @layer base (Base Styles)

tailwind.config.ts
├── darkMode: "class"
├── content: [...files]
└── theme.extend
    ├── colors
    │   ├── navy (3 shades)
    │   └── teal (3 shades)
    ├── fontFamily
    │   └── sans (Poppins)
    └── animation
        ├── fade-in
        ├── slide-up
        └── slide-in
```

## 🔄 Veri Akışı

```
User Interaction
      ↓
Navigation Tab Click
      ↓
useState (activeTab)
      ↓
Conditional Styling
      ↓
Layout Animation
      ↓
Visual Feedback
```

```
Page Load
      ↓
Intersection Observer
      ↓
Element in Viewport?
      ↓
Trigger Animation
      ↓
Motion Component
      ↓
Framer Motion
      ↓
CSS Transform/Opacity
```

## 📱 Responsive Davranış

```
Mobile (< 768px)
├── Single column layout
├── Smaller font sizes
├── Full-width buttons
├── Stacked cards
└── Compact navigation

Tablet (768px - 1024px)
├── 2-column grid
├── Medium font sizes
├── Flexible buttons
├── Side-by-side cards
└── Expanded navigation

Desktop (> 1024px)
├── 3-column grid
├── Large font sizes
├── Fixed-width buttons
├── Horizontal cards
└── Full navigation
```

## 🎭 Animasyon Zinciri

```
Page Load
    ↓
Header Animation (y: -100 → 0)
    ↓
Hero Content
    ├── FadeIn (delay: 0.2s)
    ├── FadeIn (delay: 0.4s)
    └── FadeIn (delay: 0.6s)
    ↓
Scroll Down
    ↓
Services Section
    ├── SlideUp (delay: 0.2s) - Header
    ├── SlideUp (delay: 0.3s) - Card 1
    ├── SlideUp (delay: 0.4s) - Card 2
    └── SlideUp (delay: 0.5s) - Card 3
    ↓
Scroll Down
    ↓
Features Section
    ├── SlideUp (delay: 0.2s) - Header
    ├── SlideUp (delay: 0.3s) - Stat 1
    ├── SlideUp (delay: 0.4s) - Stat 2
    └── SlideUp (delay: 0.5s) - Stat 3
    ↓
Navigation Animation (y: 100 → 0)
```

## 🔧 Konfigürasyon Akışı

```
Environment Variables (.env.local)
            ↓
    firebaseClient.ts
            ↓
    Firebase Services
    ├── Firestore (db)
    ├── Auth (auth)
    └── App (app)
            ↓
    Components (import)
            ↓
    Usage in Pages
```

## 📊 State Yönetimi

```
Navigation Component
├── activeTab: string
│   ├── Initial: "home"
│   ├── Update: setActiveTab(id)
│   └── Effect: Conditional styling
│
└── Layout Animation
    └── layoutId: "activeTab"
        └── Shared element transition
```

## 🎯 Event Flow

```
Button Click
    ↓
onClick Handler
    ↓
Console Log / Function Call
    ↓
(Future: API Call)
    ↓
(Future: State Update)
    ↓
(Future: UI Update)
```

## 🌐 Routing Yapısı

```
/ (Root)
├── layout.tsx (Root Layout)
│   ├── Header
│   ├── {children}
│   └── Navigation
│
└── page.tsx (Home Page)
    └── Client Component

(Future Routes)
├── /rezervasyon
├── /tekneler
├── /turlar
├── /hakkimizda
└── /iletisim
```

## 🎨 Tema Sistemi

```
Tailwind Config
    ↓
Custom Colors
├── navy.*
└── teal.*
    ↓
CSS Variables (globals.css)
    ↓
Component Styling
├── className="bg-navy"
├── className="text-teal"
└── className="hover:bg-navy-light"
```

## 🔐 Güvenlik Katmanları

```
Client Side
├── Environment Variables
│   └── NEXT_PUBLIC_* prefix
├── Firebase Client SDK
│   └── Browser-safe operations
└── Input Validation
    └── (Future implementation)

Server Side (Future)
├── API Routes
├── Server Actions
└── Firebase Admin SDK
```

## 📈 Performans Optimizasyonu

```
Build Time
├── Next.js Optimization
├── Tailwind Purge
└── Tree Shaking

Runtime
├── Intersection Observer
│   └── Lazy animation triggering
├── Once Animation
│   └── Single execution
└── React Memoization
    └── (Future optimization)

Loading
├── Font Optimization
├── Image Optimization
└── Code Splitting
```

---

Bu yapı, projenin tüm katmanlarını ve bileşenler arası ilişkileri gösterir.
