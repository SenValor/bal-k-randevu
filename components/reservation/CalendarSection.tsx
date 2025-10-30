'use client';

import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Boat } from '@/lib/boatHelpers';
import { getCalendarFullness } from '@/lib/reservationHelpers';

interface CalendarSectionProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function CalendarSection({ selectedDate, onDateSelect }: CalendarSectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [boatStartDate, setBoatStartDate] = useState<string>('');
  const [boatEndDate, setBoatEndDate] = useState<string>('');

  // Yerel tarih formatı (UTC değil!) - EN BAŞTA TANIMLA
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  // Ay değiştiğinde doluluk verilerini çek
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      const selectedBoatData = localStorage.getItem('selectedBoat');
      
      if (selectedBoatData) {
        try {
          const boat: Boat = JSON.parse(selectedBoatData);
          
          // Tekne tarih aralığını kaydet
          setBoatStartDate(boat.startDate);
          setBoatEndDate(boat.endDate);
          
          // Ay başı ve sonu
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0);
          
          const startDateStr = formatLocalDate(startDate);
          const endDateStr = formatLocalDate(endDate);
          
          // Takvim doluluk verilerini al
          const fullnessMap = await getCalendarFullness(
            boat.id,
            startDateStr,
            endDateStr,
            boat.capacity,
            boat.timeSlots?.length || 1
          );
          
          console.log('📅 Takvim Doluluk Map:', {
            boatId: boat.id,
            startDate: startDateStr,
            endDate: endDateStr,
            capacity: boat.capacity,
            timeSlots: boat.timeSlots?.length || 1,
            fullnessMapSize: fullnessMap.size,
            fullnessData: Array.from(fullnessMap.entries())
          });
          
          // Doluluk oranını direkt kullan (artık müsaitlik değil, doluluk)
          const fullnessMapForState = new Map<string, number>();
          
          // Tüm günler için entry oluştur (boş günler için 0)
          const daysInMonth = endDate.getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const fullness = fullnessMap.get(dateKey) || 0; // Boş günler için 0
            fullnessMapForState.set(dateKey, fullness);
          }
          
          // Sadece dolu günleri logla
          fullnessMap.forEach((fullness, date) => {
            console.log(`📊 ${date}: Doluluk ${(fullness * 100).toFixed(0)}% → ${fullness >= 1 ? 'KIRMIZI' : fullness >= 0.5 ? 'SARI' : 'YEŞİL'}`);
          });
          
          setAvailabilityMap(fullnessMapForState);
          console.log('✅ Fullness Map güncellendi:', fullnessMapForState.size, 'gün (tüm ay)');
        } catch (error) {
          console.error('Takvim doluluk verisi alınamadı:', error);
        }
      }
      setLoading(false);
    };

    fetchAvailability();
  }, [currentMonth]);

  const getAvailabilityColor = (fullness: number) => {
    // fullness değerleri:
    // 0 = Tüm saatler boş
    // 0.5 = En az 1 saat dolu ama hepsi dolu değil
    // 1 = Tüm saatler tamamen dolu
    if (fullness >= 1) return 'bg-red-500/20 border-red-500/50 text-red-400'; // Tüm saatler dolu → KIRMIZI
    if (fullness >= 0.5) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'; // Kısmen dolu → SARI
    return 'bg-green-500/20 border-green-500/50 text-green-400'; // Tüm saatler boş → YEŞİL
  };

  const getAvailabilityText = (fullness: number) => {
    if (fullness >= 1) return 'Tüm Saatler Dolu';
    if (fullness >= 0.5) return 'Rezervasyon Var';
    return 'Müsait';
  };

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isDateInBoatRange = (day: number) => {
    if (!boatStartDate || !boatEndDate) return true; // Tarih yoksa tüm günler açık
    
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const startDate = new Date(boatStartDate);
    const endDate = new Date(boatEndDate);
    
    // Saatleri sıfırla
    checkDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return checkDate >= startDate && checkDate <= endDate;
  };

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(day);
    const fullness = availabilityMap.get(dateKey) ?? 0;
    
    console.log('🖱️ Takvimde tıklanan gün:', {
      day,
      dateKey,
      fullness,
      currentMonth: formatLocalDate(currentMonth)
    });
    
    // Tekne tarih aralığı kontrolü
    if (!isDateInBoatRange(day)) {
      alert('Bu tarih tekne için kapalıdır. Lütfen başka bir tarih seçin.');
      return;
    }
    
    // Geçmiş tarih kontrolü
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return; // Geçmiş tarih seçilemez
    }
    
    console.log('✅ Tarih seçildi:', {
      selectedDate: formatLocalDate(selectedDate),
      localDate: selectedDate.toLocaleDateString('tr-TR')
    });
    
    // Tam dolu değilse seçilebilir (fullness < 1)
    if (fullness < 1) {
      onDateSelect(selectedDate);
    }
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#6B9BC3]/30 p-4 md:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#6B9BC3]" />
            <h2 className="text-xl font-bold text-[#0D2847]">Tarih Seçin</h2>
          </div>
          
          {/* Ay/Yıl Navigasyonu */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg bg-[#6B9BC3]/10 hover:bg-[#6B9BC3]/20 border border-[#6B9BC3]/30 hover:border-[#6B9BC3] transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#1B3A5C]" />
            </motion.button>
            
            <div className="text-[#0D2847] font-semibold text-lg min-w-[140px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNextMonth}
              className="p-2 rounded-lg bg-[#6B9BC3]/10 hover:bg-[#6B9BC3]/20 border border-[#6B9BC3]/30 hover:border-[#6B9BC3] transition-all"
            >
              <ChevronRight className="w-5 h-5 text-[#1B3A5C]" />
            </motion.button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[#1B3A5C]/60 text-xs font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = formatDateKey(day);
            const fullness = availabilityMap.get(dateKey) ?? 0;
            const isSelected = isDateSelected(day);
            
            // Geçmiş tarih kontrolü
            const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dayDate.setHours(0, 0, 0, 0);
            const isPast = dayDate < today;
            
            // Tekne tarih aralığı kontrolü
            const isOutOfBoatRange = !isDateInBoatRange(day);
            
            const isDisabled = fullness >= 1 || isPast || isOutOfBoatRange;

            return (
              <motion.div
                key={day}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onHoverStart={() => !isPast && setHoveredDate(dateKey)}
                onHoverEnd={() => setHoveredDate(null)}
                className="relative"
              >
                <button
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  className={`
                    w-full aspect-square rounded-md border-2 transition-all duration-200
                    flex items-center justify-center font-semibold text-base
                    ${isPast || isOutOfBoatRange
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-[#6B9BC3] border-[#6B9BC3] text-white shadow-lg shadow-[#6B9BC3]/50' 
                        : getAvailabilityColor(fullness)
                    }
                    ${isDisabled && !isPast && !isOutOfBoatRange ? 'cursor-not-allowed opacity-50' : ''}
                    ${!isDisabled ? 'cursor-pointer hover:shadow-lg' : ''}
                  `}
                >
                  {day}
                </button>

                {/* Tooltip */}
                {hoveredDate === dateKey && !isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-white/20"
                  >
                    {getAvailabilityText(fullness)}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-[#6B9BC3]/20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
            <span className="text-[#1B3A5C]/70 text-sm">Müsait</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50" />
            <span className="text-[#1B3A5C]/70 text-sm">Az Yer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
            <span className="text-[#1B3A5C]/70 text-sm">Dolu</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
