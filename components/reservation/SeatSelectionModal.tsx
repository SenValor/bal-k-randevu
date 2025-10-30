'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import SeatMap from './SeatMap';
import DoubleSeatLayout from './DoubleSeatLayout';
import { Boat } from '@/lib/boatHelpers';

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  peopleCount: number;
  selectedDate: Date | null;
  selectedTour: { id: number; time: string; title: string } | null;
  adultCount?: number;
  childCount?: number;
  babyCount?: number;
}

export default function SeatSelectionModal({
  isOpen,
  onClose,
  peopleCount,
  selectedDate,
  selectedTour,
  adultCount = 0,
  childCount = 0,
  babyCount = 0,
}: SeatSelectionModalProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isPrivateTour, setIsPrivateTour] = useState(false);
  const [seatLayout, setSeatLayout] = useState<'single' | 'double'>('single');
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Özel tur kontrolü ve seatLayout
  useEffect(() => {
    const tourTypeData = localStorage.getItem('selectedTourType');
    if (tourTypeData) {
      const tourType = JSON.parse(tourTypeData);
      const isPrivate = tourType.category === 'private';
      setIsPrivateTour(isPrivate);
      
      // Özel tur ise tüm koltukları otomatik seç (12 koltuk)
      if (isPrivate && isOpen) {
        setSelectedSeats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      }
    }

    // Tekne bilgisinden seatLayout'u al
    const selectedBoatData = localStorage.getItem('selectedBoat');
    if (selectedBoatData) {
      try {
        const boat: Boat = JSON.parse(selectedBoatData);
        setSeatLayout(boat.seatLayout || 'single');
      } catch (error) {
        console.error('Tekne verisi parse edilemedi:', error);
      }
    }
  }, [isOpen]);

  const handleSeatToggle = (seatId: number) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      if (selectedSeats.length < peopleCount) {
        const newSelectedSeats = [...selectedSeats, seatId];
        setSelectedSeats(newSelectedSeats);
        
        // Tüm koltuklar seçildiyse confirm butonuna scroll yap
        if (newSelectedSeats.length === peopleCount) {
          setTimeout(() => {
            confirmButtonRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end'
            });
          }, 300);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length === peopleCount) {
      // Tarihi YYYY-MM-DD formatına çevir (UTC değil!)
      let dateStr = '';
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      
      // Rezervasyon bilgilerini localStorage'a kaydet
      const reservationData = {
        date: dateStr,  // String olarak kaydet (UTC değil!)
        tour: selectedTour,
        seats: selectedSeats,
        adultCount,
        childCount,
        babyCount,
        totalPeople: peopleCount,
      };
      
      localStorage.setItem('reservationData', JSON.stringify(reservationData));
      
      console.log('💾 Rezervasyon verileri kaydedildi:', reservationData);
      
      // Ekipman seçimine geç
      window.location.href = '/rezervasyon/step-equipment';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[10000]"
          >
            <div className="bg-gradient-to-b from-[#E8F4F8] to-[#F5FAFB] md:rounded-3xl rounded-t-3xl border-t md:border border-[#6B9BC3]/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#6B9BC3] to-[#5B8DB8] p-6 flex items-center justify-between border-b border-white/20 z-10 md:rounded-t-3xl rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-white">Koltuk Seçimi</h2>
                  <p className="text-white/90 text-sm mt-1">
                    {formatDate(selectedDate)} • {selectedTour?.title}
                  </p>
                  <p className="text-white/80 text-xs mt-1">
                    {selectedTour?.time}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                {/* Özel Tur Bilgilendirme */}
                {isPrivateTour && (
                  <div className="bg-[#6B9BC3]/10 border border-[#6B9BC3]/30 rounded-2xl p-4 mb-6">
                    <p className="text-[#6B9BC3] text-sm text-center font-medium">
                      ⭐ Özel Tur: Tüm koltuklar otomatik olarak seçilmiştir. Değiştirilemez.
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#6B9BC3]/30 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[#1B3A5C]/70">Seçilecek Koltuk:</span>
                    <span className="text-2xl font-bold text-[#8B3A3A]">
                      {selectedSeats.length} / {peopleCount}
                    </span>
                  </div>
                </div>

                {/* Seat Map */}
                <div className="p-6">
                  {seatLayout === 'double' ? (
                    <DoubleSeatLayout
                      selectedSeats={selectedSeats}
                      onSeatToggle={handleSeatToggle}
                      maxSeats={peopleCount}
                      selectedDate={selectedDate}
                      timeSlotId={selectedTour?.id.toString() || '0'}
                      isPrivateTour={isPrivateTour}
                    />
                  ) : (
                    <SeatMap
                      selectedSeats={selectedSeats}
                      onSeatToggle={handleSeatToggle}
                      maxSeats={peopleCount}
                      selectedDate={selectedDate}
                      timeSlotId={selectedTour?.id.toString() || '0'}
                      isPrivateTour={isPrivateTour}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-[#6B9BC3]/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-300" />
                    <span className="text-[#1B3A5C]/70 text-sm">Boş</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#6B9BC3]/30 border-2 border-[#6B9BC3]" />
                    <span className="text-[#1B3A5C]/70 text-sm">Seçili</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border-2 border-red-500/50" />
                    <span className="text-[#1B3A5C]/70 text-sm">Dolu</span>
                  </div>
                </div>

                {/* Confirm Button */}
                <motion.button
                  ref={confirmButtonRef}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={selectedSeats.length !== peopleCount}
                  className={`
                    w-full mt-6 font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300
                    ${selectedSeats.length === peopleCount
                      ? 'bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white shadow-lg shadow-[#8B3A3A]/30 hover:shadow-xl hover:shadow-[#8B3A3A]/40'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {selectedSeats.length === peopleCount
                    ? 'Rezervasyonu Tamamla'
                    : `${peopleCount - selectedSeats.length} Koltuk Daha Seçin`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
