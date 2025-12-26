'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  blur: number;
}

export default function AdvancedSnowEffect() {
  const snowflakes = useRef<Snowflake[]>([]);
  const colors = ['#FFFFFF', '#E0F7FF', '#B8E6FF', '#6B9BC3', '#00A9A5'];

  useEffect(() => {
    // Mobilde daha az kar tanesi
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 40 : 80;
    
    snowflakes.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      blur: Math.random() * 2 + 0.5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.current.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.x}%`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            background: `radial-gradient(circle, ${flake.color} 0%, transparent 70%)`,
            filter: `blur(${flake.blur}px)`,
            boxShadow: `0 0 ${flake.size * 2}px ${flake.color}`,
          }}
          initial={{ y: flake.y, x: 0, rotate: 0, scale: 0 }}
          animate={{
            y: '110vh',
            x: [0, 30, -30, 20, -20, 0],
            rotate: [0, 360, 720],
            scale: [0, 1, 1, 0.8, 1],
          }}
          transition={{
            y: {
              duration: flake.duration,
              repeat: Infinity,
              delay: flake.delay,
              ease: 'linear',
            },
            x: {
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: flake.duration,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />
      ))}
    </div>
  );
}
