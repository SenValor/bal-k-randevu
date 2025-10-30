import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS) - Balık Sefası | Tekne Kiralama F.A.Q",
  description: "Balık Sefası hakkında sıkça sorulan sorular ve cevapları. Tur saatleri, fiyatlar, olta kiralama, güvenlik önlemleri, rezervasyon iptal koşulları ve daha fazlası.",
  keywords: [
    "sıkça sorulan sorular",
    "SSS",
    "balık sefası sorular",
    "tur saatleri",
    "fiyat bilgisi",
    "olta kiralama",
    "güvenlik önlemleri",
    "rezervasyon iptal",
    "tekne kiralama SSS",
    "balık avı soruları",
    "FAQ"
  ].join(", "),
  openGraph: {
    title: 'Sıkça Sorulan Sorular (SSS) - Balık Sefası',
    description: 'Balık Sefası hakkında sıkça sorulan sorular ve cevapları. Tur saatleri, fiyatlar, güvenlik önlemleri ve daha fazlası.',
    url: 'https://baliksefasi.com/sss',
    images: [
      {
        url: 'https://baliksefasi.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Balık Sefası - SSS',
      },
    ],
  },
  twitter: {
    title: 'SSS - Balık Sefası | Sıkça Sorulan Sorular',
    description: 'Balık Sefası hakkında sıkça sorulan sorular. Tur saatleri, fiyatlar, güvenlik önlemleri.',
  },
  alternates: {
    canonical: 'https://baliksefasi.com/sss',
  },
}

export default function SSSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 