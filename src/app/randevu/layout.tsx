import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Rezervasyon - Balık Sefası | Online Tekne Kiralama & Randevu",
  description: "Balık Sefası online rezervasyon sistemi. Normal tur (koltuk) ve özel tur seçenekleri. İstanbul Boğazı'nda balık avı için hemen rezervasyon yapın. Anlık müsaitlik durumu.",
  keywords: [
    "rezervasyon",
    "randevu",
    "balık sefası rezervasyon",
    "online rezervasyon",
    "tekne kiralama rezervasyon",
    "normal tur",
    "özel tur",
    "koltuk rezervasyonu",
    "İstanbul balık avı rezervasyon",
    "anlık müsaitlik",
    "çevrimiçi randevu"
  ].join(", "),
  openGraph: {
    title: 'Rezervasyon - Balık Sefası | Online Tekne Kiralama & Randevu',
    description: 'Online rezervasyon sistemi ile normal tur (koltuk) ve özel tur seçenekleri. İstanbul Boğazı\'nda balık avı için hemen rezervasyon yapın.',
    url: 'https://baliksefasi.com/randevu',
    images: [
      {
        url: 'https://baliksefasi.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Balık Sefası - Rezervasyon',
      },
    ],
  },
  twitter: {
    title: 'Rezervasyon - Balık Sefası | Online Randevu',
    description: 'Online rezervasyon sistemi ile normal tur ve özel tur seçenekleri. İstanbul Boğazı\'nda balık avı randevusu.',
  },
  alternates: {
    canonical: 'https://baliksefasi.com/randevu',
  },
}

export default function RandevuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 