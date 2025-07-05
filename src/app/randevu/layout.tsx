import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Randevu Al - Balık Sefası",
  description: "Balık avı turu için kolay rezervasyon. Adım adım basit formla hemen randevu alın. Normal tur veya özel tur seçenekleri.",
  keywords: "randevu, rezervasyon, balık avı, tekne kiralama, özel tur, normal tur",
};

export default function RandevuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 