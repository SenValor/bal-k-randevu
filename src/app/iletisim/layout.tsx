import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "İletişim - Balık Sefası | Rezervasyon & Bilgi Hattı",
  description: "Balık Sefası ile iletişime geçin! 0531 089 25 37 - WhatsApp, telefon rezervasyonu. Eyüp Odabaşı Sporcular Parkı buluşma noktası, çalışma saatleri ve iletişim bilgileri.",
  keywords: [
    "iletişim",
    "rezervasyon",
    "balık sefası telefon",
    "0531 089 25 37",
    "WhatsApp rezervasyon",
    "Eyüp Odabaşı Sporcular Parkı",
    "Sarıyer buluşma noktası",
    "tekne kiralama iletişim",
    "çalışma saatleri",
    "İstanbul balık avı reservasyon"
  ].join(", "),
  openGraph: {
    title: 'İletişim - Balık Sefası | Rezervasyon & Bilgi Hattı',
    description: 'Balık Sefası ile iletişime geçin! 0531 089 25 37 - WhatsApp, telefon rezervasyonu. Eyüp Odabaşı Sporcular Parkı buluşma noktası.',
    url: 'https://baliksefasi.com/iletisim',
    images: [
      {
        url: 'https://baliksefasi.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Balık Sefası - İletişim',
      },
    ],
  },
  twitter: {
    title: 'İletişim - Balık Sefası | Rezervasyon & Bilgi',
    description: 'Rezervasyon için 0531 089 25 37 - WhatsApp, telefon. Eyüp Odabaşı Sporcular Parkı buluşma noktası.',
  },
  alternates: {
    canonical: 'https://baliksefasi.com/iletisim',
  },
  other: {
    'contact:phone_number': '+905310892537',
    'contact:country_name': 'Turkey',
    'contact:region': 'Istanbul',
    'contact:postal_code': '34450',
    'contact:street_address': 'Eyüp Odabaşı Sporcular Parkı, Yenimahalle Mah. Yeni Mahalle Cd',
  },
}

export default function IletisimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 