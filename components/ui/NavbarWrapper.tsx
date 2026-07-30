'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  if (
    pathname?.startsWith('/admin-sefa3986') ||
    pathname?.startsWith('/kampanya-kodlar-3313') ||
    pathname?.startsWith('/tamay-3313')
  ) return null;
  return <Navbar />;
}
