'use client';

import { motion } from 'framer-motion';
import { Users, Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PeopleSectionProps {
  adultCount: number;
  setAdultCount: (count: number) => void;
  childCount: number;
  setChildCount: (count: number) => void;
  babyCount: number;
  setBabyCount: (count: number) => void;
  onConfirm: () => void;
  maxCapacity?: number; // Seçilen saat diliminin kalan kapasitesi
}

const DEFAULT_MAX_CAPACITY = 12;

export default function PeopleSection({
  adultCount,
  setAdultCount,
  childCount,
  setChildCount,
  babyCount,
  setBabyCount,
  onConfirm,
  maxCapacity,
}: PeopleSectionProps) {
  const [isPrivateTour, setIsPrivateTour] = useState(false);
  const [adultPrice, setAdultPrice] = useState(0);
  const [childPrice, setChildPrice] = useState(0);
  
  // Özel tur kontrolü ve fiyat yükleme
  useEffect(() => {
    const tourTypeData = localStorage.getItem('selectedTourType');
    if (tourTypeData) {
      const tourType = JSON.parse(tourTypeData);
      const isPrivate = tourType.category === 'private';
      setIsPrivateTour(isPrivate);
      
      // Tur fiyatını al
      const basePrice = tourType.price || 0;
      setAdultPrice(basePrice);
      setChildPrice(Math.round(basePrice * 0.5)); // %50 indirim
      
      console.log('💰 Fiyatlar yüklendi:', {
        tourName: tourType.name,
        basePrice,
        adultPrice: basePrice,
        childPrice: Math.round(basePrice * 0.5)
      });
      
      // Özel tur ise otomatik 12 yetişkin yap
      if (isPrivate) {
        setAdultCount(12);
        setChildCount(0);
        setBabyCount(0);
      }
    }
  }, [setAdultCount, setChildCount, setBabyCount]);

  const totalPeople = adultCount + childCount + babyCount;
  // Kapalı turda fiyat sabit (kişi sayısıyla çarpılmaz), normal turda kişi başı hesaplanır
  const totalPrice = isPrivateTour ? adultPrice : (adultCount * adultPrice + childCount * childPrice);
  const MAX_CAPACITY = maxCapacity ?? DEFAULT_MAX_CAPACITY;

  const categories = [
    {
      emoji: '👨',
      title: 'Yetişkin',
      subtitle: '7+ yaş',
      price: adultPrice > 0 ? `₺${adultPrice}` : 'Yükleniyor...',
      priceLabel: 'Tam fiyat',
      count: adultCount,
      setCount: setAdultCount,
      minCount: 1,
    },
    {
      emoji: '👶',
      title: 'Çocuk',
      subtitle: '3-6 yaş',
      price: childPrice > 0 ? `₺${childPrice}` : 'Yükleniyor...',
      priceLabel: '%50 indirim',
      count: childCount,
      setCount: setChildCount,
      minCount: 0,
    },
    {
      emoji: '🍼',
      title: 'Bebek',
      subtitle: '0-3 yaş',
      price: 'Ücretsiz',
      priceLabel: '',
      count: babyCount,
      setCount: setBabyCount,
      minCount: 0,
    },
  ];

  const handleIncrement = (currentCount: number, setCount: (count: number) => void) => {
    if (totalPeople < MAX_CAPACITY) {
      setCount(currentCount + 1);
    }
  };

  const handleDecrement = (currentCount: number, setCount: (count: number) => void, minCount: number) => {
    if (currentCount > minCount) {
      setCount(currentCount - 1);
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-[#6B9BC3]/30 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-6 h-6 text-[#6B9BC3]" />
          <h2 className="text-2xl font-bold text-[#0D2847]">Kaç kişi katılacak?</h2>
        </div>

        {/* Özel Tur Bilgilendirme */}
        {isPrivateTour && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#6B9BC3]/10 border border-[#6B9BC3]/30 rounded-xl p-4 mb-6"
          >
            <p className="text-[#6B9BC3] text-sm text-center font-medium">
              ⭐ Özel Tur: Tüm tekne sizin! Otomatik olarak 12 kişilik kapasite seçilmiştir.
            </p>
          </motion.div>
        )}

        {/* Categories */}
        <div className="space-y-4 mb-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 120, damping: 15 }}
              className="bg-white backdrop-blur-xl rounded-2xl p-4 border border-[#6B9BC3]/30 flex items-center justify-between shadow-md"
            >
              {/* Left: Info */}
              <div className="flex items-center gap-4">
                <div className="text-4xl">{category.emoji}</div>
                <div>
                  <h3 className="text-[#0D2847] font-semibold text-lg">{category.title}</h3>
                  <p className="text-[#1B3A5C]/70 text-sm">{category.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#8B3A3A] font-bold">{category.price}</span>
                    {category.priceLabel && (
                      <span className="text-[#1B3A5C]/60 text-xs">• {category.priceLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Counter */}
              <div className="flex items-center gap-4">
                {/* Minus Button */}
                <motion.button
                  whileHover={!isPrivateTour ? { scale: 1.1 } : {}}
                  whileTap={!isPrivateTour ? { scale: 0.9 } : {}}
                  onClick={() => handleDecrement(category.count, category.setCount, category.minCount)}
                  disabled={isPrivateTour || category.count <= category.minCount}
                  className={`
                    w-10 h-10 rounded-full backdrop-blur-xl border-2 
                    flex items-center justify-center transition-all duration-300
                    ${isPrivateTour || category.count <= category.minCount
                      ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                      : 'bg-[#6B9BC3]/20 border-[#6B9BC3]/50 hover:bg-[#6B9BC3]/30 hover:border-[#6B9BC3]'
                    }
                  `}
                >
                  <Minus className="w-5 h-5 text-[#1B3A5C]" />
                </motion.button>

                {/* Count Display */}
                <motion.div
                  key={category.count}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-12 text-center"
                >
                  <span className="text-2xl font-bold text-[#0D2847]">{category.count}</span>
                </motion.div>

                {/* Plus Button */}
                <motion.button
                  whileHover={!isPrivateTour ? { scale: 1.1 } : {}}
                  whileTap={!isPrivateTour ? { scale: 0.9 } : {}}
                  onClick={() => handleIncrement(category.count, category.setCount)}
                  disabled={isPrivateTour || totalPeople >= MAX_CAPACITY}
                  className={`
                    w-10 h-10 rounded-full backdrop-blur-xl border-2 
                    flex items-center justify-center transition-all duration-300
                    ${isPrivateTour || totalPeople >= MAX_CAPACITY
                      ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                      : 'bg-[#6B9BC3]/20 border-[#6B9BC3]/50 hover:bg-[#6B9BC3]/30 hover:border-[#6B9BC3]'
                    }
                  `}
                >
                  <Plus className="w-5 h-5 text-[#1B3A5C]" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Capacity Warning */}
        {totalPeople >= MAX_CAPACITY && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6"
          >
            <p className="text-yellow-400 text-sm text-center">
              ⚠️ Maksimum kapasiteye ulaşıldı ({MAX_CAPACITY} kişi)
            </p>
          </motion.div>
        )}

        {/* Total Price */}
        <div className="bg-gradient-to-r from-[#6B9BC3]/10 to-[#5B8DB8]/10 border border-[#6B9BC3]/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1B3A5C]/70 text-sm">Toplam Kişi</p>
              <p className="text-[#0D2847] font-bold text-2xl">{totalPeople} Kişi</p>
            </div>
            <div className="text-right">
              <p className="text-[#1B3A5C]/70 text-sm">Toplam Tutar</p>
              <p className="text-[#8B3A3A] font-bold text-2xl">₺{totalPrice}</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={totalPeople === 0}
          className={`
            w-full font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300
            ${totalPeople > 0
              ? 'bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white shadow-[0_0_20px_rgba(139,58,58,0.4)] hover:shadow-[0_0_30px_rgba(139,58,58,0.6)]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {totalPeople > 0 ? 'Koltuk Seçimine Geç' : 'Lütfen kişi sayısı seçin'}
        </motion.button>
      </div>
    </section>
  );
}
