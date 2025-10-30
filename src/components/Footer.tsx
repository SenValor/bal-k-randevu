'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Ana sayfada footer'ı gizle
  if (pathname === '/') {
    return null;
  }

  return (
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
          
          <div className="flex items-center justify-center">
            <a
              href="mailto:info@msvsoft.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 text-xs transition-colors duration-300"
              title="Web Developer"
            >
              Design by MSV Soft
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
