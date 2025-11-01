'use client';

import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FishingAnimation from './FishingAnimation';

interface ReservationButtonProps {
  size?: 'md' | 'lg';
  className?: string;
}

export default function ReservationButton({ 
  size = 'lg',
  className = '' 
}: ReservationButtonProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showFishing, setShowFishing] = useState(false);

  const handleClick = () => {
    // Olta animasyonunu başlat
    setShowFishing(true);
  };

  const handleFishingCatch = () => {
    // Balık yakalandı, yönlendir
    setShowFishing(false);
    router.push('/rezervasyon');
  };

  const sizeClasses = {
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <>
    {/* Olta Animasyonu */}
    {showFishing && <FishingAnimation onCatch={handleFishingCatch} />}
    
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden
        ${sizeClasses[size]}
        font-semibold rounded-full
        bg-gradient-to-r from-teal via-teal-light to-teal
        text-white
        shadow-xl shadow-teal/40
        hover:shadow-2xl hover:shadow-teal/60
        transition-all duration-300
        group
        ${className}
      `}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-teal-light via-teal to-teal-dark"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '0%' : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%', skewX: -20 }}
        animate={{ x: isHovered ? '200%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Ripple Effect on Click */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-white/30 rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <motion.span
          animate={{ 
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          <Calendar className="w-5 h-5" />
        </motion.span>
        
        <span>Rezervasyon Yap</span>
        
        <motion.span
          animate={{ 
            scale: isHovered ? [1, 1.2, 1, 1.2, 1] : 1,
            rotate: isHovered ? [0, 180, 360] : 0,
          }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.span>
      </span>

      {/* Glow Effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-teal via-teal-light to-teal rounded-full blur-lg opacity-0 group-hover:opacity-70 -z-10"
        animate={{ opacity: isHovered ? 0.7 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
    </>
  );
}
