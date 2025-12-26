'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Confetti {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  rotation: number;
}

export default function ConfettiEffect() {
  const confetti = useRef<Confetti[]>([]);
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#C44569', '#00A9A5', '#6B9BC3', '#FFA07A'];
  const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

  useEffect(() => {
    // Mobilde daha az konfeti
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 30 : 60;
    
    confetti.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 12 + 6,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
    }));
  }, []);

  const getShapeStyle = (shape: string, size: number, color: string) => {
    const base = {
      width: size,
      height: size,
      background: color,
    };

    if (shape === 'circle') {
      return { ...base, borderRadius: '50%' };
    } else if (shape === 'triangle') {
      return {
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
        background: 'transparent',
      };
    }
    return base;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
      {confetti.current.map((conf) => (
        <motion.div
          key={conf.id}
          className="absolute"
          style={{
            left: `${conf.x}%`,
            ...getShapeStyle(conf.shape, conf.size, conf.color),
          }}
          initial={{ y: -50, rotate: conf.rotation, opacity: 1 }}
          animate={{
            y: '110vh',
            rotate: conf.rotation + 720,
            opacity: [1, 1, 0.8, 0],
            x: [0, 20, -20, 10, -10, 0],
          }}
          transition={{
            duration: conf.duration,
            repeat: Infinity,
            delay: conf.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
