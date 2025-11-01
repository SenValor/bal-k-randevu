'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Boat } from '@/lib/boatHelpers';
import { getReservationsByBoatDateSlot, getOccupiedSeats } from '@/lib/reservationHelpers';

interface DoubleSeatLayoutProps {
  selectedSeats: number[];
  onSeatToggle: (seatId: number) => void;
  maxSeats: number;
  selectedDate: Date | null;
  timeSlotId: string;
  isPrivateTour?: boolean;
}

export default function DoubleSeatLayout({
  selectedSeats,
  onSeatToggle,
  maxSeats,
  selectedDate,
  timeSlotId,
  isPrivateTour = false,
}: DoubleSeatLayoutProps) {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [boatCode, setBoatCode] = useState('T1');

  useEffect(() => {
    const fetchOccupiedSeats = async () => {
      if (!selectedDate) {
        setLoading(false);
        return;
      }

      const selectedBoatData = localStorage.getItem('selectedBoat');
      if (selectedBoatData) {
        try {
          const boat: Boat = JSON.parse(selectedBoatData);
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          setBoatCode(boat.code || 'T1');

          const reservations = await getReservationsByBoatDateSlot(
            boat.id,
            dateStr,
            timeSlotId
          );

          const occupied = getOccupiedSeats(reservations);
          setOccupiedSeats(occupied);
        } catch (error) {
          console.error('Dolu koltuklar alınamadı:', error);
        }
      }
      setLoading(false);
    };

    fetchOccupiedSeats();
  }, [selectedDate, timeSlotId]);

  const isOccupied = (seatId: number) => occupiedSeats.includes(seatId);
  const isSelected = (seatId: number) => selectedSeats.includes(seatId);
  const canSelect = (seatId: number) => {
    if (isPrivateTour) return false;
    if (isOccupied(seatId)) return false;
    if (isSelected(seatId)) return true;
    return selectedSeats.length < maxSeats;
  };

  const getSeatCode = (seatId: number) => {
    const pairNumber = Math.ceil(seatId / 2);
    const side = seatId % 2 === 1 ? 'IS' : 'SA';
    return `${boatCode}_${side}${pairNumber}`;
  };

  const getSeatColor = (seatId: number) => {
    if (isOccupied(seatId)) {
      return 'bg-red-500/20 border-2 border-red-500 cursor-not-allowed';
    }
    if (isSelected(seatId)) {
      return 'bg-[#6B9BC3]/30 border-2 border-[#6B9BC3] shadow-lg shadow-[#6B9BC3]/30';
    }
    if (!canSelect(seatId)) {
      return 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
    }
    return 'bg-white border-2 border-[#6B9BC3]/40 hover:border-[#6B9BC3] hover:bg-[#6B9BC3]/10 cursor-pointer';
  };

  // İkili düzen: 3 çift dikdörtgen, her biri 2 koltuk içeriyor
  const rectanglePairs = [
    [[1, 3], [2, 4]],     // Dikdörtgen 1: İskele (1,2) | Sancak (1,2)
    [[5, 7], [6, 8]],     // Dikdörtgen 2: İskele (3,4) | Sancak (3,4)
    [[9, 11], [10, 12]],  // Dikdörtgen 3: İskele (5,6) | Sancak (5,6)
  ];

  return (
    <div className="relative max-w-[280px] mx-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-4 border-[#6B9BC3] p-4 shadow-2xl">
        {/* Boat Header (Baş) */}
        <div className="text-center mb-4">
          <div className="inline-block bg-[#6B9BC3]/30 border-2 border-[#1B3A5C] rounded-full px-4 py-1.5">
            <span className="text-[#0D2847] font-bold text-sm">⬆ BAŞ</span>
          </div>
        </div>

        {/* Side Labels */}
        <div className="flex justify-between mb-3 px-4">
          <span className="text-white/50 text-xs font-medium">İSKELE</span>
          <span className="text-white/50 text-xs font-medium">SANCAK</span>
        </div>

        {/* 3 Dikdörtgen Çifti */}
        <div className="space-y-4">
          {rectanglePairs.map((rectanglePair, pairIndex) => {
            const [leftSeats, rightSeats] = rectanglePair;
            
            return (
              <motion.div
                key={pairIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pairIndex * 0.1, type: 'spring', stiffness: 120, damping: 15 }}
                className="grid grid-cols-2 gap-3"
              >
                {/* İskele Dikdörtgeni */}
                <div className="relative bg-white/80 border-3 border-[#6B9BC3]/50 rounded-2xl p-2 hover:border-[#6B9BC3] transition-all shadow-md">
                  <div className="relative">
                    {/* Orta Çizgi */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#6B9BC3]/50 -translate-y-1/2 z-10 rounded-full" />
                    
                    {leftSeats.map((seatId, index) => {
                      const displayNumber = Math.ceil(seatId / 2);
                      
                      return (
                        <motion.button
                          key={seatId}
                          whileHover={canSelect(seatId) ? { scale: 1.05 } : {}}
                          whileTap={canSelect(seatId) ? { scale: 0.95 } : {}}
                          onClick={() => canSelect(seatId) && onSeatToggle(seatId)}
                          disabled={!canSelect(seatId) && !isSelected(seatId)}
                          className={`
                            relative w-full h-12 rounded-xl border-2 transition-all duration-300
                            flex items-center justify-center font-bold
                            ${getSeatColor(seatId)}
                          `}
                        >
                          {isSelected(seatId) && (
                            <motion.div
                              className="absolute inset-0 bg-[#6B9BC3]/20 rounded-xl pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center">
                            <span className={`text-lg font-bold ${
                              isOccupied(seatId) ? 'text-red-400' : 
                              isSelected(seatId) ? 'text-[#00A9A5]' : 'text-[#0D2847]'
                            }`}>
                              {displayNumber}
                            </span>
                            <span className={`text-[8px] mt-0.5 ${
                              isOccupied(seatId) ? 'text-red-400/60' : 
                              isSelected(seatId) ? 'text-[#00A9A5]/60' : 'text-[#1B3A5C]/70'
                            }`}>
                              {getSeatCode(seatId)}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Sancak Dikdörtgeni */}
                <div className="relative bg-white/80 border-3 border-[#6B9BC3]/50 rounded-2xl p-2 hover:border-[#6B9BC3] transition-all shadow-md">
                  <div className="relative">
                    {/* Orta Çizgi */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#6B9BC3]/50 -translate-y-1/2 z-10 rounded-full" />
                    
                    {rightSeats.map((seatId, index) => {
                      const displayNumber = Math.ceil(seatId / 2);
                      
                      return (
                        <motion.button
                          key={seatId}
                          whileHover={canSelect(seatId) ? { scale: 1.05 } : {}}
                          whileTap={canSelect(seatId) ? { scale: 0.95 } : {}}
                          onClick={() => canSelect(seatId) && onSeatToggle(seatId)}
                          disabled={!canSelect(seatId) && !isSelected(seatId)}
                          className={`
                            relative w-full h-12 rounded-xl border-2 transition-all duration-300
                            flex items-center justify-center font-bold
                            ${getSeatColor(seatId)}
                          `}
                        >
                          {isSelected(seatId) && (
                            <motion.div
                              className="absolute inset-0 bg-[#6B9BC3]/20 rounded-xl pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center">
                            <span className={`text-lg font-bold ${
                              isOccupied(seatId) ? 'text-red-400' : 
                              isSelected(seatId) ? 'text-[#00A9A5]' : 'text-[#0D2847]'
                            }`}>
                              {displayNumber}
                            </span>
                            <span className={`text-[8px] mt-0.5 ${
                              isOccupied(seatId) ? 'text-red-400/60' : 
                              isSelected(seatId) ? 'text-[#00A9A5]/60' : 'text-[#1B3A5C]/70'
                            }`}>
                              {getSeatCode(seatId)}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Boat Footer (Kıç) */}
        <div className="text-center mt-4">
          <div className="inline-block bg-[#1B3A5C]/20 border-2 border-[#1B3A5C] rounded-full px-4 py-1.5">
            <span className="text-[#0D2847] font-bold text-sm">⬇ KIÇ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
