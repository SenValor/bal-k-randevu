'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

export default function ReservationNewYearDecor() {
  return (
    <>
      {/* Üst köşe mini yıldızlar - Soft */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="fixed top-20 md:top-24 left-4 md:left-8 z-30 pointer-events-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Star 
            className="w-5 h-5 md:w-7 md:h-7 text-[#00A9A5] opacity-60" 
            fill="currentColor" 
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 169, 165, 0.4))' }} 
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed top-20 md:top-24 right-4 md:right-8 z-30 pointer-events-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, -360],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
          }}
        >
          <Star 
            className="w-5 h-5 md:w-7 md:h-7 text-[#6B9BC3] opacity-60" 
            fill="currentColor" 
            style={{ filter: 'drop-shadow(0 0 6px rgba(107, 155, 195, 0.4))' }} 
          />
        </motion.div>
      </motion.div>

      {/* Mini ışıltılar - Floating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="fixed top-1/4 left-8 md:left-16 z-30 pointer-events-none"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, 5, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles 
            className="w-4 h-4 md:w-6 md:h-6 text-[#00A9A5] opacity-50" 
            fill="currentColor" 
            style={{ filter: 'drop-shadow(0 0 4px rgba(0, 169, 165, 0.3))' }} 
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="fixed top-1/3 right-8 md:right-16 z-30 pointer-events-none"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, -5, 0],
            rotate: [0, -180, -360],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        >
          <Sparkles 
            className="w-4 h-4 md:w-6 md:h-6 text-[#6B9BC3] opacity-50" 
            fill="currentColor" 
            style={{ filter: 'drop-shadow(0 0 4px rgba(107, 155, 195, 0.3))' }} 
          />
        </motion.div>
      </motion.div>

      {/* Soft ışık efektleri - Arka plan */}
      <motion.div
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed top-32 left-1/4 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-r from-[#6B9BC3]/15 to-[#00A9A5]/15 rounded-full blur-3xl pointer-events-none z-20"
      />
      
      <motion.div
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="fixed top-48 right-1/4 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-r from-[#00A9A5]/15 to-[#6B9BC3]/15 rounded-full blur-3xl pointer-events-none z-20"
      />

      {/* Yılbaşı badge - Sağ üstte kompakt */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, type: 'spring', bounce: 0.3 }}
        className="fixed top-3 md:top-4 right-16 md:right-20 z-40 pointer-events-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, -2, 2, 0],
            scale: [1, 1.03, 1],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="relative"
        >
          {/* Glow efekti */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00A9A5]/20 to-[#6B9BC3]/20 blur-lg rounded-xl scale-105" />
          
          {/* Badge - Daha kompakt */}
          <div className="relative bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-xl px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl shadow-lg border border-[#6B9BC3]/25">
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#00A9A5]" fill="currentColor" />
              <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#003366] to-[#00A9A5] bg-clip-text text-transparent whitespace-nowrap">
                Mutlu Yıllar 2026
              </span>
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#6B9BC3]" fill="currentColor" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Kar taneleri - Daha yoğun ve güzel */}
      {Array.from({ length: 35 }, (_, i) => {
        // Sabit değerler kullan (hydration hatası önleme)
        const left = (i * 6.7 + 3) % 100;
        const size = ((i % 4) + 2) * 0.8; // 1.6-4px arası
        const duration = 12 + (i % 15); // 12-27 saniye
        const delay = (i * 0.4) % 8; // 0-8 saniye delay
        const opacity = (i % 3) === 0 ? 0.7 : 0.5; // Bazıları daha parlak
        const blur = (i % 2) === 0 ? 1 : 1.5;
        
        return (
          <motion.div
            key={i}
            className="fixed rounded-full bg-white pointer-events-none z-25"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              filter: `blur(${blur}px)`,
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.5)',
            }}
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: '110vh',
              opacity: [0, opacity, opacity * 0.8, 0],
              x: [0, 20, -20, 15, -15, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </>
  );
}
