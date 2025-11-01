'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export default function AuthModal({ isOpen, onClose, onContinueAsGuest }: AuthModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    // Mevcut sayfayı redirect parametresi olarak gönder
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    // Login sayfasına gidince modal otomatik kapanacak
  };

  const handleGuest = () => {
    // onClose çağırma, sadece onContinueAsGuest çağır
    // Modal kapanması onContinueAsGuest içinde halledilecek
    onContinueAsGuest();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              // Backdrop'a tıklayınca hiçbir şey yapma
              // Sadece X butonuna tıklayınca kapansın
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md bg-gradient-to-br from-[#D5E9F0] to-[#C5D9E8] rounded-3xl border-2 border-[#6B9BC3]/40 p-8 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/70 hover:bg-white border-2 border-[#6B9BC3]/30 flex items-center justify-center text-[#1B3A5C] transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] flex items-center justify-center shadow-lg shadow-[#6B9BC3]/40">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[#0D2847] text-center mb-2">
                Rezervasyon Yapmak İçin
              </h2>
              <p className="text-[#1B3A5C]/70 text-center mb-8">
                Giriş yapın veya misafir olarak devam edin
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Login Button */}
                <motion.button
                  onClick={handleLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl shadow-lg shadow-[#8B3A3A]/30 hover:shadow-[#8B3A3A]/50 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </motion.button>

                {/* Guest Button */}
                <motion.button
                  onClick={handleGuest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/70 hover:bg-white border-2 border-[#6B9BC3]/30 hover:border-[#6B9BC3]/50 text-[#0D2847] font-semibold rounded-xl transition-all"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Misafir Olarak Devam Et</span>
                </motion.button>
              </div>

              {/* Info */}
              <p className="text-[#1B3A5C]/60 text-xs text-center mt-6">
                Giriş yaparak rezervasyonlarınızı takip edebilirsiniz
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
