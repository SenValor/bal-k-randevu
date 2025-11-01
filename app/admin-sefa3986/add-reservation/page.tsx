'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, Ship, User, Phone, Mail, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Boat, subscribeToBoats } from '@/lib/boatHelpers';
import { Tour, subscribeToTours } from '@/lib/tourHelpers';
import { getReservationsByBoatDateSlot, getCalendarFullness } from '@/lib/reservationHelpers';
import SeatMap from '@/components/reservation/SeatMap';
import DoubleSeatLayout from '@/components/reservation/DoubleSeatLayout';

interface TimeSlot {
  id: string;
  label: string;
  start?: string;
  end?: string;
  fullness: number;
  occupiedSeats: number[];
}

export default function AdminAddReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data
  const [boats, setBoats] = useState<Boat[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  
  // Selections
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  
  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // Calendar & Time Slots
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarFullness, setCalendarFullness] = useState<Map<string, number>>(new Map());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  const defaultTimeSlots = [
    { id: '09:00-12:00', label: '09:00 - 12:00' },
    { id: '12:00-15:00', label: '12:00 - 15:00' },
    { id: '15:00-18:00', label: '15:00 - 18:00' },
    { id: '18:00-21:00', label: '18:00 - 21:00' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBoatId) {
      const boat = boats.find(b => b.id === selectedBoatId);
      setSelectedBoat(boat || null);
      
      // SeatMap component'i için localStorage'a kaydet
      if (boat) {
        localStorage.setItem('selectedBoat', JSON.stringify(boat));
      }
      
      loadCalendarFullness();
    }
  }, [selectedBoatId, boats, currentMonth]);

  useEffect(() => {
    if (selectedBoat && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedBoat, selectedDate]);

  // Kapalı tur ve saat seçildiğinde otomatik koltuk seç
  useEffect(() => {
    if (selectedTourId && selectedBoat && selectedTimeSlot) {
      const selectedTour = tours.find(t => t.id === selectedTourId);
      if (selectedTour && selectedTour.category === 'private') {
        // Kapalı tur - seçili saat slotunu bul
        const currentSlot = timeSlots.find(ts => ts.id === selectedTimeSlot);
        
        if (currentSlot) {
          // Eğer dolu koltuk varsa uyarı ver ve saat seçimini temizle
          if (currentSlot.occupiedSeats && currentSlot.occupiedSeats.length > 0) {
            alert('⚠️ Bu saat diliminde dolu koltuklar var. Kapalı tur için tüm koltuklar boş olmalıdır.');
            setSelectedTimeSlot('');
            setSelectedSeats([]);
            setNumberOfPeople(1);
            return;
          }
          
          // Tüm koltukları otomatik seç
          const allSeats = Array.from({ length: selectedBoat.capacity || 12 }, (_, i) => i + 1);
          setSelectedSeats(allSeats);
          setNumberOfPeople(12);
        }
      }
    }
  }, [selectedTourId, selectedTimeSlot, selectedBoat, tours, timeSlots]);

  const fetchData = async () => {
    try {
      const unsubBoats = subscribeToBoats((updatedBoats) => {
        const activeBoats = updatedBoats.filter(boat => boat.isActive);
        setBoats(activeBoats);
      });

      const unsubTours = subscribeToTours((updatedTours) => {
        const activeTours = updatedTours.filter(tour => tour.isActive);
        setTours(activeTours);
      });

      setLoading(false);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setLoading(false);
    }
  };

  const loadCalendarFullness = async () => {
    if (!selectedBoatId) return;

    const boat = boats.find(b => b.id === selectedBoatId);
    if (!boat) return;

    // 3 ay için doluluk verilerini çek (mevcut ay + 2 ay sonrası)
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 3, 0); // 3 ay sonrasının son günü

    console.log('📅 Doluluk verisi yükleniyor:', {
      boatId: selectedBoatId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      capacity: boat.capacity,
      timeSlots: defaultTimeSlots.length
    });

    const fullnessMap = await getCalendarFullness(
      selectedBoatId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      boat.capacity,
      defaultTimeSlots.length
    );

    console.log('✅ Doluluk verisi yüklendi:', {
      mapSize: fullnessMap.size,
      data: Array.from(fullnessMap.entries()).slice(0, 5)
    });

    setCalendarFullness(fullnessMap);
  };

  const loadTimeSlots = async () => {
    if (!selectedBoat || !selectedDate) return;

    setLoadingTimeSlots(true);
    setSelectedTimeSlot('');
    setSelectedSeats([]);

    try {
      const slotsWithFullness: TimeSlot[] = [];

      // Tekneden gelen timeSlots'u kullan, yoksa default'u kullan
      const boatTimeSlots = selectedBoat.timeSlots && selectedBoat.timeSlots.length > 0
        ? selectedBoat.timeSlots
        : defaultTimeSlots;

      for (let index = 0; index < boatTimeSlots.length; index++) {
        const slot = boatTimeSlots[index];
        // Slot ID'sini oluştur - hem index hem de start-end formatını dene
        const slotIdFromFormat = (slot as any).id || `${(slot as any).start}-${(slot as any).end}`;
        const slotIdFromIndex = index.toString(); // Müşteri tarafında "0", "1", "2", "3" olarak kaydediliyor
        const slotLabel = (slot as any).label || (slot as any).displayName || `${(slot as any).start} - ${(slot as any).end}`;
        
        console.log('🔍 Admin: Slot kontrol ediliyor:', {
          index,
          slotIdFromFormat,
          slotIdFromIndex,
          slotLabel,
          boatId: selectedBoat.id,
          date: selectedDate,
          slot: slot
        });
        
        // Önce index formatında dene (müşteri tarafı bu formatı kullanıyor)
        let reservations = await getReservationsByBoatDateSlot(
          selectedBoat.id,
          selectedDate,
          slotIdFromIndex
        );

        // Eğer bulunamazsa start-end formatında dene
        if (reservations.length === 0) {
          console.log('⚠️ Index formatında bulunamadı, start-end formatında deneniyor...');
          reservations = await getReservationsByBoatDateSlot(
            selectedBoat.id,
            selectedDate,
            slotIdFromFormat
          );
        }

        console.log('📋 Admin: Bulunan rezervasyonlar:', {
          slotIdFromIndex,
          slotIdFromFormat,
          count: reservations.length,
          reservations: reservations.map(r => ({
            id: r.id,
            timeSlotId: r.timeSlotId,
            seats: r.selectedSeats,
            date: r.date
          }))
        });

        const occupiedSeats = reservations.reduce((acc, res) => {
          if (res.selectedSeats && Array.isArray(res.selectedSeats)) {
            return [...acc, ...res.selectedSeats];
          }
          return acc;
        }, [] as number[]);

        const fullness = occupiedSeats.length / selectedBoat.capacity;

        console.log('📊 Admin: Doluluk hesaplandı:', {
          slotIdFromIndex,
          occupiedSeats: occupiedSeats.length,
          capacity: selectedBoat.capacity,
          fullness: Math.round(fullness * 100) + '%'
        });

        slotsWithFullness.push({
          id: slotIdFromIndex, // Index formatını kullan (müşteri tarafı ile uyumlu)
          label: slotLabel,
          start: (slot as any).start,
          end: (slot as any).end,
          fullness,
          occupiedSeats: [...new Set(occupiedSeats)],
        });
      }

      setTimeSlots(slotsWithFullness);
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleSeatClick = (seatNumber: number) => {
    const currentSlot = timeSlots.find(s => s.id === selectedTimeSlot);
    if (!currentSlot) return;

    // Dolu koltuk mu kontrol et
    if (currentSlot.occupiedSeats.includes(seatNumber)) {
      alert('Bu koltuk dolu!');
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length < numberOfPeople) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        alert(`En fazla ${numberOfPeople} koltuk seçebilirsiniz!`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBoat || !selectedDate || !selectedTimeSlot || selectedSeats.length === 0) {
      alert('Lütfen tüm alanları doldurun ve koltuk seçin!');
      return;
    }

    if (selectedSeats.length !== numberOfPeople) {
      alert(`${numberOfPeople} kişi için ${numberOfPeople} koltuk seçmelisiniz!`);
      return;
    }

    setSubmitting(true);

    try {
      const selectedTour = tours.find(t => t.id === selectedTourId);
      
      // Seçili saat diliminin display bilgisini al
      const selectedSlot = timeSlots.find(ts => ts.id === selectedTimeSlot);
      let timeSlotDisplayValue = selectedTimeSlot;
      
      if (selectedSlot && selectedBoat?.timeSlots) {
        const boatSlot = selectedBoat.timeSlots[parseInt(selectedTimeSlot)] || 
                        selectedBoat.timeSlots.find((s: any) => s.id === selectedTimeSlot || `${s.start}-${s.end}` === selectedTimeSlot);
        
        if (boatSlot) {
          const displayName = (boatSlot as any).displayName || '';
          const start = (boatSlot as any).start || '';
          const end = (boatSlot as any).end || '';
          timeSlotDisplayValue = displayName ? `${displayName} (${start} - ${end})` : `${start} - ${end}`;
        }
      }

      const newReservation = {
        userId: 'admin-manual',
        userName: customerName || 'Admin Ekledi',
        userEmail: customerEmail || '',
        userPhone: customerPhone || '',
        boatId: selectedBoat.id,
        boatName: selectedBoat.name,
        boatMapsLink: selectedBoat.mapsLink || '',
        tourId: selectedTourId || '',
        tourName: selectedTour?.name || 'Özel Tur',
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        timeSlotId: selectedTimeSlot,
        timeSlotDisplay: timeSlotDisplayValue,
        selectedSeats,
        adultCount: numberOfPeople,
        childCount: 0,
        babyCount: 0,
        totalPeople: numberOfPeople,
        totalPrice: selectedTour?.price || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isManual: true,
        notes: notes || '',
      };

      await addDoc(collection(db, 'reservations'), newReservation);

      alert('✅ Rezervasyon başarıyla eklendi! Bekleyen randevular sayfasından onaylayabilirsiniz.');
      router.push('/admin-sefa3986/pending');
    } catch (error) {
      console.error('Rezervasyon ekleme hatası:', error);
      alert('❌ Bir hata oluştu!');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayFullnessColor = (date: string) => {
    const fullness = calendarFullness.get(date) || 0;
    // fullness: 0=tüm saatler boş, 0.5=kısmen dolu, 1=tüm saatler dolu
    if (fullness >= 1) return 'bg-red-500/20 border-red-500'; // Tüm saatler dolu
    if (fullness >= 0.5) return 'bg-yellow-500/20 border-yellow-500'; // Kısmen dolu
    return 'bg-green-500/20 border-green-500'; // Tüm saatler boş
  };

  const getTimeSlotColor = (fullness: number) => {
    if (fullness >= 1) return 'bg-red-500/20 border-red-500';
    if (fullness >= 0.8) return 'bg-orange-500/20 border-orange-500';
    if (fullness >= 0.5) return 'bg-yellow-500/20 border-yellow-500';
    return 'bg-green-500/20 border-green-500';
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

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const renderMonth = (monthOffset: number) => {
    const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(displayMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Boş hücreler
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Günler
    for (let day = 1; day <= daysInMonth; day++) {
      const year = displayMonth.getFullYear();
      const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${month}-${dayStr}`;
      
      const dayDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      dayDate.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;

      days.push(
        <button
          key={dateKey}
          type="button"
          onClick={() => !isPast && setSelectedDate(dateKey)}
          disabled={isPast}
          className={`w-full aspect-square rounded-md border transition-all duration-200 flex items-center justify-center font-semibold text-xs ${
            isPast
              ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
              : selectedDate === dateKey
              ? 'bg-[#00A9A5] border-[#00A9A5] text-white shadow-lg'
              : getDayFullnessColor(dateKey)
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="text-center text-white font-semibold text-sm mb-2">
          {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-white/40 text-[10px] font-medium py-0.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days}
        </div>
      </div>
    );
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

  const renderSeats = () => {
    if (!selectedBoat) return null;

    const currentSlot = timeSlots.find(s => s.id === selectedTimeSlot);
    if (!currentSlot) return null;

    const seats = [];
    for (let i = 1; i <= selectedBoat.capacity; i++) {
      const isOccupied = currentSlot.occupiedSeats.includes(i);
      const isSelected = selectedSeats.includes(i);

      seats.push(
        <button
          key={i}
          type="button"
          onClick={() => handleSeatClick(i)}
          disabled={isOccupied}
          className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
            isOccupied
              ? 'bg-red-500/20 border-red-500 text-red-400 cursor-not-allowed'
              : isSelected
              ? 'bg-[#00A9A5] border-[#00A9A5] text-white'
              : 'bg-white/5 border-white/20 text-white hover:border-[#00A9A5]'
          }`}
        >
          {i}
        </button>
      );
    }

    return seats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-20">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-20 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin-sefa3986/reservations')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Manuel Rezervasyon Ekle</h1>
              <p className="text-white/60 text-sm">Tüm bilgileri tek sayfada girin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tekne ve Tur Seçimi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tekne */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Ship className="w-5 h-5 text-[#00A9A5]" />
                Tekne Seçimi *
              </h2>
              <select
                value={selectedBoatId}
                onChange={(e) => setSelectedBoatId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00A9A5] focus:outline-none"
              >
                <option value="">Tekne Seçin</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name} ({boat.capacity} kişi)
                  </option>
                ))}
              </select>
            </div>

            {/* Tur */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Tur Seçimi (Opsiyonel)</h2>
              <select
                value={selectedTourId}
                onChange={(e) => setSelectedTourId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00A9A5] focus:outline-none"
              >
                <option value="">Özel Tur</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name} - {tour.price} ₺
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Takvim */}
          {selectedBoat && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#00A9A5]" />
                  <h2 className="text-xl font-bold text-white">Tarih Seçimi *</h2>
                  <span className="text-sm text-[#00A9A5] font-normal">(Kapalı günlere de eklenebilir)</span>
                </div>
                
                {/* Ay Navigasyonu */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00A9A5] transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00A9A5] transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* 3 Aylık Takvim Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {renderMonth(0)}
                {renderMonth(1)}
                {renderMonth(2)}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></div>
                  <span className="text-white/60 text-xs">Müsait</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50"></div>
                  <span className="text-white/60 text-xs">Az Yer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50"></div>
                  <span className="text-white/60 text-xs">Dolu</span>
                </div>
              </div>
            </div>
          )}

          {/* Saat Dilimi */}
          {selectedDate && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00A9A5]" />
                Saat Dilimi *
              </h2>
              {loadingTimeSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timeSlots.map((slot) => {
                    const fullnessPercent = Math.round(slot.fullness * 100);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedTimeSlot(slot.id);
                          setSelectedSeats([]);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedTimeSlot === slot.id
                            ? 'border-[#00A9A5] bg-[#00A9A5]/20'
                            : getTimeSlotColor(slot.fullness)
                        }`}
                      >
                        <div className="text-white font-bold mb-2 text-lg">
                          {slot.label}
                          {slot.start && slot.end && (
                            <span className="text-white/70 text-sm ml-2">({slot.start} - {slot.end})</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-white/80 text-sm">
                            📊 Doluluk: %{fullnessPercent}
                          </div>
                          <div className="text-white/80 text-sm">
                            🪑 {slot.occupiedSeats.length}/{selectedBoat?.capacity} Koltuk Dolu
                          </div>
                          {selectedBoat?.timeSlots && selectedBoat.timeSlots.find((ts: any) => 
                            ((ts.id || `${ts.start}-${ts.end}`) === slot.id)
                          )?.baitWarning && (
                            <div className="text-yellow-400 text-xs mt-1">
                              ⚠️ Yem getirin
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Koltuk Seçimi */}
          {selectedTimeSlot && selectedBoat && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00A9A5]" />
                  Koltuk Seçimi *
                </h2>
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-white/80 text-sm">
                    {selectedSeats.length}/{numberOfPeople} koltuk seçildi
                  </span>
                </div>
              </div>

              {/* Koltuk Haritası - Admin Panel Teması */}
              <div className="flex justify-center bg-gradient-to-br from-[#001F3F] to-[#001529] rounded-xl p-8 border border-white/10">
                <div className="transform scale-110">
                  {selectedBoat.seatLayout === 'double' ? (
                    <DoubleSeatLayout
                      selectedSeats={selectedSeats}
                      onSeatToggle={handleSeatClick}
                      maxSeats={numberOfPeople}
                      selectedDate={new Date(selectedDate)}
                      timeSlotId={selectedTimeSlot}
                      isPrivateTour={false}
                    />
                  ) : (
                    <SeatMap
                      selectedSeats={selectedSeats}
                      onSeatToggle={handleSeatClick}
                      maxSeats={numberOfPeople}
                      selectedDate={new Date(selectedDate)}
                      timeSlotId={selectedTimeSlot}
                      isPrivateTour={false}
                    />
                  )}
                </div>
              </div>

              {/* Kişi Sayısı Ayarı */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <label className="text-white/80 text-sm font-medium">Kişi Sayısı:</label>
                <input
                  type="number"
                  value={numberOfPeople || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setNumberOfPeople(value);
                    setSelectedSeats([]);
                  }}
                  min="1"
                  max={selectedBoat?.capacity || 100}
                  className="w-24 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:border-[#00A9A5] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Müşteri Bilgileri */}
          {selectedSeats.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00A9A5]" />
                Müşteri Bilgileri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    placeholder="Müşteri adı"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    placeholder="0531 089 25 37"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Notlar
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    placeholder="Özel istekler..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedSeats.length > 0 && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin-sefa3986/reservations')}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Rezervasyon Ekle'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
