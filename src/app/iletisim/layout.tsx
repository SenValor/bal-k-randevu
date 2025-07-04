import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim - Balık Sefası",
  description: "Balık Sefası ile iletişime geçin. Telefon, adres, WhatsApp ve rezervasyon bilgileri. Eyüp Odabaşı Sporcular Parkı, Sarıyer/İstanbul.",
  keywords: "iletişim, telefon, adres, balık sefası, rezervasyon, eyüp odabaşı, sarıyer, istanbul",
};

export default function IletisimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 