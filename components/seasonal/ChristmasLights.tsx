'use client';

import { motion } from 'framer-motion';

export default function ChristmasLights() {
  // Mobilde daha az ışık
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const lightCount = isMobile ? 10 : 20;
  
  const lights = Array.from({ length: lightCount }, (_, i) => ({
    id: i,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#00A9A5'][i % 5],
    delay: i * 0.1,
  }));

  return (
    <div className="fixed top-0 left-0 right-0 z-45 pointer-events-none">
      <div className="flex justify-between items-start px-2 md:px-4 py-2">
        {lights.map((light) => (
          <motion.div
            key={light.id}
            className="relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: light.delay }}
          >
            {/* Kablo */}
            <div className="w-0.5 h-4 md:h-8 bg-gray-700/50 mx-auto" />
            
            {/* Ampul */}
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: light.delay,
              }}
              className="relative"
            >
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full blur-lg md:blur-xl"
                style={{
                  background: light.color,
                  transform: 'scale(2)',
                }}
              />
              {/* Ampul */}
              <div
                className="relative w-4 h-5 md:w-6 md:h-8 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${light.color}, ${light.color}dd)`,
                  boxShadow: `0 0 20px ${light.color}, inset 0 2px 4px rgba(255,255,255,0.3)`,
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
