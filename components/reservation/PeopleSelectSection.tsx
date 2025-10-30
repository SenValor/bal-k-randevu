'use client';

import { motion } from 'framer-motion';
import { Users, Minus, Plus } from 'lucide-react';

interface PeopleSelectSectionProps {
  peopleCount: number;
  setPeopleCount: (count: number) => void;
  onConfirm: () => void;
}

const MAX_CAPACITY = 12;

export default function PeopleSelectSection({
  peopleCount,
  setPeopleCount,
  onConfirm,
}: PeopleSelectSectionProps) {
  const increment = () => {
    if (peopleCount < MAX_CAPACITY) {
      setPeopleCount(peopleCount + 1);
    }
  };

  const decrement = () => {
    if (peopleCount > 1) {
      setPeopleCount(peopleCount - 1);
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-6 h-6 text-[#00A9A5]" />
          <h2 className="text-2xl font-bold text-white">Kaç kişi katılacak?</h2>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Minus Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={decrement}
            disabled={peopleCount <= 1}
            className={`
              w-16 h-16 rounded-full backdrop-blur-xl border-2 
              flex items-center justify-center transition-all duration-300
              ${peopleCount <= 1
                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                : 'bg-white/10 border-white/20 hover:border-[#00A9A5] hover:bg-[#00A9A5]/20'
              }
            `}
          >
            <Minus className="w-6 h-6 text-white" />
          </motion.button>

          {/* Count Display */}
          <motion.div
            key={peopleCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#00A9A5]/20 to-[#00A9A5]/5 border-2 border-[#00A9A5]/50 backdrop-blur-xl flex items-center justify-center shadow-lg shadow-[#00A9A5]/20">
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-1">{peopleCount}</div>
                <div className="text-sm text-white/60">Kişi</div>
              </div>
            </div>

            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-[#00A9A5]/20 -z-10 blur-xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Plus Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={increment}
            disabled={peopleCount >= MAX_CAPACITY}
            className={`
              w-16 h-16 rounded-full backdrop-blur-xl border-2 
              flex items-center justify-center transition-all duration-300
              ${peopleCount >= MAX_CAPACITY
                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                : 'bg-white/10 border-white/20 hover:border-[#00A9A5] hover:bg-[#00A9A5]/20'
              }
            `}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        </div>

        {/* Capacity Info */}
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm">
            Maksimum kapasite: <span className="text-[#00A9A5] font-semibold">{MAX_CAPACITY} kişi</span>
          </p>
        </div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="w-full bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-[#00A9A5]/30 hover:shadow-xl hover:shadow-[#00A9A5]/40 transition-all duration-300"
        >
          Koltuk Seçimine Geç
        </motion.button>
      </div>
    </section>
  );
}
