import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MaintenanceCheck from "@/components/MaintenanceCheck";

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
        <MaintenanceCheck>
          <Navbar />
          <main>
            {children}
          </main>
        </MaintenanceCheck>
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Üst Bölüm - Linkler */}
            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                <a
                  href="/rezervasyon-sorgula"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>🔍</span>
                  <span>Rezervasyon Sorgula</span>
                </a>
                
                <a
                  href="/randevu"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>🎣</span>
                  <span>Randevu Al</span>
                </a>
                
                <a
                  href="/iletisim"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>📞</span>
                  <span>İletişim</span>
                </a>
              </div>
            </div>

            {/* Alt Bölüm - Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-300 text-sm">
                  © 2025 Balık Sefası. Tüm hakları saklıdır.
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-3">
                <span className="text-gray-400 text-sm">Design by</span>
                <a
                  href="https://wa.me/905304235883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-base transition-all duration-500 flex items-center space-x-3 shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 hover:-translate-y-1 border-2 border-green-300/50 hover:border-green-200 overflow-hidden"
                  title="MSV Soft ile iletişime geçin"
                >
                  {/* Arka plan parlama efekti */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* WhatsApp Icon Container */}
                  <div className="relative w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white"></div>
                  </div>
                  
                  {/* Metin */}
                  <div className="relative z-10 flex flex-col items-start">
                    <span className="text-lg font-black tracking-wide">MSV Soft</span>
                    <span className="text-xs text-green-100 opacity-90 font-medium">Software Developer</span>
                  </div>
                  
                  {/* Sağ ok */}
                  <div className="relative">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                  
                  {/* Animated dots */}
                  <div className="absolute -top-2 -right-2 flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  
                  {/* Alt çizgi efekti */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-500"></div>
                </a>
                
                {/* Küçük açıklama */}
                <p className="text-gray-500 text-xs text-center max-w-xs">
                  Profesyonel Yazılım hizmetleri
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
