'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Compass, ArrowRight } from 'lucide-react';
import TourTypeCard from './TourTypeCard';
import { Tour, subscribeToTours } from '@/lib/tourHelpers';
import ReservationNewYearDecor from '@/components/seasonal/ReservationNewYearDecor';

export default function StepThreeTourType() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTourType, setSelectedTourType] = useState<string | null>(null);
  const continueButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Firestore'dan aktif turları dinle
    const unsubscribe = subscribeToTours((updatedTours) => {
      // Sadece aktif turları göster
      const activeTours = updatedTours.filter(tour => tour.isActive);
      setTours(activeTours);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleContinue = () => {
    if (selectedTourType) {
      // Seçili turu localStorage'a kaydet
      const selectedTourData = tours.find(t => t.id === selectedTourType);
      if (selectedTourData) {
        localStorage.setItem('selectedTourType', JSON.stringify(selectedTourData));
      }
      
      // Tarih/saat seçimine geç
      window.location.href = '/rezervasyon/step-three';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
      {/* Yılbaşı Teması */}
      <ReservationNewYearDecor />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0D2847] mb-4">
            Hangi türde bir <span className="text-[#6B9BC3]">tur</span> istiyorsunuz?
          </h1>
          <p className="text-lg md:text-xl text-[#1B3A5C]/70 max-w-2xl mx-auto">
            Fiyat seçeneklerimizi inceleyin ve size uygun olanı seçin
          </p>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#6B9BC3] animate-spin" />
          </div>
        ) : tours.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Compass className="w-16 h-16 text-[#1B3A5C]/40 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#0D2847] mb-2">Henüz Tur Eklenmedi</h3>
            <p className="text-[#1B3A5C]/60">Admin panelden tur ekleyebilirsiniz.</p>
          </div>
        ) : (
          /* Tour Type Cards Grid */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8"
          >
            {tours.map((tour: Tour) => {
              // Firestore'dan gelen veriyi TourTypeCard formatına çevir
              const formattedTour = {
                id: tour.id,
                emoji: tour.category === 'private' ? '⭐' : 
                       tour.category === 'normal-with-equipment' ? '🐟' : 
                       tour.category === 'normal-without-equipment' ? '🎣' : '🐟',
                title: tour.name,
                description: tour.includes,
                price: tour.price.toString(),
                unit: tour.category === 'private' ? 'grup fiyatı' : 'kişi başı',
                details: tour.description,
              };

              return (
                <TourTypeCard
                  key={tour.id}
                  tour={formattedTour}
                  isSelected={selectedTourType === tour.id}
                  onSelect={() => {
                    setSelectedTourType(tour.id);
                    // Tur seçildiğinde devam et butonuna scroll yap
                    setTimeout(() => {
                      continueButtonRef.current?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                    }, 300);
                  }}
                />
              );
            })}
          </motion.div>
        )}

        {/* Continue Button */}
        <AnimatePresence>
          {selectedTourType && (
            <motion.div
              ref={continueButtonRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="flex justify-center mt-12"
            >
              <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#8B3A3A] via-[#A04848] to-[#8B3A3A] rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
                
                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative bg-gradient-to-r from-[#8B3A3A] via-[#A04848] to-[#8B3A3A] text-white font-black text-xl py-6 px-20 rounded-full shadow-2xl shadow-[#8B3A3A]/60 transition-all duration-500 overflow-hidden border-2 border-white/20"
                >
                  {/* Shine Effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Animated Background */}
                  <span className="absolute inset-0 bg-gradient-to-r from-[#A04848] via-[#8B3A3A] to-[#A04848] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Button Content */}
                  <span className="relative flex items-center gap-4 drop-shadow-lg">
                    <span className="text-2xl tracking-wide">DEVAM ET</span>
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform duration-300 drop-shadow-md" />
                  </span>

                  {/* Inner Glow */}
                  <span className="absolute inset-0 rounded-full opacity-50 group-hover:opacity-100 blur-md bg-white/10 transition-opacity duration-500" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
