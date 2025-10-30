import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Görsellerimiz - Balık Sefası | Tekne & Balık Avı Fotoğrafları",
  description: "Balık Sefası medya galerisi: İstanbul Boğazı'nda teknemiz, yakalanan balıklar, mutlu misafirler ve balık avı anlarının fotoğraf & video galerisi. Deniz turu deneyimimizi keşfedin.",
  keywords: [
    "görsellerimiz",
    "balık sefası fotoğraflar",
    "tekne fotoğrafları",
    "balık avı videoları",
    "İstanbul Boğazı fotoğrafları",
    "yakalanan balıklar",
    "deniz turu galerisi",
    "tekne kiralama galeri",
    "Sarıyer balık avı",
    "medya galerisi"
  ].join(", "),
  openGraph: {
    title: 'Görsellerimiz - Balık Sefası | Tekne & Balık Avı Fotoğrafları',
    description: 'İstanbul Boğazı\'nda teknemiz, yakalanan balıklar ve balık avı anlarının fotoğraf & video galerisi. Deniz turu deneyimimizi keşfedin.',
    url: 'https://baliksefasi.com/gorsellerimiz',
    images: [
      {
        url: 'https://baliksefasi.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Balık Sefası - Görsellerimiz',
      },
    ],
  },
  twitter: {
    title: 'Görsellerimiz - Balık Sefası | Tekne & Balık Avı',
    description: 'İstanbul Boğazı\'nda teknemiz ve balık avı anlarının fotoğraf & video galerisi.',
  },
  alternates: {
    canonical: 'https://baliksefasi.com/gorsellerimiz',
  },
}

export default function GorsellerimizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 