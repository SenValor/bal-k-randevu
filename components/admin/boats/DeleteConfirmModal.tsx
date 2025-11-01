'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Boat, deleteBoat } from '@/lib/boatHelpers';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  boat: Boat | null;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  boat,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = async () => {
    if (!boat) return;

    setLoading(true);
    const result = await deleteBoat(boat.id);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && boat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] md:w-[480px] bg-gradient-to-b from-[#001F3F]/95 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Tekneyi Sil
              </h2>
              <p className="text-white/60 text-sm">
                Bu işlem geri alınamaz!
              </p>
            </div>

            {/* Boat Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-white/60 text-sm mb-1">Silinecek Tekne:</p>
              <p className="text-white font-semibold text-lg">{boat.name}</p>
              {boat.description && (
                <p className="text-white/60 text-sm mt-2">{boat.description}</p>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">
                Bu tekneyi sildiğinizde, ilgili tüm rezervasyonlar ve veriler de silinecektir.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={onClose}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </motion.button>

              <motion.button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  'Sil'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
