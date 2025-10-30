'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface TourType {
  id: number | string;
  emoji: string;
  title: string;
  description: string[];
  price: string;
  unit: string;
  details: string;
}

interface TourTypeCardProps {
  tour: TourType;
  isSelected: boolean;
  onSelect: () => void;
}

export default function TourTypeCard({ tour, isSelected, onSelect }: TourTypeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
      className="relative"
    >
      <motion.div
        whileHover={{ scale: 1.03, y: -8 }}
        whileTap={{ scale: 0.97 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onSelect}
        className={`
          relative p-3 rounded-xl border-2 backdrop-blur-2xl cursor-pointer
          transition-all duration-300 overflow-hidden
          ${
            isSelected
              ? 'bg-[#6B9BC3]/10 border-[#6B9BC3] shadow-[0_0_30px_rgba(107,155,195,0.5)]'
              : 'bg-white/90 border-[#6B9BC3]/20 hover:border-[#6B9BC3]/50 hover:shadow-[0_0_25px_rgba(107,155,195,0.3)]'
          }
        `}
      >
        {/* Background Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#6B9BC3]/20 via-transparent to-transparent opacity-0"
          animate={{
            opacity: isSelected ? [0.3, 0.5, 0.3] : isHovered ? 0.2 : 0,
          }}
          transition={{
            duration: 2,
            repeat: isSelected ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />

        {/* Selected Badge */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="absolute top-4 right-4 w-8 h-8 bg-[#6B9BC3] rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10">
          {/* Emoji */}
          <motion.div
            animate={{
              scale: isSelected ? [1, 1.2, 1] : 1,
              rotate: isSelected ? [0, 10, -10, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
            className="text-4xl mb-2"
          >
            {tour.emoji}
          </motion.div>

          {/* Title */}
          <h3 className="text-base font-bold text-[#0D2847] mb-2 leading-tight">
            {tour.title}
          </h3>

          {/* Description List */}
          <ul className="space-y-1 mb-3">
            {tour.description.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-[#1B3A5C]/70 text-xs"
              >
                <span className="text-[#6B9BC3] mt-0.5">•</span>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>

          {/* Price */}
          <div className="pt-2 border-t border-[#6B9BC3]/20">
            <div className="flex items-end justify-between">
              <div>
                <motion.div
                  animate={{
                    scale: isSelected ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-xl font-bold text-[#8B3A3A]">₺{tour.price}</span>
                  {/* Shimmer Effect on Price */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '50%' }}
                    />
                  )}
                </motion.div>
                <p className="text-[#1B3A5C]/50 text-[10px] mt-0.5">{tour.unit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Glow Border */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? '0 0 40px rgba(107, 155, 195, 0.4), inset 0 0 40px rgba(107, 155, 195, 0.1)'
              : '0 0 0px rgba(107, 155, 195, 0)',
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Details Expansion */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="overflow-hidden"
          >
            <div className="bg-[#6B9BC3]/10 backdrop-blur-xl border border-[#6B9BC3]/30 rounded-2xl p-4">
              <p className="text-[#1B3A5C]/80 text-sm leading-relaxed">
                💡 {tour.details}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
