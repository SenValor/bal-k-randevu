'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FishingAnimationProps {
  onCatch?: () => void;
  targetPage?: string;
}

export default function FishingAnimation({ onCatch, targetPage = '/rezervasyon' }: FishingAnimationProps) {
  const [isCatching, setIsCatching] = useState(false);

  const getPageMessage = () => {
    switch (targetPage) {
      case '/hakkimizda':
        return { title: 'Yakalandı!', subtitle: 'Hakkımızda sayfasına yönlendiriliyorsunuz...' };
      case '/galeri':
        return { title: 'Yakalandı!', subtitle: 'Galeri sayfasına yönlendiriliyorsunuz...' };
      case '/rezervasyon':
      default:
        return { title: 'Yakalandı!', subtitle: 'Rezervasyon sayfasına yönlendiriliyorsunuz...' };
    }
  };

  const message = getPageMessage();

  useEffect(() => {
    // 2 saniye sonra yakalama animasyonunu başlat
    const timer = setTimeout(() => {
      setIsCatching(true);
      // 2 saniye sonra callback'i çağır
      setTimeout(() => {
        onCatch?.();
      }, 2000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onCatch]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black/50 backdrop-blur-sm">
      {/* Olta İpi */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ 
          height: isCatching ? '0%' : '60%',
        }}
        transition={{ 
          duration: 2,
          ease: [0.22, 1, 0.36, 1],
          repeat: isCatching ? 0 : Infinity,
          repeatDelay: 3
        }}
        className="absolute left-1/2 top-0 w-[2px] bg-gradient-to-b from-[#6B9BC3] to-transparent origin-top"
        style={{
          filter: 'drop-shadow(0 0 4px rgba(107, 155, 195, 0.5))'
        }}
      />

      {/* Olta İğnesi */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ 
          y: isCatching ? -50 : '60vh',
        }}
        transition={{ 
          duration: 2,
          ease: [0.22, 1, 0.36, 1],
          repeat: isCatching ? 0 : Infinity,
          repeatDelay: 3
        }}
        className="absolute left-1/2 -translate-x-1/2 top-0"
      >
        <motion.div
          animate={{ 
            rotate: isCatching ? 0 : [-5, 5, -5],
          }}
          transition={{ 
            duration: 0.5,
            repeat: isCatching ? 0 : Infinity,
          }}
          className="relative"
        >
          {/* İğne */}
          <div className="w-8 h-12 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full" 
                 style={{ clipPath: 'polygon(50% 0%, 40% 100%, 60% 100%)' }} 
            />
            {/* Parlama efekti */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full blur-sm" />
          </div>
          
          {/* Yem (Balık) */}
          <motion.div
            animate={{ 
              scale: isCatching ? [1, 1.2, 1] : 1,
              rotate: isCatching ? 0 : [-10, 10, -10],
            }}
            transition={{ 
              duration: 0.3,
              repeat: Infinity,
            }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2"
          >
            <div className="text-2xl">🐟</div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Su Dalgaları Efekti */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isCatching ? 0 : [0, 0.5, 0],
          scale: isCatching ? 0 : [0, 2, 3],
        }}
        transition={{ 
          duration: 2,
          ease: "easeOut",
          repeat: isCatching ? 0 : Infinity,
          repeatDelay: 3,
          delay: 1.8
        }}
        className="absolute left-1/2 -translate-x-1/2 w-32 h-32 border-2 border-[#6B9BC3]/30 rounded-full"
        style={{ top: '60vh' }}
      />

      {/* Baloncuklar */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, opacity: 0 }}
          animate={{ 
            y: isCatching ? 0 : [-100, -200],
            opacity: isCatching ? 0 : [0, 1, 0],
            x: Math.random() * 40 - 20,
          }}
          transition={{ 
            duration: 2,
            ease: "easeOut",
            repeat: isCatching ? 0 : Infinity,
            repeatDelay: 3,
            delay: 2 + i * 0.1
          }}
          className="absolute left-1/2 w-2 h-2 bg-[#6B9BC3]/30 rounded-full"
          style={{ top: '60vh' }}
        />
      ))}

      {/* Yakalama Mesajı */}
      {isCatching && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <div className="bg-gradient-to-br from-[#6B9BC3] via-[#7FADD1] to-[#5B8DB8] text-white px-8 py-6 rounded-2xl shadow-2xl shadow-[#6B9BC3]/50">
            <div className="text-4xl mb-3">🎣</div>
            <div className="text-2xl font-bold mb-2">{message.title}</div>
            <div className="text-sm opacity-90">{message.subtitle}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
