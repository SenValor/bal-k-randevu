import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import ChromeErrorBoundary from "@/components/ChromeErrorBoundary";

// Development ortamında diagnostic log'ları etkinleştir
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/lib/diagnostics').then(({ logSystemStatus }) => {
    logSystemStatus();
  });
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Balık Sefası - Tekne Kiralama & Rezervasyon | İstanbul Sarıyer",
  description: "İstanbul Sarıyer'de profesyonel balıkçı teknesi kiralama ve koltuk rezervasyonu. Eyüp Odabaşı Sporcular Parkı'nda deniz keyfi, balık avı turu. Güvenli ve konforlu tekne deneyimi.",
  keywords: [
    "tekne kiralama",
    "balık avı",
    "İstanbul tekne turu", 
    "Sarıyer tekne kiralama",
    "rezervasyon",
    "deniz turu",
    "balıkçı teknesi",
    "Eyüp Odabaşı",
    "sporcular parkı",
    "özel tekne turu",
    "normal tekne turu",
    "balık sefası"
  ].join(", "),
  authors: [{ name: "Balık Sefası", url: "https://baliksefasi.com" }],
  creator: "Balık Sefası",
  publisher: "Balık Sefası",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://baliksefasi.com',
    title: 'Balık Sefası - Tekne Kiralama & Rezervasyon | İstanbul Sarıyer',
    description: 'İstanbul Sarıyer\'de profesyonel balıkçı teknesi kiralama ve koltuk rezervasyonu. Eyüp Odabaşı Sporcular Parkı\'nda deniz keyfi, balık avı turu.',
    siteName: 'Balık Sefası',
    images: [
      {
        url: 'https://baliksefasi.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Balık Sefası - Tekne Kiralama İstanbul',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balık Sefası - Tekne Kiralama & Rezervasyon',
    description: 'İstanbul Sarıyer\'de profesyonel balıkçı teknesi kiralama ve rezervasyon. Deniz keyfi ve balık avı turu.',
    images: ['https://baliksefasi.com/logo.png'],
    creator: '@baliksefasi',
    site: '@baliksefasi',
  },
  alternates: {
    canonical: 'https://baliksefasi.com',
  },
  category: 'Tourism',
  classification: 'Boat Rental & Tourism Services',
  referrer: 'origin-when-cross-origin',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Balık Sefası',
    startupImage: [
      '/logo.png',
    ],
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: true,
    email: true,
    url: true,
  },
  verification: {
    google: 'google-site-verification=GOOGLE_SEARCH_CONSOLE_KODU_BURAYA', 
    yandex: 'yandex-verification=YANDEX_WEBMASTER_KODU_BURAYA', 
  },
  other: {
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3B82F6',
  colorScheme: 'light',
};

// JSON-LD Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://baliksefasi.com/#business",
      "name": "Balık Sefası",
      "image": "https://baliksefasi.com/logo.png",
      "url": "https://baliksefasi.com",
      "telephone": "+90-531-089-25-37",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Eyüp Odabaşı Sporcular Parkı",
        "addressLocality": "Sarıyer",
        "addressRegion": "İstanbul",
        "addressCountry": "TR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 41.1567,
        "longitude": 29.0465
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday", 
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "07:00",
          "closes": "20:00"
        }
      ],
      "servesCuisine": [],
      "priceRange": "$$",
      "description": "İstanbul Sarıyer'de profesyonel balıkçı teknesi kiralama ve koltuk rezervasyonu hizmeti."
    },
    {
      "@type": "WebSite",
      "@id": "https://baliksefasi.com/#website",
      "url": "https://baliksefasi.com",
      "name": "Balık Sefası",
      "description": "İstanbul Sarıyer'de tekne kiralama ve rezervasyon platformu",
      "publisher": {
        "@id": "https://baliksefasi.com/#business"
      },
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://baliksefasi.com/randevu?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://baliksefasi.com/#service",
      "name": "Tekne Kiralama ve Rezervasyon",
      "provider": {
        "@id": "https://baliksefasi.com/#business"
      },
      "serviceType": "Boat Rental",
      "description": "Balık avı ve deniz turu için profesyonel tekne kiralama hizmeti",
      "areaServed": {
        "@type": "City",
        "name": "İstanbul"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChromeErrorBoundary>
          <MaintenanceCheck>
            <Navbar />
            <main>
              {children}
            </main>
          </MaintenanceCheck>
        </ChromeErrorBoundary>
        <Footer />
      </body>
    </html>
  );
}
