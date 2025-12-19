import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Balık Sefası - Tekne Kiralama & Balık Avı Turları",
  description: "İstanbul Boğazı'nda tekne kiralama ve balık avı turları. Unutulmaz deneyimler için hemen rezervasyon yapın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans overflow-x-hidden">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
