'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Boat, getTimeSlotsForDate } from '@/lib/boatHelpers';
// reservationHelpers — getOccupiedSeats artık doğrudan burada hesaplanıyor
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

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
    if (!selectedDate) {
      setLoading(false);
      return;
    }

    const selectedBoatData = localStorage.getItem('selectedBoat');
    if (!selectedBoatData) {
      setLoading(false);
      return;
    }

    let boat: Boat;
    try {
      boat = JSON.parse(selectedBoatData);
    } catch {
      setLoading(false);
      return;
    }

    // Yerel tarih formatı (UTC değil!)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setBoatCode(boat.code || 'T1');

    // Saat dilimi bilgilerini al
    const effectiveSlots = getTimeSlotsForDate(
      boat.scheduledTimeSlots,
      boat.timeSlots || [],
      dateStr
    );
    // timeSlotId index ("0","1") veya zaman aralığı ("13:30-18:30") olabilir
    const slotIndex = parseInt(timeSlotId);
    let currentSlot = !isNaN(slotIndex) && effectiveSlots[slotIndex]
      ? effectiveSlots[slotIndex]
      : null;

    // Index ile bulunamadıysa, start-end formatı ile dene
    if (!currentSlot && timeSlotId) {
      const timeMatch = timeSlotId.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (timeMatch) {
        currentSlot = effectiveSlots.find((s: any) =>
          s.start === timeMatch[1] && s.end === timeMatch[2]
        ) || null;
      }
    }

    const slotDisplayName = currentSlot?.displayName || '';
    const slotStart = currentSlot?.start || '';
    const slotEnd = currentSlot?.end || '';

    // timeSlotId'den de zaman aralığı çıkarmayı dene (fallback)
    let fallbackRange: string | null = null;
    if (!slotStart && !slotEnd && timeSlotId) {
      const fm = timeSlotId.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (fm) fallbackRange = `${fm[1]}-${fm[2]}`;
    }

    // Gerçek zamanlı dinleyici — aynı tekne + tarih + aktif rezervasyonlar
    const q = query(
      collection(db, 'reservations'),
      where('boatId', '==', boat.id),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const extractTourName = (s: string) => {
      if (!s) return '';
      const m = s.match(/^([^(]+)/);
      return m ? m[1].trim().toLowerCase() : s.toLowerCase().trim();
    };
    const extractTimeRange = (s: string) => {
      if (!s) return null;
      const m = s.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      return m ? `${m[1]}-${m[2]}` : null;
    };

    const targetTourName = extractTourName(slotDisplayName);
    const targetRange = slotStart && slotEnd ? `${slotStart}-${slotEnd}` : fallbackRange;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOccupied: number[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        if (!data.timeSlotDisplay) return;

        const resTourName = extractTourName(data.timeSlotDisplay);
        const resRange = extractTimeRange(data.timeSlotDisplay);

        // Eşleştirme: saat aralığı, timeSlotId veya tur adı
        const rangeMatches = targetRange && resRange && targetRange === resRange;
        const idMatches = data.timeSlotId === timeSlotId;
        const nameOnlyMatches = !resRange && targetTourName && resTourName && targetTourName === resTourName;
        const slotMatches = rangeMatches || idMatches || nameOnlyMatches;

        if (slotMatches && Array.isArray(data.selectedSeats)) {
          allOccupied.push(...data.selectedSeats);
        }
      });

      setOccupiedSeats([...new Set(allOccupied)]);
      setLoading(false);
    }, (error) => {
      console.error('Dolu koltuklar dinlenirken hata:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate, timeSlotId]);

  const isOccupied = (seatId: number) => occupiedSeats.includes(seatId);
  const isSelected = (seatId: number) => selectedSeats.includes(seatId);
  const canSelect = (seatId: number) => {
    if (isPrivateTour) return false;
    if (isOccupied(seatId)) return false;
    if (isSelected(seatId)) return true;
    return selectedSeats.length < maxSeats;
  };

  // SeatMap ile aynı sistem: 1-6 = İskele, 7-12 = Sancak
  const getSeatCode = (seatId: number) => {
    const side = seatId <= 6 ? 'IS' : 'SA';
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

  // İkili düzen: 3 çift dikdörtgen
  // Sol (İskele): 1,2 | 3,4 | 5,6  →  IS1–IS6
  // Sağ (Sancak): 7,8 | 9,10 | 11,12  →  SA1–SA6
  const rectanglePairs = [
    [[1, 2], [7, 8]],      // Sıra 1: İskele (1,2) | Sancak (7,8)
    [[3, 4], [9, 10]],     // Sıra 2: İskele (3,4) | Sancak (9,10)
    [[5, 6], [11, 12]],    // Sıra 3: İskele (5,6) | Sancak (11,12)
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
                    
                    {leftSeats.map((seatId) => (
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
                              {seatId}
                            </span>
                            <span className={`text-[8px] mt-0.5 ${
                              isOccupied(seatId) ? 'text-red-400/60' : 
                              isSelected(seatId) ? 'text-[#00A9A5]/60' : 'text-[#1B3A5C]/70'
                            }`}>
                              {getSeatCode(seatId)}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                  </div>
                </div>

                {/* Sancak Dikdörtgeni */}
                <div className="relative bg-white/80 border-3 border-[#6B9BC3]/50 rounded-2xl p-2 hover:border-[#6B9BC3] transition-all shadow-md">
                  <div className="relative">
                    {/* Orta Çizgi */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#6B9BC3]/50 -translate-y-1/2 z-10 rounded-full" />
                    
                    {rightSeats.map((seatId) => (
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
                              {seatId}
                            </span>
                            <span className={`text-[8px] mt-0.5 ${
                              isOccupied(seatId) ? 'text-red-400/60' : 
                              isSelected(seatId) ? 'text-[#00A9A5]/60' : 'text-[#1B3A5C]/70'
                            }`}>
                              {getSeatCode(seatId)}
                            </span>
                          </div>
                        </motion.button>
                      ))}
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
