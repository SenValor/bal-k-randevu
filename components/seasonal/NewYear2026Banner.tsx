'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Anchor, Ship } from 'lucide-react';

// Havai fişek parçacığı
interface Particle {
  id: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
  delay: number;
}

export default function NewYear2026Banner() {
  const [isVisible, setIsVisible] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isExploding, setIsExploding] = useState(false);

  const colors = ['#00A9A5', '#6B9BC3', '#FFD700', '#FF6B6B', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#1ABC9C'];

  const handleClick = () => {
    if (isExploding) return;
    
    setIsExploding(true);
    
    // Çok daha fazla havai fişek parçacığı - 3 dalga halinde
    const newParticles: Particle[] = [];
    for (let wave = 0; wave < 3; wave++) {
      for (let i = 0; i < 40; i++) {
        newParticles.push({
          id: wave * 40 + i,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 12 + 6,
          angle: (i / 40) * 360 + Math.random() * 20,
          distance: Math.random() * 200 + 100 + wave * 50,
          delay: wave * 0.15,
        });
      }
    }
    setParticles(newParticles);

    // Banner'ı kapat
    setTimeout(() => {
      setIsVisible(false);
    }, 1200);
  };

  return (
    <>
      {/* Havai Fişek Patlaması - Şatafatlı */}
      <AnimatePresence>
        {isExploding && (
          <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center">
            {/* Merkez flash efekti */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-32 h-32 bg-white rounded-full blur-xl"
            />
            
            {/* Parçacıklar */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 3}px ${particle.color}, 0 0 ${particle.size * 6}px ${particle.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
                  y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance + 50,
                  opacity: [1, 1, 0],
                  scale: [1, 1.5, 0],
                }}
                transition={{ 
                  duration: 1.2, 
                  ease: 'easeOut',
                  delay: particle.delay,
                }}
              />
            ))}

            {/* Yıldız patlamaları */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                initial={{ scale: 0, opacity: 1, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                  rotate: 180,
                  x: Math.cos((i / 8) * Math.PI * 2) * 150,
                  y: Math.sin((i / 8) * Math.PI * 2) * 150,
                }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                className="absolute"
              >
                <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Tam Ekran Kutlama Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
            onClick={handleClick}
          >
            {/* Arka plan overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-b from-[#003366]/90 via-[#0D2847]/95 to-[#003366]/90 backdrop-blur-md"
            />

            {/* Yıldızlı arka plan */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${(i * 7.3) % 100}%`,
                  top: `${(i * 11.7) % 100}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}

            {/* Ana Kutlama Kartı */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 360, y: -100 }}
              transition={{ 
                duration: 0.8, 
                type: 'spring', 
                bounce: 0.4,
              }}
              className="relative z-10 mx-4"
            >
              {/* Glow efekti */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00A9A5]/50 via-[#6B9BC3]/50 to-[#00A9A5]/50 blur-3xl opacity-70 rounded-3xl scale-125" />
              
              {/* Kart */}
              <div className="relative bg-gradient-to-br from-white via-white/98 to-[#E8F4F8] backdrop-blur-xl px-8 md:px-16 py-8 md:py-12 rounded-3xl shadow-2xl border-2 border-[#6B9BC3]/40">
                {/* Üst dekoratif çizgi */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-transparent via-[#00A9A5] to-transparent rounded-full" />
                
                {/* Logo/İkon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex justify-center mb-4"
                >
                  <div className="bg-gradient-to-br from-[#003366] to-[#00A9A5] p-4 rounded-2xl shadow-lg">
                    <Ship className="w-10 h-10 md:w-14 md:h-14 text-white" />
                  </div>
                </motion.div>

                {/* Ana Mesaj */}
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl font-bold text-[#003366]/80"
                  >
                    ⚓ Balık Sefası ⚓
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#003366] via-[#00A9A5] to-[#6B9BC3] bg-clip-text text-transparent leading-tight"
                    >
                      Yeni Yılınızı
                      <br />
                      Kutlar! 🎉
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-2 text-[#003366]/60"
                  >
                    <Sparkles className="w-4 h-4 text-[#00A9A5]" />
                    <span className="text-sm md:text-base font-medium">2026'da Görüşmek Üzere</span>
                    <Star className="w-4 h-4 text-[#6B9BC3]" />
                  </motion.div>
                </div>

                {/* Alt dekoratif çizgi */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-[#6B9BC3] to-transparent rounded-full" />
                
                {/* Tıkla butonu */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 flex justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-gradient-to-r from-[#00A9A5] to-[#6B9BC3] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
                  >
                    <span>Devam Et</span>
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Köşe yıldızları */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-4 -left-4"
              >
                <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-4 -right-4"
              >
                <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-4 -left-4"
              >
                <Sparkles className="w-6 h-6 text-[#00A9A5]" fill="currentColor" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-4 -right-4"
              >
                <Sparkles className="w-6 h-6 text-[#6B9BC3]" fill="currentColor" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sayfa Kenarları - Hafif Yılbaşı Animasyonları (Her zaman görünür) */}
      
      {/* Sol kenar - Yıldızlar */}
      <div className="fixed left-2 md:left-4 top-1/4 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: 360 }}
          transition={{ y: { duration: 3, repeat: Infinity }, rotate: { duration: 15, repeat: Infinity, ease: 'linear' } }}
        >
          <Star className="w-4 h-4 md:w-5 md:h-5 text-[#00A9A5] opacity-50" fill="currentColor" />
        </motion.div>
      </div>
      <div className="fixed left-3 md:left-6 top-1/2 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, 8, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-[#6B9BC3] opacity-40" fill="currentColor" />
        </motion.div>
      </div>
      <div className="fixed left-2 md:left-4 top-3/4 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: -360 }}
          transition={{ y: { duration: 3.5, repeat: Infinity }, rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        >
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 opacity-40" fill="currentColor" />
        </motion.div>
      </div>

      {/* Sağ kenar - Yıldızlar */}
      <div className="fixed right-2 md:right-4 top-1/4 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, 10, 0], rotate: -360 }}
          transition={{ y: { duration: 3.5, repeat: Infinity }, rotate: { duration: 15, repeat: Infinity, ease: 'linear' } }}
        >
          <Star className="w-4 h-4 md:w-5 md:h-5 text-[#6B9BC3] opacity-50" fill="currentColor" />
        </motion.div>
      </div>
      <div className="fixed right-3 md:right-6 top-1/2 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        >
          <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-[#00A9A5] opacity-40" fill="currentColor" />
        </motion.div>
      </div>
      <div className="fixed right-2 md:right-4 top-3/4 z-30 pointer-events-none">
        <motion.div
          animate={{ y: [0, 8, 0], rotate: 360 }}
          transition={{ y: { duration: 3, repeat: Infinity }, rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        >
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 opacity-40" fill="currentColor" />
        </motion.div>
      </div>

      {/* Hafif kar taneleri - Kenarlardan düşen */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`snow-${i}`}
          className="fixed w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-20"
          style={{
            left: i < 6 ? `${2 + i * 3}%` : `${85 + (i - 6) * 3}%`,
            opacity: 0.4,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, i % 2 === 0 ? 15 : -15, 0],
          }}
          transition={{
            y: { duration: 15 + i * 2, repeat: Infinity, ease: 'linear' },
            x: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            delay: i * 1.5,
          }}
        />
      ))}

      {/* Köşe ışık efektleri */}
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="fixed top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-[#00A9A5]/20 to-transparent rounded-full blur-3xl pointer-events-none z-10"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 2.5 }}
        className="fixed top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-bl from-[#6B9BC3]/20 to-transparent rounded-full blur-3xl pointer-events-none z-10"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        className="fixed bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tr from-[#6B9BC3]/15 to-transparent rounded-full blur-3xl pointer-events-none z-10"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 3 }}
        className="fixed bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tl from-[#00A9A5]/15 to-transparent rounded-full blur-3xl pointer-events-none z-10"
      />
    </>
  );
}
