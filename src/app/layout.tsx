import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
