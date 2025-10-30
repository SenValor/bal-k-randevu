'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, User, Mail, Phone, LogOut, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#D5E9F0] via-[#C5D9E8] to-[#E8F4F8] flex items-center justify-center pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-[#6B9BC3] animate-spin mx-auto mb-4" />
          <p className="text-[#1B3A5C]/70">Yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D5E9F0] via-[#C5D9E8] to-[#E8F4F8] pt-24 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6B9BC3]/10 to-transparent" />
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#0D2847] mb-2">
              Hoş Geldin, {userData?.name || user?.displayName || 'Kullanıcı'} 👋
            </h1>
            <p className="text-[#1B3A5C]/70 text-lg">
              Profilin ve rezervasyon geçmişin
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 border-2 border-[#6B9BC3]/40 rounded-2xl backdrop-blur-md p-8 max-w-2xl mx-auto shadow-2xl"
        >
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0D2847]">
                {userData?.name || user?.displayName || 'Kullanıcı'}
              </h2>
              <p className="text-[#1B3A5C]/70 text-sm">Üye</p>
            </div>
          </div>

          {/* Profile Completion Warning */}
          {(!userData?.name || !userData?.phone) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-semibold text-sm">Profilini Tamamla</p>
                <p className="text-yellow-400/80 text-xs mt-1">
                  Rezervasyon yapabilmek için ad ve telefon bilgilerini eklemen gerekiyor.
                </p>
              </div>
            </motion.div>
          )}

          {/* Contact Info */}
          <div className="space-y-4 mb-6">
            {/* Email */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#D5E9F0]/60 border border-[#6B9BC3]/20">
              <div className="w-10 h-10 rounded-lg bg-[#6B9BC3]/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#6B9BC3]" />
              </div>
              <div>
                <p className="text-xs text-[#1B3A5C]/60">E-posta</p>
                <p className="text-sm font-medium text-[#0D2847]">{user?.email || 'Belirtilmemiş'}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#D5E9F0]/60 border border-[#6B9BC3]/20">
              <div className="w-10 h-10 rounded-lg bg-[#6B9BC3]/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#6B9BC3]" />
              </div>
              <div>
                <p className="text-xs text-[#1B3A5C]/60">Telefon</p>
                <p className="text-sm font-medium text-[#0D2847]">
                  {userData?.phone || user?.phoneNumber || 'Belirtilmemiş'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/my-reservations')}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Rezervasyonlarım
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex-1 py-3 px-4 bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 text-[#1B3A5C] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#6B9BC3]/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </motion.button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 rounded-xl">
            <p className="text-[#1B3A5C]/70 text-sm text-center">
              Rezervasyon yapmak için <button onClick={() => router.push('/rezervasyon')} className="text-[#8B3A3A] hover:underline font-semibold">buraya tıklayın</button> 🎣
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
