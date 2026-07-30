import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/ui/NavbarWrapper";
import ChatWidget from "@/components/ui/ChatWidget";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans overflow-x-hidden">
        <AuthProvider>
          <LanguageProvider>
            <NavbarWrapper />
            {children}
            <ChatWidget />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
