'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Ana sayfada navbar'ı gizle
  if (pathname === '/') {
    return null;
  }

  const navigation = [
    { name: 'Ana Sayfa', href: '/', icon: '🏠' },
    { name: 'Hakkımızda', href: '/hakkimizda', icon: '👥' },
    { name: 'Görsellerimiz', href: '/gorsellerimiz', icon: '📸' },
    { name: 'Randevu Al', href: '/randevu', icon: '🎣' },
    { name: 'Rezervasyon Sorgula', href: '/rezervasyon-sorgula', icon: '🔍' },
    { name: 'SSS', href: '/sss', icon: '❓' },
    { name: 'İletişim', href: '/iletisim', icon: '📞' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-300">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Balık Sefası Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-800">Balık Sefası</h1>
              <p className="text-xs text-gray-600">Tekne Kiralama</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-slate-700 hover:bg-gray-100 transition-all duration-300 relative"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-slate-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-slate-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-slate-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="pb-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-3 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 