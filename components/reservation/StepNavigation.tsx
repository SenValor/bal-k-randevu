'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepNavigationProps {
  onBack: () => void;
  onContinue: () => void;
}

export default function StepNavigation({ onBack, onContinue }: StepNavigationProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#6B9BC3]/10 backdrop-blur-xl text-[#1B3A5C] border-2 border-[#6B9BC3]/30 hover:bg-[#6B9BC3]/20 hover:border-[#6B9BC3] transition-all duration-300 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Geri</span>
      </motion.button>

      {/* Continue Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white font-bold shadow-lg shadow-[#8B3A3A]/30 hover:shadow-xl hover:shadow-[#8B3A3A]/40 transition-all duration-300"
      >
        <span>Devam Et</span>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
