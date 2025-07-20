'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Admin sayfalarını bakım modundan muaf tut
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    // Bakım modu durumunu dinle
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'general'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsMaintenanceMode(data.maintenanceMode || false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Bakım modu durumu alınamadı:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Admin sayfaları veya bakım modu kapalıysa normal içeriği göster
  if (isAdminPage || !isMaintenanceMode) {
    return <>{children}</>;
  }

  // Bakım modu sayfası
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* İkon */}
        <div className="text-6xl mb-6">🔧</div>
        
        {/* Başlık */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Bakım Çalışması
        </h1>
        
        {/* Açıklama */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Sitemiz şu anda bakım çalışması nedeniyle geçici olarak kapatılmıştır. 
          Size daha iyi hizmet verebilmek için sistemimizi güncelliyoruz.
        </p>
        
        {/* Detaylar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Yapılan İşlemler:</h3>
          <ul className="text-blue-700 text-sm text-left space-y-1">
            <li>• Sistem güvenlik güncellemeleri</li>
            <li>• Rezervasyon sistemi iyileştirmeleri</li>
            <li>• Performans optimizasyonları</li>
          </ul>
        </div>
        
        {/* İletişim */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">📞 Acil Durumlarda İletişim:</h3>
          <div className="space-y-2">
            <a 
              href="tel:+905310892537" 
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>📱</span>
              <span>+90 531 089 25 37</span>
            </a>
            <br />
            <a 
              href="https://wa.me/905310892537" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-800 font-medium"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
        
        {/* Alt Bilgi */}
        <div className="mt-6 pt-4 border-t text-xs text-gray-500">
          <p>⏰ Kısa süre içinde tekrar hizmetinizdeyiz</p>
        </div>
      </div>
    </div>
  );
} 