'use client';

import { motion } from 'framer-motion';

interface PriceItem {
  label: string;
  price: number;
}

interface PriceSummaryBoxProps {
  breakdown: PriceItem[];
  totalPrice: number;
}

export default function PriceSummaryBox({ breakdown, totalPrice }: PriceSummaryBoxProps) {
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
      <h2 className="text-xl font-semibold text-[#0D2847] mb-4">Fiyat Özeti</h2>

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
          <p className="text-[#1B3A5C]/50 text-sm">Henüz seçim yapılmadı</p>
        )}
      </div>

      {/* Divider */}
      {breakdown.length > 0 && (
        <div className="border-t border-[#6B9BC3]/20 my-4" />
      )}

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-[#0D2847]">Toplam Tutar</span>
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

      {/* Info */}
      {breakdown.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-[#1B3A5C]/60 mt-4 text-center"
        >
          💡 Fiyatlar KDV dahildir
        </motion.p>
      )}
    </div>
  );
}
