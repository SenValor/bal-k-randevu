'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Anchor, Loader2, Moon, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Boat } from '@/lib/boatHelpers';
import { getAllTimeSlotsFullness } from '@/lib/reservationHelpers';

interface TimeSlotWithFullness {
  id: string;
  start: string;
  end: string;
  displayName: string;
  fullness: number;
  baitWarning?: boolean;
}

interface TourSlotSectionProps {
  selectedDate: Date | null;
  selectedTour: { id: number; time: string; title: string; availableSeats?: number } | null;
  onTourSelect: (tour: { id: number; time: string; title: string; availableSeats?: number }) => void;
}

export default function TourSlotSection({ selectedDate, selectedTour, onTourSelect }: TourSlotSectionProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithFullness[]>([]);
  const [loading, setLoading] = useState(true);
  const [boatName, setBoatName] = useState('');
  const [boatId, setBoatId] = useState('');
  const [boatCapacity, setBoatCapacity] = useState(0);
  const [isPrivateTour, setIsPrivateTour] = useState(false);
  const [showNightConfirmation, setShowNightConfirmation] = useState(false);
  const [pendingTourSelection, setPendingTourSelection] = useState<{ id: number; time: string; title: string; availableSeats?: number } | null>(null);
  const [showBaitWarning, setShowBaitWarning] = useState(false);
  const [pendingBaitTourSelection, setPendingBaitTourSelection] = useState<{ id: number; time: string; title: string; availableSeats?: number } | null>(null);

  // Özel tur kontrolü
  useEffect(() => {
    const tourTypeData = localStorage.getItem('selectedTourType');
    if (tourTypeData) {
      const tourType = JSON.parse(tourTypeData);
      setIsPrivateTour(tourType.category === 'private');
    }
  }, []);

  useEffect(() => {
    // localStorage'dan seçili tekneyi al
    const selectedBoatData = localStorage.getItem('selectedBoat');
    if (selectedBoatData) {
      try {
        const boat: Boat = JSON.parse(selectedBoatData);
        setBoatName(boat.name);
        setBoatId(boat.id);
        setBoatCapacity(boat.capacity);
        
        // TimeSlots kontrolü - boş veya undefined ise boş array kullan
        if (boat.timeSlots && Array.isArray(boat.timeSlots) && boat.timeSlots.length > 0) {
          // TimeSlots'ları başlangıçta 0 fullness ile hazırla
          const slotsWithFullness = boat.timeSlots.map((slot, index) => ({
            id: `${index}`,
            start: slot.start,
            end: slot.end,
            displayName: slot.displayName,
            fullness: 0, // Başlangıçta 0
            baitWarning: slot.baitWarning || false,
          }));
          
          setTimeSlots(slotsWithFullness);
        } else {
          // TimeSlots yoksa boş array
          setTimeSlots([]);
        }
      } catch (error) {
        console.error('Tekne verisi parse edilemedi:', error);
        setTimeSlots([]);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Seçili tarih değiştiğinde doluluk oranlarını hesapla
  useEffect(() => {
    if (!selectedDate || !boatId || timeSlots.length === 0 || boatCapacity === 0) {
      return;
    }

    const fetchFullness = async () => {
      try {
        // Tarihi YYYY-MM-DD formatına çevir (UTC değil, yerel zaman!)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log('📅 TourSlot tarih:', {
          selectedDate: dateStr,
          localDate: selectedDate.toLocaleDateString('tr-TR')
        });
        
        // Tüm saat dilimlerinin doluluk oranlarını hesapla
        const fullnessMap = await getAllTimeSlotsFullness(
          boatId,
          dateStr,
          timeSlots.map(slot => ({ id: slot.id })),
          boatCapacity
        );

        // TimeSlots'ları güncel doluluk oranlarıyla güncelle
        setTimeSlots(prevSlots =>
          prevSlots.map(slot => ({
            ...slot,
            fullness: fullnessMap.get(slot.id) || 0,
          }))
        );
      } catch (error) {
        console.error('Doluluk hesaplanırken hata:', error);
      }
    };

    fetchFullness();
  }, [selectedDate, boatId, boatCapacity]);
  const getFullnessColor = (fullness: number) => {
    if (fullness >= 0.8) return 'from-red-500 to-red-600';
    if (fullness >= 0.5) return 'from-yellow-500 to-yellow-600';
    return 'from-[#6B9BC3] to-[#5B8DB8]';
  };

  const getFullnessText = (fullness: number, capacity: number) => {
    const occupied = Math.round(fullness * capacity);
    const available = capacity - occupied;
    
    if (available === 0) return 'Dolu';
    if (available === 1) return '1 Kişilik Yer Var';
    return `${available} Kişilik Yer Var`;
  };

  // Gece yarısını geçen tur kontrolü (01:00-07:00 arası)
  const isOvernightTour = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    // 01:00-07:00 arası başlayan turlar için uyarı göster
    return startHour >= 1 && startHour < 7;
  };

  // Gün isimlerini al
  const getDayName = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  // Ertesi gün ismini al
  const getNextDayName = (date: Date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return getDayName(nextDay);
  };

  // Tur seçim handler'ı
  const handleTourSelection = (tour: { id: number; time: string; title: string; availableSeats?: number }, slot: TimeSlotWithFullness) => {
    // Önce yem uyarısı kontrol et
    if (slot.baitWarning) {
      setPendingBaitTourSelection(tour);
      setShowBaitWarning(true);
      return;
    }
    
    // Gece yarısını geçen tur mu kontrol et
    if (isOvernightTour(slot.start, slot.end)) {
      setPendingTourSelection(tour);
      setShowNightConfirmation(true);
    } else {
      onTourSelect(tour);
    }
  };

  // Gece turunu onayla
  const confirmNightTour = () => {
    if (pendingTourSelection) {
      onTourSelect(pendingTourSelection);
      setShowNightConfirmation(false);
      setPendingTourSelection(null);
    }
  };

  // Gece turunu iptal et
  const cancelNightTour = () => {
    setShowNightConfirmation(false);
    setPendingTourSelection(null);
  };

  // Yem uyarısını onayla
  const confirmBaitWarning = () => {
    if (pendingBaitTourSelection) {
      // Yem uyarısından sonra gece uyarısı kontrolü
      const slot = timeSlots.find(s => s.id === pendingBaitTourSelection.id.toString());
      if (slot && isOvernightTour(slot.start, slot.end)) {
        setPendingTourSelection(pendingBaitTourSelection);
        setShowNightConfirmation(true);
      } else {
        onTourSelect(pendingBaitTourSelection);
      }
      setShowBaitWarning(false);
      setPendingBaitTourSelection(null);
    }
  };

  // Yem uyarısını iptal et
  const cancelBaitWarning = () => {
    setShowBaitWarning(false);
    setPendingBaitTourSelection(null);
  };

  return (
    <section className="mb-8">
      <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-[#6B9BC3]/30 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Anchor className="w-6 h-6 text-[#6B9BC3]" />
          <h2 className="text-2xl font-bold text-[#0D2847]">
            Uygun Turlar ve Saatler
            {boatName && <span className="text-[#6B9BC3] ml-2">({boatName})</span>}
          </h2>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#6B9BC3] animate-spin" />
          </div>
        ) : timeSlots.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-[#1B3A5C]/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0D2847] mb-2">Bu Teknede Henüz Saat Eklenmemiş</h3>
            <p className="text-[#1B3A5C]/70 mb-4">
              {boatName ? `"${boatName}"` : 'Bu tekne'} için admin panelden zaman dilimleri eklenmelidir.
            </p>
            <button
              onClick={() => window.location.href = '/rezervasyon'}
              className="px-6 py-3 bg-[#8B3A3A] hover:bg-[#A04848] text-white rounded-xl transition-colors"
            >
              Başka Tekne Seç
            </button>
          </div>
        ) : (
          /* Tours Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeSlots.map((slot, index) => {
              const isSelected = selectedTour?.id === parseInt(slot.id);
              // Özel tur ise: herhangi bir rezervasyon varsa disabled
              // Normal tur ise: %90 dolu ise disabled
              const isDisabled = isPrivateTour ? slot.fullness > 0 : slot.fullness >= 0.9;

              return (
                <motion.button
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 15 }}
                  whileHover={!isDisabled ? { scale: 1.03, y: -4 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  onClick={() => !isDisabled && handleTourSelection({ 
                    id: parseInt(slot.id), 
                    time: `${slot.start} - ${slot.end}`, 
                    title: slot.displayName,
                    availableSeats: boatCapacity - Math.round(slot.fullness * boatCapacity)
                  }, slot)}
                  disabled={isDisabled}
                  className={`
                    relative p-5 rounded-2xl border-2 transition-all duration-300 text-left
                    ${isSelected
                      ? 'bg-[#6B9BC3]/20 border-[#6B9BC3] shadow-[0_0_20px_rgba(107,155,195,0.5)]'
                      : isDisabled
                      ? 'bg-gray-100 border-red-500/50 opacity-70 cursor-not-allowed'
                      : 'bg-white border-[#6B9BC3]/30 hover:border-[#6B9BC3] hover:bg-[#6B9BC3]/5'
                    }
                  `}
                >
                  {/* Inner Glow for Selected */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6B9BC3]/10 to-transparent"
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

                  <div className="relative z-10">
                    {/* Slot Title */}
                    <div className="flex items-center gap-2 mb-2">
                      <Anchor className={`w-5 h-5 ${isDisabled ? 'text-red-500' : isSelected ? 'text-[#6B9BC3]' : 'text-[#1B3A5C]'}`} />
                      <h3 className={`text-lg font-bold ${isDisabled ? 'text-red-500' : 'text-[#0D2847]'}`}>
                        {slot.displayName}
                      </h3>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className={`w-4 h-4 ${isDisabled ? 'text-red-500' : 'text-[#1B3A5C]/70'}`} />
                      <span className={`text-sm ${isDisabled ? 'text-red-500' : 'text-[#1B3A5C]'}`}>
                        {slot.start} - {slot.end}
                      </span>
                    </div>

                    {/* Fullness Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#1B3A5C]/70">{getFullnessText(slot.fullness, boatCapacity)}</span>
                        <span className={`font-semibold ${
                          isDisabled ? 'text-red-500' : 'text-[#6B9BC3]'
                        }`}>
                          {Math.round(slot.fullness * boatCapacity)}/{boatCapacity}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${slot.fullness * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${getFullnessColor(slot.fullness)}`}
                        />
                      </div>
                    </div>

                    {/* Disabled Badge */}
                    {isDisabled && (
                      <div className="mt-3 inline-block bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
                        <span className="text-xs text-red-400 font-medium">
                          {isPrivateTour ? 'Bu Saatte Rezervasyon Var' : 'Dolu'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Yem Uyarısı Popup'ı */}
      <AnimatePresence>
        {showBaitWarning && pendingBaitTourSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={cancelBaitWarning}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#E8F4F8] to-[#D5E9F0] border-2 border-[#8B3A3A]/40 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-[#8B3A3A]/20 rounded-full blur-xl"
                  />
                  <div className="relative bg-[#8B3A3A]/20 p-4 rounded-full border border-[#8B3A3A]/50">
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <svg className="w-12 h-12 text-[#8B3A3A]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        <path d="M20.5 6c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-2 2c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-3 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z"/>
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#0D2847] text-center mb-4">
                Önemli Bilgilendirme
              </h3>

              {/* Message */}
              <div className="bg-[#8B3A3A]/10 border border-[#8B3A3A]/30 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-[#8B3A3A] flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-[#0D2847] font-semibold text-base">
                      Yeminizi Kendiniz Getirin
                    </p>
                    <p className="text-[#1B3A5C]/80 text-sm leading-relaxed">
                      Bu tur için yem hizmeti verilmemektedir. Lütfen kendi yeminizi getirmeyi unutmayın.
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#8B3A3A]/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1B3A5C]/70">Seçili Tur:</span>
                    <span className="text-[#8B3A3A] font-semibold">
                      {pendingBaitTourSelection.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-[#1B3A5C]/70">Saat:</span>
                    <span className="text-[#0D2847] font-semibold">
                      {pendingBaitTourSelection.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelBaitWarning}
                  className="flex-1 px-6 py-3 bg-[#6B9BC3]/10 hover:bg-[#6B9BC3]/20 border border-[#6B9BC3]/30 text-[#1B3A5C] rounded-xl font-semibold transition-all"
                >
                  İptal
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmBaitWarning}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white rounded-xl font-semibold shadow-lg shadow-[#8B3A3A]/30 transition-all"
                >
                  Anlaşıldı, Devam Et
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gece Turu Onay Popup'ı */}
      <AnimatePresence>
        {showNightConfirmation && pendingTourSelection && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={cancelNightTour}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#001F3F] to-[#000A1F] border-2 border-[#00A9A5]/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-[#00A9A5]/20 rounded-full blur-xl"
                  />
                  <div className="relative bg-[#00A9A5]/20 p-4 rounded-full border border-[#00A9A5]/50">
                    <Moon className="w-12 h-12 text-[#00A9A5]" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Gece Turu Seçimi
              </h3>

              {/* Message */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/90 text-sm leading-relaxed mb-2">
                      Seçtiğiniz tur gece yarısını geçmektedir.
                    </p>
                    <p className="text-yellow-400 text-sm font-semibold">
                      {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' })}'yı{' '}
                      {new Date(selectedDate.getTime() + 86400000).toLocaleDateString('tr-TR', { weekday: 'long' })}'ya bağlayan gece
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Tarih:</span>
                    <span className="text-white font-semibold">
                      {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Tur Saati:</span>
                    <span className="text-[#00A9A5] font-semibold">
                      {pendingTourSelection.time}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-center text-white font-semibold">
                      {getDayName(selectedDate)}'yı {getNextDayName(selectedDate)}'ye bağlayan gece
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelNightTour}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl font-semibold transition-all"
                >
                  İptal
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmNightTour}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white rounded-xl font-semibold shadow-lg shadow-[#00A9A5]/30 transition-all"
                >
                  Onayla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
