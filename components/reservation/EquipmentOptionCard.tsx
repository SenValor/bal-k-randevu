'use client';

import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface EquipmentOptionCardProps {
  title: string;
  price: number;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isActive: boolean;
}

export default function EquipmentOptionCard({
  title,
  price,
  count,
  onIncrement,
  onDecrement,
  isActive,
}: EquipmentOptionCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        bg-white/90 backdrop-blur-2xl border-2 rounded-2xl p-5 shadow-md
        transition-all duration-300 cursor-pointer
        ${
          isActive
            ? 'border-[#6B9BC3] bg-[#6B9BC3]/10 shadow-[0_0_20px_rgba(107,155,195,0.4)]'
            : 'border-[#6B9BC3]/30 hover:border-[#6B9BC3]'
        }
      `}
    >
      {/* Glow Effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-[#6B9BC3]/10 pointer-events-none"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="relative z-10">
        {/* Title */}
        <h3 className="text-lg font-semibold text-[#0D2847] mb-1">{title}</h3>

        {/* Price */}
        <p className="text-sm text-[#1B3A5C]/70 mb-4">
          {formatPrice(price)} / kişi
        </p>

        {/* Counter */}
        <div className="flex items-center justify-between mt-4">
          {/* Minus Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDecrement}
            disabled={count === 0}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${
                count === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#6B9BC3]/10 text-[#1B3A5C] hover:bg-[#6B9BC3]/30 hover:text-[#6B9BC3]'
              }
            `}
          >
            <Minus className="w-5 h-5" />
          </motion.button>

          {/* Count Display */}
          <motion.span
            key={count}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-2xl font-bold text-[#0D2847]"
          >
            {count}
          </motion.span>

          {/* Plus Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onIncrement}
            className="w-10 h-10 rounded-full bg-[#6B9BC3]/10 text-[#1B3A5C] hover:bg-[#6B9BC3]/30 hover:text-[#6B9BC3] flex items-center justify-center transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
