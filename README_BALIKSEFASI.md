# Balık Sefası - Tekne Kiralama & Balık Avı Turları

Modern, mobil uygulama benzeri bir web sitesi. Apple tarzı yumuşak animasyonlar ve scroll bazlı geçişler içerir.

## 🎨 Tasarım Özellikleri

- **Renk Paleti**: Koyu lacivert (#003366), açık mavi (#00A9A5), beyaz
- **Font**: Poppins (Google Fonts)
- **Animasyonlar**: Framer Motion ile Apple tarzı geçişler
- **Responsive**: Mobil öncelikli tasarım

## 🚀 Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🔥 Firebase Yapılandırması

Firebase'i kullanmak için:

1. `.env.local` dosyası oluşturun
2. `firebase.config.example.txt` dosyasındaki değişkenleri kopyalayın
3. Firebase Console'dan aldığınız değerlerle doldurun

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📁 Proje Yapısı

```
baliksefasiv3.1/
├── app/
│   ├── layout.tsx          # Ana layout (Header + Navigation)
│   ├── page.tsx            # Ana sayfa
│   └── globals.css         # Global stiller
├── components/
│   ├── motion/             # Animasyon wrapper'ları
│   │   ├── FadeIn.tsx
│   │   ├── SlideUp.tsx
│   │   └── SlideIn.tsx
│   └── ui/                 # UI bileşenleri
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Header.tsx
│       └── Navigation.tsx
├── lib/
│   ├── firebaseClient.ts   # Firebase yapılandırması
│   └── utils.ts
└── tailwind.config.ts      # Tailwind yapılandırması
```

## 🎯 Özellikler

### Ana Sayfa
- **Hero Bölümü**: Boğaz fotoğrafı arka planı ile etkileyici giriş
- **Hizmet Kartları**: 
  - Tekne Kiralama
  - Balık Avı Turu
  - Grup Rezervasyon
- **İstatistikler**: Deneyim, müşteri sayısı ve filo bilgileri

### Animasyonlar
- Scroll bazlı fade-in ve slide-up efektleri
- Hover animasyonları
- Sayfa geçiş animasyonları
- Apple tarzı easing fonksiyonları

### Navigation
- Sabit üst header (logo + kullanıcı ikonu)
- Alt navigation bar (Ana Sayfa, Rezervasyonlarım, Profil)
- Aktif tab göstergesi ile smooth geçişler

## 🛠️ Teknolojiler

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Animasyon**: Framer Motion 12
- **İkonlar**: Lucide React
- **Backend**: Firebase (Firestore, Auth)
- **TypeScript**: Tip güvenliği

## 📱 Responsive Tasarım

- Mobil: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 🎨 Özelleştirme

### Renkleri Değiştirme

`tailwind.config.ts` dosyasında:

```typescript
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

### Animasyon Süreleri

Motion bileşenlerinde `duration` ve `delay` prop'larını ayarlayın:

```tsx
<SlideUp delay={0.3} duration={0.8}>
  {/* İçerik */}
</SlideUp>
```

## 📦 Build

```bash
# Production build
npm run build

# Production sunucusu
npm start
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir.

## 📞 İletişim

Balık Sefası - [@baliksefasi](https://twitter.com/baliksefasi)

Proje Linki: [https://github.com/yourusername/baliksefasiv3.1](https://github.com/yourusername/baliksefasiv3.1)
