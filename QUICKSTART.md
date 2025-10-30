# 🚀 Hızlı Başlangıç Kılavuzu

## 1️⃣ Projeyi Çalıştırma

```bash
# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda http://localhost:3000 adresini açın.

## 2️⃣ Proje Yapısı

```
baliksefasiv3.1/
├── app/
│   ├── layout.tsx              # Ana layout (Header + Navigation dahil)
│   ├── page.tsx                # Ana sayfa (Unsplash görselli)
│   ├── page-alternative.tsx    # Alternatif sayfa (gradient arka plan)
│   └── globals.css             # Global stiller
│
├── components/
│   ├── motion/                 # Animasyon wrapper'ları
│   │   ├── FadeIn.tsx         # Fade-in animasyonu
│   │   ├── SlideUp.tsx        # Aşağıdan yukarı kayma
│   │   └── SlideIn.tsx        # Yandan kayma
│   │
│   └── ui/                     # UI bileşenleri
│       ├── Button.tsx         # Animasyonlu buton
│       ├── Card.tsx           # Hizmet kartları
│       ├── Header.tsx         # Üst header
│       └── Navigation.tsx     # Alt navigation bar
│
├── lib/
│   ├── firebaseClient.ts      # Firebase yapılandırması
│   └── utils.ts               # Yardımcı fonksiyonlar
│
└── tailwind.config.ts         # Tailwind yapılandırması
```

## 3️⃣ Önemli Dosyalar

### Ana Sayfa Seçenekleri

**Option 1: Unsplash Görselli (Varsayılan)**
- Dosya: `app/page.tsx`
- Boğaz fotoğrafı arka planlı hero section

**Option 2: Gradient Arka Planlı**
- Dosya: `app/page-alternative.tsx`
- Animasyonlu gradient arka plan
- Daha hızlı yükleme

Alternatif versiyonu kullanmak için:
```bash
mv app/page.tsx app/page-original.tsx
mv app/page-alternative.tsx app/page.tsx
```

## 4️⃣ Firebase Kurulumu (Opsiyonel)

1. `.env.local` dosyası oluşturun:
```bash
touch .env.local
```

2. Firebase değişkenlerini ekleyin:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Firebase'i kullanın:
```tsx
import { db, auth } from '@/lib/firebaseClient';
```

## 5️⃣ Renk Paletini Özelleştirme

`tailwind.config.ts` dosyasını düzenleyin:

```typescript
colors: {
  navy: {
    DEFAULT: '#003366',  // Ana lacivert
    dark: '#002244',     // Koyu lacivert
    light: '#004488',    // Açık lacivert
  },
  teal: {
    DEFAULT: '#00A9A5',  // Ana turkuaz
    light: '#00C9C5',    // Açık turkuaz
    dark: '#008985',     // Koyu turkuaz
  },
}
```

## 6️⃣ Yeni Sayfa Ekleme

```tsx
// app/hakkimizda/page.tsx
'use client';

import FadeIn from '@/components/motion/FadeIn';
import SlideUp from '@/components/motion/SlideUp';

export default function Hakkimizda() {
  return (
    <div className="pt-16 pb-24">
      <FadeIn>
        <h1 className="text-4xl font-bold text-navy text-center">
          Hakkımızda
        </h1>
      </FadeIn>
      
      <SlideUp delay={0.2}>
        <p className="text-gray-600 text-center mt-4">
          İçerik buraya...
        </p>
      </SlideUp>
    </div>
  );
}
```

## 7️⃣ Yeni Bileşen Ekleme

```tsx
// components/ui/YeniBilesen.tsx
'use client';

import { motion } from 'framer-motion';

interface YeniBilesenProps {
  title: string;
  description: string;
}

export default function YeniBilesen({ title, description }: YeniBilesenProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-6 bg-white rounded-lg shadow-lg"
    >
      <h3 className="text-xl font-bold text-navy">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
    </motion.div>
  );
}
```

## 8️⃣ Animasyon Kullanımı

### Fade In
```tsx
<FadeIn delay={0.2} duration={0.6}>
  <div>İçerik</div>
</FadeIn>
```

### Slide Up
```tsx
<SlideUp delay={0.3} distance={30}>
  <div>İçerik</div>
</SlideUp>
```

### Slide In
```tsx
<SlideIn direction="left" delay={0.4}>
  <div>İçerik</div>
</SlideIn>
```

## 9️⃣ Buton Kullanımı

```tsx
import Button from '@/components/ui/Button';

// Primary buton
<Button variant="primary" size="lg">
  Rezervasyon Yap
</Button>

// Secondary buton
<Button variant="secondary" size="md">
  Daha Fazla
</Button>

// Outline buton
<Button variant="outline" size="sm">
  İptal
</Button>
```

## 🔟 Kart Kullanımı

```tsx
import Card from '@/components/ui/Card';
import { Anchor } from 'lucide-react';

<Card
  icon={Anchor}
  title="Tekne Kiralama"
  description="Lüks teknelerimizle Boğaz'ın eşsiz manzarasının keyfini çıkarın"
  onClick={() => console.log('Tıklandı')}
/>
```

## 🎨 Tailwind Sınıfları

### Renkler
```tsx
className="bg-navy text-white"
className="bg-teal text-white"
className="text-navy"
className="text-teal"
```

### Spacing
```tsx
className="p-4"      // padding: 1rem
className="m-8"      // margin: 2rem
className="px-6"     // padding-left & right: 1.5rem
className="py-12"    // padding-top & bottom: 3rem
```

### Typography
```tsx
className="text-3xl font-bold"
className="text-lg font-medium"
className="text-sm font-light"
```

## 🐛 Yaygın Sorunlar

### Problem: Animasyonlar çalışmıyor
**Çözüm**: Bileşenin başına `'use client'` ekleyin

### Problem: Renkler görünmüyor
**Çözüm**: `npm run dev` komutunu yeniden başlatın

### Problem: Firebase hatası
**Çözüm**: `.env.local` dosyasını kontrol edin

### Problem: Import hatası
**Çözüm**: `@/` path alias'ını kullanın (örn: `@/components/ui/Button`)

## 📦 Build ve Deploy

```bash
# Production build
npm run build

# Build'i test et
npm start

# Vercel'e deploy
vercel deploy
```

## 🔗 Faydalı Linkler

- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Firebase](https://firebase.google.com/docs)

## 💡 İpuçları

1. **Animasyon Delay**: Her bileşen için 0.1-0.2 saniye artırın
2. **Responsive**: Mobil-first yaklaşım kullanın
3. **Performance**: `once: true` ile animasyonları optimize edin
4. **Accessibility**: Butonlara anlamlı `aria-label` ekleyin
5. **SEO**: Her sayfaya `metadata` ekleyin

## 🎯 Sonraki Adımlar

1. ✅ Projeyi çalıştırın
2. ✅ Ana sayfayı inceleyin
3. ✅ Bileşenleri test edin
4. 🔲 Firebase'i yapılandırın
5. 🔲 Yeni sayfalar ekleyin
6. 🔲 Backend entegrasyonu yapın
7. 🔲 Production'a deploy edin

---

**Yardıma mı ihtiyacınız var?** `COMPONENTS.md` dosyasına bakın!
