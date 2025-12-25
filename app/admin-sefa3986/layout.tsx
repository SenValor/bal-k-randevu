'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
      router.push('/');
    }
  };

  useEffect(() => {
    if (!loading) {
      // İzin verilen admin email'leri
      const ADMIN_EMAILS = ['baliksefasi33@admin.com', 'bukre@akturk.com'];
      
      if (!user) {
        // Kullanıcı giriş yapmamış - login'e yönlendir
        router.push('/login?redirect=/admin-sefa3986');
      } else if (!ADMIN_EMAILS.includes(user.email || '')) {
        // Yetkisiz kullanıcı - ana sayfaya yönlendir
        alert('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Yükleniyor veya yetkisiz ise boş ekran göster
  const ADMIN_EMAILS = ['baliksefasi33@admin.com', 'bukre@akturk.com'];
  if (loading || !user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Çıkış Yap Butonu - Sağ Üst Köşe */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 rounded-xl transition-all group"
      >
        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">Çıkış Yap</span>
      </button>
      
      {children}
    </div>
  );
}
