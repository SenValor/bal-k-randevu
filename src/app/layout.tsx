import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Balık Sefası - Tekne Kiralama & Rezervasyon",
  description: "İstanbul Sarıyer'de balıkçı teknesi kiralama ve koltuk rezervasyonu. Eyüp Odabaşı Sporcular Parkı'nda deniz keyfi.",
  keywords: "tekne kiralama, balık avı, İstanbul, Sarıyer, rezervasyon, deniz turu",
  authors: [{ name: "Balık Sefası" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main>
          {children}
        </main>
        <footer className="bg-gray-900 text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-300 text-sm">
                  © 2024 Balık Sefası. Tüm hakları saklıdır.
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">Design by</span>
                <a
                  href="https://wa.me/905304235883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-lg">💬</span>
                  <span className="font-bold">MSV Soft</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
