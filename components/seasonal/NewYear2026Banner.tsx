'use client';

import { motion } from 'framer-motion';
import { Sparkles, PartyPopper, Star } from 'lucide-react';

export default function NewYear2026Banner() {
  return (
    <>
      {/* Ana Banner - Üstte - Responsive */}
      <motion.div
        initial={{ y: -200, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.2, 
          delay: 0.5,
          type: 'spring',
          bounce: 0.5,
        }}
        className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-[95vw] md:max-w-none"
      >
        <motion.div
          animate={{ 
            rotateY: [0, 10, -10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          {/* Glow efekti - Soft ve uyumlu */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#6B9BC3]/40 via-[#00A9A5]/40 to-[#6B9BC3]/40 blur-2xl md:blur-3xl opacity-50 rounded-full scale-110" />
          
          {/* Ana banner - Şık ve soft */}
          <div className="relative bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-xl px-4 md:px-12 py-3 md:py-5 rounded-2xl md:rounded-3xl shadow-2xl border border-[#6B9BC3]/20">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity },
                }}
                className="hidden sm:block"
              >
                <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-[#00A9A5]" fill="currentColor" />
              </motion.div>
              
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide bg-gradient-to-r from-[#003366] via-[#00A9A5] to-[#6B9BC3] bg-clip-text text-transparent"
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0, 169, 165, 0.3))',
                  }}
                >
                  ✨ Mutlu Yıllar 2026 ✨
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-xs sm:text-sm md:text-base font-medium mt-1 text-[#003366]/70 hidden sm:block"
                >
                  Yeni Yıl, Yeni Maceralar ⚓
                </motion.div>
              </div>
              
              <motion.div
                animate={{ 
                  rotate: [0, -360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity, delay: 1 },
                }}
                className="hidden sm:block"
              >
                <Star className="w-5 h-5 md:w-7 md:h-7 text-[#6B9BC3]" fill="currentColor" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Köşe Dekorasyonları - Soft ve uyumlu */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="fixed top-4 md:top-6 left-2 md:left-6 z-40 pointer-events-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.15, 1],
          }}
          transition={{ 
            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Star className="w-6 h-6 md:w-10 md:h-10 text-[#00A9A5] opacity-80" fill="currentColor" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 169, 165, 0.5))' }} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: 180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="fixed top-4 md:top-6 right-2 md:right-6 z-40 pointer-events-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, -360],
            scale: [1, 1.15, 1],
          }}
          transition={{ 
            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
          }}
        >
          <Star className="w-6 h-6 md:w-10 md:h-10 text-[#6B9BC3] opacity-80" fill="currentColor" style={{ filter: 'drop-shadow(0 0 8px rgba(107, 155, 195, 0.5))' }} />
        </motion.div>
      </motion.div>

      {/* Alt köşe yıldızlar - Soft ve uyumlu */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="fixed bottom-24 md:bottom-32 left-2 md:left-8 z-40 pointer-events-none"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-6 h-6 md:w-9 md:h-9 text-[#00A9A5] opacity-70" fill="currentColor" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 169, 165, 0.4))' }} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.7 }}
        className="fixed bottom-24 md:bottom-32 right-2 md:right-8 z-40 pointer-events-none"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -180, -360],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2.5,
          }}
        >
          <Sparkles className="w-6 h-6 md:w-9 md:h-9 text-[#6B9BC3] opacity-70" fill="currentColor" style={{ filter: 'drop-shadow(0 0 6px rgba(107, 155, 195, 0.4))' }} />
        </motion.div>
      </motion.div>

      {/* Işık Efektleri - Soft ve uyumlu */}
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-[#6B9BC3]/20 to-[#00A9A5]/20 rounded-full blur-3xl pointer-events-none z-30"
      />
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="fixed top-1/3 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-[#00A9A5]/20 to-[#6B9BC3]/20 rounded-full blur-3xl pointer-events-none z-30"
      />
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="fixed bottom-1/4 left-1/3 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-[#003366]/15 to-[#00A9A5]/15 rounded-full blur-3xl pointer-events-none z-30"
      />
    </>
  );
}
