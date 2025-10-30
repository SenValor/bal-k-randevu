'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export default function Card({
  icon: Icon,
  title,
  description,
  onClick,
  className = '',
}: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        bg-gradient-to-br from-white/80 to-white/70 rounded-2xl p-6 
        shadow-xl shadow-[#6B9BC3]/20 hover:shadow-2xl hover:shadow-[#6B9BC3]/30
        transition-all duration-300 cursor-pointer
        border-2 border-[#6B9BC3]/30 backdrop-blur-sm
        ${className}
      `}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] flex items-center justify-center shadow-lg shadow-[#6B9BC3]/40">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-[#0D2847] drop-shadow-sm">{title}</h3>
        <p className="text-[#1B3A5C]/80 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
