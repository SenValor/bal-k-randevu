'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  particles: Particle[];
}

interface Particle {
  id: number;
  angle: number;
  velocity: number;
}

export default function FireworksEffect() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#C44569', '#00A9A5', '#6B9BC3'];

  useEffect(() => {
    const createFirework = () => {
      const particleCount = 30;
      const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        angle: (360 / particleCount) * i,
        velocity: Math.random() * 100 + 80,
      }));

      const newFirework: Firework = {
        id: Date.now() + Math.random(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        particles,
      };

      setFireworks(prev => [...prev, newFirework]);

      setTimeout(() => {
        setFireworks(prev => prev.filter(fw => fw.id !== newFirework.id));
      }, 2000);
    };

    const interval = setInterval(createFirework, 2000);
    createFirework();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {fireworks.map((firework) => (
          <div
            key={firework.id}
            className="absolute"
            style={{
              left: `${firework.x}%`,
              top: `${firework.y}%`,
            }}
          >
            {/* Merkez parlama */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: firework.color,
                boxShadow: `0 0 40px ${firework.color}`,
              }}
            />

            {/* Partiküller */}
            {firework.particles.map((particle) => {
              const radians = (particle.angle * Math.PI) / 180;
              const x = Math.cos(radians) * particle.velocity;
              const y = Math.sin(radians) * particle.velocity;

              return (
                <motion.div
                  key={particle.id}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x,
                    y,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: firework.color,
                    boxShadow: `0 0 10px ${firework.color}`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
