This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Tekne Randevu Sistemi

Bu proje, tekne kiralama ve rezervasyon yönetimi için geliştirilmiş bir Next.js uygulamasıdır.

### Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Firebase'e admin kullanıcısı oluşturun:
```bash
node src/scripts/init-admin.js
```

3. Varsayılan saat dilimlerini oluşturun:
```bash
node src/scripts/init-times.js
```

4. Fotoğraf ayarlarını başlatın:
```bash
node src/scripts/init-photos.js
```

5. **ÖNEMLİ: Firebase Storage Security Rules'ını Ayarlayın**
   - [Firebase Console](https://console.firebase.google.com) → Projeniz → Storage → Rules
   - Aşağıdaki kuralları yapıştırın:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   - **Publish** butonuna tıklayın

6. Uygulamayı başlatın:
```bash
npm run dev
```

### Admin Panel

- URL: `/admin`
- Email: `admin@baliksefasi.com`
- Şifre: `admin123`

#### Fotoğraf Yönetimi

Admin panelindeki "Fotoğraflar" sekmesinden:
- ✅ Tekne fotoğrafı yükleme (JPG, PNG, WEBP - max 5MB)
- ✅ Mevcut fotoğrafları silme
- ✅ Fotoğrafları büyük boyutta görüntüleme
- ✅ Otomatik sıralama (yüklenme tarihine göre)
- ✅ Ana sayfada real-time görüntüleme

### Özellikler

- **Rezervasyon Yönetimi**: Müşteri rezervasyonlarını görüntüleme, onaylama, düzenleme
- **Saat Dilimi Yönetimi**: Admin panelinden saat dilimlerini ekleme/silme
- **Fotoğraf Yönetimi**: Admin panelinden tekne fotoğraflarını ekleme/silme (Firebase Storage)
- **Real-time Güncellemeler**: Canlı rezervasyon takibi
- **WhatsApp Entegrasyonu**: Otomatik müşteri bilgilendirme
- **Özel Tur Sistemi**: Tüm tekne kiralama seçeneği
- **Dinamik Fotoğraf Gösterimi**: Ana sayfada Firebase'den çekilen fotoğraflar
- **CORS Güvenli Upload**: Firebase Storage entegrasyonu
