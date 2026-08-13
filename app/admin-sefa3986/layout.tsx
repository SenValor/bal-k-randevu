'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminProvider, useAdmin } from '@/context/AdminContext';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { isAdminLoading, isAuthorized, adminName } = useAdmin();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
      router.push('/');
    }
  };

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      if (!user) {
        router.push('/login?redirect=/admin-sefa3986');
      } else if (!isAuthorized) {
        alert('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
      }
    }
  }, [user, loading, isAdminLoading, isAuthorized, router]);

  if (loading || isAdminLoading || !user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Admin bilgisi + Çıkış butonu */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm">
          <User className="w-3.5 h-3.5" />
          <span>{adminName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 rounded-xl transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Çıkış</span>
        </button>
      </div>

      {children}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminProvider>
  );
}
