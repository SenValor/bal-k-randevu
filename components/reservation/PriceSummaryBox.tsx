'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface PriceItem {
  label: string;
  price: number;
}

interface PriceSummaryBoxProps {
  breakdown: PriceItem[];
  totalPrice: number;
}

export default function PriceSummaryBox({ breakdown, totalPrice }: PriceSummaryBoxProps) {
  const { t } = useLanguage();
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white/90 backdrop-blur-2xl border-2 border-[#6B9BC3]/30 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-[#0D2847] mb-4">{t('price.summary')}</h2>

      {/* Breakdown */}
      <div className="space-y-3 mb-4">
        {breakdown.length > 0 ? (
          breakdown.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between text-[#1B3A5C]/80"
            >
              <span className="text-sm">{item.label}</span>
              <span className="font-medium">{formatPrice(item.price)}</span>
            </motion.div>
          ))
        ) : (
          <p className="text-[#1B3A5C]/50 text-sm">{t('price.noSelection')}</p>
        )}
      </div>

      {/* Divider */}
      {breakdown.length > 0 && (
        <div className="border-t border-[#6B9BC3]/20 my-4" />
      )}

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-[#0D2847]">{t('price.total')}</span>
        <motion.span
          key={totalPrice}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold text-[#8B3A3A]"
        >
          {formatPrice(totalPrice)}
        </motion.span>
      </div>

    </div>
  );
}
