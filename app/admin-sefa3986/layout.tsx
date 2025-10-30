'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Sadece özel admin email'ine izin ver
      const ADMIN_EMAIL = 'baliksefasi33@admin.com';
      
      if (!user) {
        // Kullanıcı giriş yapmamış - login'e yönlendir
        router.push('/login?redirect=/admin-sefa3986');
      } else if (user.email !== ADMIN_EMAIL) {
        // Yetkisiz kullanıcı - ana sayfaya yönlendir
        alert('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Yükleniyor veya yetkisiz ise boş ekran göster
  if (loading || !user || user.email !== 'baliksefasi33@admin.com') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return <>{children}</>;
}
