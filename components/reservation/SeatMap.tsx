'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Boat } from '@/lib/boatHelpers';
import { getReservationsByBoatDateSlot, getOccupiedSeats } from '@/lib/reservationHelpers';

interface SeatMapProps {
  selectedSeats: number[];
  onSeatToggle: (seatId: number) => void;
  maxSeats: number;
  selectedDate: Date | null;
  timeSlotId: string;
  isPrivateTour?: boolean;
}

const TOTAL_SEATS = 12;

export default function SeatMap({ selectedSeats, onSeatToggle, maxSeats, selectedDate, timeSlotId, isPrivateTour = false }: SeatMapProps) {
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
          // Yerel tarih formatı (UTC değil!)
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          // Tekne kodunu set et
          setBoatCode(boat.code || 'T1');
          
          // Bu tekne, tarih ve saat için rezervasyonları al
          const reservations = await getReservationsByBoatDateSlot(
            boat.id,
            dateStr,
            timeSlotId
          );
          
          // Dolu koltukları hesapla
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
    // Özel tur ise hiçbir koltuk seçilemez
    if (isPrivateTour) return false;
    if (isOccupied(seatId)) return false;
    if (isSelected(seatId)) return true;
    return selectedSeats.length < maxSeats;
  };

  // Koltuk kodunu oluştur (T1_IS3 = Tekne 1, İskele 3)
  const getSeatCode = (seatId: number) => {
    const side = seatId <= 6 ? 'IS' : 'SA'; // İskele veya Sancak
    const position = seatId <= 6 ? seatId : seatId - 6;
    return `${boatCode}_${side}${position}`;
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

  // İskele (Sol) ve Sancak (Sağ) koltukları
  const leftSeats = [1, 2, 3, 4, 5, 6];
  const rightSeats = [7, 8, 9, 10, 11, 12];

  return (
    <div className="relative max-w-[200px] mx-auto">
      {/* Boat Outline */}
      <div className="bg-white/90 backdrop-blur-xl rounded-xl border-4 border-[#6B9BC3] p-1 md:p-4 shadow-xl">
        {/* Boat Header (Baş) */}
        <div className="text-center mb-1.5">
          <div className="inline-block bg-[#6B9BC3]/30 border-2 border-[#1B3A5C] rounded-full px-1.5 py-0.5">
            <span className="text-[#0D2847] font-bold text-[8px]">⬆ BAŞ</span>
          </div>
        </div>

        {/* Seats Layout */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-3">
          {/* Left Side (İskele) */}
          <div className="space-y-1 md:space-y-2">
            <div className="text-center text-white/50 text-[7px] font-medium mb-0">İSKELE</div>
            {leftSeats.map((seatId, index) => (
              <motion.button
                key={seatId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 15 }}
                whileHover={canSelect(seatId) ? { scale: 1.1 } : {}}
                whileTap={canSelect(seatId) ? { scale: 0.95 } : {}}
                onClick={() => canSelect(seatId) && onSeatToggle(seatId)}
                disabled={!canSelect(seatId) && !isSelected(seatId)}
                className={`
                  relative w-full aspect-square rounded-md border transition-all duration-300
                  flex items-center justify-center font-bold text-base md:text-lg
                  ${getSeatColor(seatId)}
                `}
              >
                {/* Glow Effect for Selected */}
                {isSelected(seatId) && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-[#6B9BC3]/20 pointer-events-none"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <span className={`text-xs md:text-lg font-bold ${
                    isOccupied(seatId) ? 'text-red-400' : 
                    isSelected(seatId) ? 'text-[#00A9A5]' : 
                    'text-[#0D2847]'
                  }`}>
                    {seatId}
                  </span>
                  <span className={`text-[7px] md:text-[10px] ${
                    isOccupied(seatId) ? 'text-red-400/60' : 
                    isSelected(seatId) ? 'text-[#00A9A5]/60' : 
                    'text-[#1B3A5C]/70'
                  }`}>
                    {getSeatCode(seatId)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Middle (Walkway) */}
          <div className="flex items-center justify-center">
            <div className="h-full w-1 bg-gradient-to-b from-transparent via-[#6B9BC3]/50 to-transparent rounded-full" />
          </div>

          {/* Right Side (Sancak) */}
          <div className="space-y-1 md:space-y-2">
            <div className="text-center text-white/50 text-[7px] font-medium mb-0">SANCAK</div>
            {rightSeats.map((seatId, index) => (
              <motion.button
                key={seatId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 15 }}
                whileHover={canSelect(seatId) ? { scale: 1.1 } : {}}
                whileTap={canSelect(seatId) ? { scale: 0.95 } : {}}
                onClick={() => canSelect(seatId) && onSeatToggle(seatId)}
                disabled={!canSelect(seatId) && !isSelected(seatId)}
                className={`
                  relative w-full aspect-square rounded-md border transition-all duration-300
                  flex items-center justify-center font-bold text-base md:text-lg
                  ${getSeatColor(seatId)}
                `}
              >
                {/* Glow Effect for Selected */}
                {isSelected(seatId) && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-[#6B9BC3]/20 pointer-events-none"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <span className={`text-xs md:text-lg font-bold ${
                    isOccupied(seatId) ? 'text-red-400' : 
                    isSelected(seatId) ? 'text-[#00A9A5]' : 
                    'text-[#0D2847]'
                  }`}>
                    {seatId}
                  </span>
                  <span className={`text-[7px] md:text-[10px] ${
                    isOccupied(seatId) ? 'text-red-400/60' : 
                    isSelected(seatId) ? 'text-[#00A9A5]/60' : 
                    'text-[#1B3A5C]/70'
                  }`}>
                    {getSeatCode(seatId)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Boat Footer (Kıç) */}
        <div className="text-center mt-1.5">
          <div className="inline-block bg-[#1B3A5C]/20 border-2 border-[#1B3A5C] rounded-full px-1.5 py-0.5">
            <span className="text-[#0D2847] font-bold text-[8px]">⬇ KIÇ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
