'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import RegisterForm from './RegisterForm';

interface ReservationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterComplete: () => void;
  onGuestContinue: () => void;
}

export default function ReservationPopup({
  isOpen,
  onClose,
  onRegisterComplete,
  onGuestContinue,
}: ReservationPopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] md:w-[420px] bg-gradient-to-b from-[#001F3F]/95 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
          >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors cursor-pointer p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Rezervasyon Yap
                </h2>
                <p className="text-white/60 text-sm">
                  Devam etmeden önce giriş yap veya misafir olarak devam et.
                </p>
              </motion.div>

              {/* Register Form */}
              <RegisterForm onSubmit={onRegisterComplete} />

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 my-6"
              >
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">veya</span>
                <div className="flex-1 h-px bg-white/10" />
              </motion.div>

              {/* Guest Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGuestContinue}
                className="w-full py-4 bg-white/10 text-white border border-white/20 font-semibold rounded-2xl hover:bg-white/20 transition-all"
              >
                Üyeliksiz Devam Et
              </motion.button>

              {/* Info Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-white/40 text-center mt-4"
              >
                Üye olarak rezervasyon geçmişinizi takip edebilirsiniz
              </motion.p>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
