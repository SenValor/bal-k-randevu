'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  isActive: boolean;
}

interface CustomTour {
  id: string;
  name: string;
  price: number;
  capacity: number;
  duration: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  customSchedule?: {
    enabled: boolean;
    timeSlots: TimeSlot[];
    note?: string;
  };
}

interface Boat {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  seatingLayout?: 'single' | 'double';
}

interface Reservation {
  id: string;
  tourType: string;
  priceOption: 'own-equipment' | 'with-equipment';
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedBoat: string;
  selectedSeats: string[];
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  createdAt: Date;
  boatName?: string;
}

interface NewReservation {
  tourType: string;
  priceOption: 'own-equipment' | 'with-equipment';
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedBoat: string;
  selectedSeats: string[];
  guestInfo: {
    name: string;
    surname: string;
    phone: string;
    email: string;
  };
  status: 'pending' | 'confirmed';
  paymentStatus: 'waiting' | 'received' | 'confirmed';
}

function AddReservationPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [dateOccupancy, setDateOccupancy] = useState<{[key: string]: number}>({});
  const [occupiedDates, setOccupiedDates] = useState<{[key: string]: number}>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customTours, setCustomTours] = useState<CustomTour[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  
  const [newReservation, setNewReservation] = useState<NewReservation>({
    tourType: 'normal',
    priceOption: 'own-equipment',
    guestCount: 1,
    selectedDate: '',
    selectedTime: '',
    selectedBoat: '',
    selectedSeats: [],
    guestInfo: {
      name: '',
      surname: '',
      phone: '',
      email: ''
    },
    status: 'confirmed',
    paymentStatus: 'waiting'
  });

  const availableTimes = ['07:00-13:00', '14:00-20:00'];
  
  const getBoatOrder = (boatId: string): string => {
    const sortedBoats = boats.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
    const index = sortedBoats.findIndex(boat => boat.id === boatId);
    return index >= 0 ? `T${index + 1}` : 'T1';
  };

  const getSeatingLayout = () => {
    if (!newReservation.selectedBoat) {
      return {
        iskele: ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'],
        sancak: ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6']
      };
    }
    
    const prefix = `${getBoatOrder(newReservation.selectedBoat)}_`;
    return {
      iskele: [`${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`],
      sancak: [`${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`]
    };
  };

  const seatingLayout = getSeatingLayout();
  const iskeleSeat = seatingLayout.iskele;
  const sancakSeat = seatingLayout.sancak;

  const generateReservationNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `RV-${year}${month}${day}-${timestamp}`;
  };

  const fetchCustomTours = async () => {
    try {
      const customToursDoc = await getDoc(doc(db, 'settings', 'customTours'));
      if (customToursDoc.exists()) {
        const data = customToursDoc.data();
        if (data.tours && Array.isArray(data.tours)) {
          const activeTours = data.tours.filter((tour: CustomTour) => tour.isActive);
          setCustomTours(activeTours);
        }
      }
    } catch (error) {
      console.error('Özel turlar çekilemedi:', error);
    }
  };

  const calculateDateOccupancy = async () => {
    if (!newReservation.selectedBoat) {
      setDateOccupancy({});
      setOccupiedDates({});
      return;
    }

    try {
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('selectedBoat', '==', newReservation.selectedBoat)
      );
      const snapshot = await getDocs(q);
      const occupancyData: {[key: string]: number} = {};
      const dateOccupancyData: {[key: string]: number} = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          const dateKey = `${data.selectedDate}-${data.selectedTime}`;
          const dateOnlyKey = data.selectedDate;
          
          if (data.isPrivateTour) {
            occupancyData[dateKey] = 12;
            dateOccupancyData[dateOnlyKey] = (dateOccupancyData[dateOnlyKey] || 0) + 12;
          } else {
            occupancyData[dateKey] = (occupancyData[dateKey] || 0) + (data.selectedSeats?.length || data.guestCount);
            dateOccupancyData[dateOnlyKey] = (dateOccupancyData[dateOnlyKey] || 0) + (data.selectedSeats?.length || data.guestCount);
          }
        }
      });
      
      setDateOccupancy(occupancyData);
      setOccupiedDates(dateOccupancyData);
    } catch (error: any) {
      console.error('Doluluk hesaplama hatası:', error);
    }
  };

  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time || !newReservation.selectedBoat) return;
    
    try {
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('selectedDate', '==', date),
        where('selectedTime', '==', time),
        where('selectedBoat', '==', newReservation.selectedBoat)
      );
      
      const snapshot = await getDocs(q);
      const occupied: string[] = [];
      const currentBoatOrder = getBoatOrder(newReservation.selectedBoat);
      const currentPrefix = `${currentBoatOrder}_`;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          if (data.isPrivateTour) {
            const allSeats = [
              `${currentPrefix}IS1`, `${currentPrefix}IS2`, `${currentPrefix}IS3`, 
              `${currentPrefix}IS4`, `${currentPrefix}IS5`, `${currentPrefix}IS6`,
              `${currentPrefix}SA1`, `${currentPrefix}SA2`, `${currentPrefix}SA3`, 
              `${currentPrefix}SA4`, `${currentPrefix}SA5`, `${currentPrefix}SA6`
            ];
            occupied.push(...allSeats);
          } else if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            data.selectedSeats.forEach((seat: string) => {
              if (seat.startsWith(currentPrefix) || (!seat.includes('_') && currentBoatOrder === 'T1')) {
                occupied.push(seat);
              }
            });
          }
        }
      });
      
      setOccupiedSeats(occupied);
    } catch (error: any) {
      console.error('Dolu koltuk getirme hatası:', error);
    }
  };

  const isSpecialTour = (type: string) => {
    return type === 'private' || type === 'fishing-swimming' || customTours.some(tour => tour.id === type);
  };

  const getSelectedCustomTour = (type: string) => {
    return customTours.find(tour => tour.id === type);
  };

  const fetchBoats = async () => {
    try {
      const boatsRef = collection(db, 'boats');
      const q = query(boatsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      const boatList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          isActive: data.isActive || false,
          seatingLayout: data.seatingLayout || 'single',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
      
      setBoats(boatList);
    } catch (error) {
      console.error('Tekneler çekilemedi:', error);
    }
  };

  useEffect(() => {
    fetchCustomTours();
    fetchBoats();
  }, []);

  useEffect(() => {
    if (newReservation.selectedBoat) {
      calculateDateOccupancy();
    }
  }, [newReservation.selectedBoat]);

  useEffect(() => {
    if (newReservation.selectedDate && newReservation.selectedTime && newReservation.selectedBoat) {
      fetchOccupiedSeats(newReservation.selectedDate, newReservation.selectedTime);
    }
  }, [newReservation.selectedDate, newReservation.selectedTime, newReservation.selectedBoat]);

  // Ay değiştirme fonksiyonları
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Takvim günlerini hesapla
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi = 0
    
    const days = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Önceki ayın günleri
    const prevMonth = new Date(year, monthIndex - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const prevYear = monthIndex === 0 ? year - 1 : year;
      const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
      const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isDisabled: dateStr < todayStr
      });
    }
    
    // Sonraki ayın günleri (grid'i doldur)
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün
    for (let day = 1; day <= remainingDays; day++) {
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
      const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    return days;
  };

  // Takvim render fonksiyonu
  const renderCalendar = () => {
    if (!newReservation.selectedBoat) return null;

    const calendarDays = getCalendarDays(currentMonth);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">📅 Tarih Seçin</h3>
        
        {/* Takvim Başlığı */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300"
          >
            <span className="text-blue-600 font-bold">‹</span>
          </button>
          
          <h4 className="text-lg font-bold text-slate-800">
            {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </h4>
          
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300"
          >
            <span className="text-blue-600 font-bold">›</span>
          </button>
        </div>

        {/* Hafta Günleri */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-xs font-bold text-slate-600">{day}</span>
            </div>
          ))}
        </div>

        {/* Takvim Günleri */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const occupancy = occupiedDates[dayInfo.date] || 0;
            const isSelected = newReservation.selectedDate === dayInfo.date;
            const isFullyOccupied = occupancy >= 24;
            const isPartiallyOccupied = occupancy > 0 && occupancy < 24;
            
            let buttonClass = "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300 border ";
            
            if (dayInfo.isDisabled || !dayInfo.isCurrentMonth) {
              buttonClass += "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200";
            } else if (isSelected) {
              buttonClass += "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 scale-110 shadow-lg";
            } else if (isFullyOccupied) {
              buttonClass += "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-500 cursor-not-allowed";
            } else if (isPartiallyOccupied) {
              buttonClass += "bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-500 hover:scale-105 cursor-pointer";
            } else {
              buttonClass += "bg-blue-50 text-slate-800 border-blue-200 hover:bg-blue-100 hover:scale-105 cursor-pointer";
            }
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (!dayInfo.isDisabled && dayInfo.isCurrentMonth && !isFullyOccupied) {
                    setNewReservation(prev => ({
                      ...prev,
                      selectedDate: dayInfo.date,
                      selectedSeats: []
                    }));
                  }
                }}
                disabled={dayInfo.isDisabled || !dayInfo.isCurrentMonth || isFullyOccupied}
                className={buttonClass}
                title={
                  !dayInfo.isCurrentMonth ? 'Diğer ay' :
                  dayInfo.isDisabled ? 'Geçmiş tarih' :
                  isFullyOccupied ? `${dayInfo.day} - Tamamen dolu` :
                  isPartiallyOccupied ? `${dayInfo.day} - Kısmi dolu (${occupancy}/24)` :
                  `${dayInfo.day} - Boş`
                }
              >
                {dayInfo.day}
              </button>
            );
          })}
        </div>
        
        {/* Takvim Renk Açıklaması */}
        <div className="flex justify-center gap-2 text-xs mt-4">
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-green-200">
            <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Seçili</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-red-200">
            <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Dolu</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-orange-200">
            <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Kısmi</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-blue-200">
            <div className="w-4 h-4 bg-blue-100 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Boş</span>
          </div>
        </div>
      </div>
    );
  };

  // Koltuk renk fonksiyonu
  const getSeatColor = (status: 'available' | 'selected' | 'occupied') => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700';
      case 'selected':
        return 'bg-gradient-to-br from-green-400 to-green-600';
      case 'occupied':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Çiftli koltuk pair'ini bul (2. tekne için)
  const getSeatPair = (seat: string): string | undefined => {
    const prefix = seat.split('_')[0] + '_';
    const seatCode = seat.split('_')[1];
    
    if (!seatCode) return undefined;
    
    const seatMap: {[key: string]: string} = {
      'IS1': 'IS2', 'IS2': 'IS1',
      'IS3': 'IS4', 'IS4': 'IS3', 
      'IS5': 'IS6', 'IS6': 'IS5',
      'SA1': 'SA2', 'SA2': 'SA1',
      'SA3': 'SA4', 'SA4': 'SA3',
      'SA5': 'SA6', 'SA6': 'SA5'
    };
    
    const pairSeat = seatMap[seatCode];
    return pairSeat ? `${prefix}${pairSeat}` : undefined;
  };

  // Koltuk seçimi render fonksiyonu
  const renderSeatSelection = () => {
    if (!newReservation.selectedBoat || !newReservation.selectedDate || !newReservation.selectedTime) {
      return null;
    }

    const handleSeatClick = (seatId: string) => {
      if (occupiedSeats.includes(seatId)) return;
      
      const currentSeats = [...newReservation.selectedSeats];
      const seatIndex = currentSeats.indexOf(seatId);
      
      if (seatIndex > -1) {
        currentSeats.splice(seatIndex, 1);
      } else {
        if (currentSeats.length < newReservation.guestCount) {
          currentSeats.push(seatId);
        } else {
          alert(`En fazla ${newReservation.guestCount} koltuk seçebilirsiniz.`);
          return;
        }
      }
      
      setNewReservation(prev => ({
        ...prev,
        selectedSeats: currentSeats
      }));
    };

    const renderSeat = (seatId: string) => {
      const selectedBoat = boats.find(b => b.id === newReservation.selectedBoat);
      const isDoubleSeat = selectedBoat?.seatingLayout === 'double';
      const isOccupied = occupiedSeats.includes(seatId);
      const isSelected = newReservation.selectedSeats.includes(seatId);
      
      if (isDoubleSeat) {
        // 2. Tekne: Çiftli görünüm ama bağımsız seçim
        const pairSeat = getSeatPair(seatId);
        const isPairSelected = pairSeat ? newReservation.selectedSeats.includes(pairSeat) : false;
        const isPairOccupied = pairSeat ? occupiedSeats.includes(pairSeat) : false;
        
        // Çiftli görünümde sadece çift numaralı koltukları render et
        const seatNumber = seatId.split('_')[1];
        const isEvenSeat = parseInt(seatNumber?.slice(-1) || '0') % 2 === 0;
        if (!isEvenSeat) return null; // Tek numaralı koltuklarda render yapma
        
        const oddSeat = getSeatPair(seatId);
        const oddIsSelected = newReservation.selectedSeats.includes(oddSeat || '');
        const oddIsOccupied = occupiedSeats.includes(oddSeat || '');
        
        return (
          <div key={seatId} className="w-8 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-gray-300 bg-white">
            {/* Üst koltuk (tek numaralı) */}
            <button
              onClick={() => {
                if (!oddSeat || oddIsOccupied) return;
                handleSeatClick(oddSeat);
              }}
              disabled={oddIsOccupied}
              className={`w-full h-1/2 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${getSeatColor(
                oddIsSelected ? 'selected' : oddIsOccupied ? 'occupied' : 'available'
              )} ${
                oddIsOccupied ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
              title={
                oddIsOccupied 
                  ? `${oddSeat} koltuğu dolu` 
                  : oddIsSelected 
                  ? `${oddSeat} seçimini kaldır`
                  : `${oddSeat} koltuğunu seç`
              }
            >
              <div className="relative flex items-center justify-center">
                <span className="relative z-10">{oddSeat?.split('_')[1]?.slice(-1)}</span>
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-black/30 rounded-full"></div>
              </div>
            </button>
            
            {/* Alt koltuk (çift numaralı) */}
            <button
              onClick={() => handleSeatClick(seatId)}
              disabled={isOccupied}
              className={`w-full h-1/2 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${getSeatColor(
                isSelected ? 'selected' : isOccupied ? 'occupied' : 'available'
              )} ${
                isOccupied ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
              title={
                isOccupied 
                  ? `${seatId} koltuğu dolu` 
                  : isSelected 
                  ? `${seatId} seçimini kaldır`
                  : `${seatId} koltuğunu seç`
              }
            >
              <div className="relative flex items-center justify-center">
                <span className="relative z-10">{seatId.split('_')[1]?.slice(-1)}</span>
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-black/30 rounded-full"></div>
              </div>
            </button>
          </div>
        );
      } else {
        // 1. Tekne: Normal tekli koltuk
        return (
          <button
            key={seatId}
            type="button"
            onClick={() => handleSeatClick(seatId)}
            disabled={isOccupied}
            className={`w-8 h-8 rounded cursor-pointer text-white text-xs font-bold flex items-center justify-center transition-all duration-300 ${getSeatColor(
              isSelected ? 'selected' : isOccupied ? 'occupied' : 'available'
            )} ${
              isOccupied ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            title={
              isOccupied 
                ? `${seatId} koltuğu dolu` 
                : isSelected 
                ? `${seatId} seçimini kaldır`
                : `${seatId} koltuğunu seç`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="relative z-10">{seatId.split('_')[1]?.slice(-1) || seatId.slice(-1)}</span>
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-black/30 rounded-full"></div>
            </div>
          </button>
        );
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* Koltuk Seçimi Durum Bilgisi */}
        {newReservation.selectedSeats.length < newReservation.guestCount && (
          <div className="mb-4 text-center">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 inline-block">
              <p className="text-orange-800 text-sm font-medium mb-1">
                🪑 <strong>Koltuk Seçimi:</strong> {newReservation.selectedSeats.length}/{newReservation.guestCount}
              </p>
              <p className="text-orange-700 text-xs">
                Henüz {newReservation.guestCount - newReservation.selectedSeats.length} koltuk daha seçmelisiniz
              </p>
            </div>
          </div>
        )}

        {newReservation.selectedSeats.length === newReservation.guestCount && (
          <div className="mb-4 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 inline-block">
              <p className="text-green-800 text-sm font-medium mb-1">
                ✅ <strong>Koltuk Seçimi Tamamlandı!</strong>
              </p>
              <p className="text-green-700 text-xs">
                {newReservation.guestCount} koltuk başarıyla seçildi
              </p>
              {boats.find(b => b.id === newReservation.selectedBoat)?.seatingLayout === 'double' && (
                <p className="text-blue-600 text-xs mt-1">
                  👥 Koltuklar çiftli görünür ama her kişi için ayrı koltuk seçildi
                </p>
              )}
            </div>
          </div>
        )}

        {/* Doluluk Bilgisi */}
        <div className="mb-4 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 inline-block">
            <p className="text-blue-800 text-sm font-medium mb-1">
              🔄 <strong>Seçili Saat:</strong> {newReservation.selectedTime}
            </p>
            <div className="flex items-center space-x-2 justify-center">
              <div className={`w-3 h-3 rounded-full ${occupiedSeats.length === 0 ? 'bg-green-500' : occupiedSeats.length >= 20 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
              <p className="text-blue-800 text-sm font-medium">
                <strong>Doluluk:</strong> {occupiedSeats.length}/24
              </p>
            </div>
            {occupiedSeats.length === 0 && (
              <p className="text-green-700 text-xs mt-1">
                ✅ Tüm koltuklar müsait!
              </p>
            )}
          </div>
        </div>
        
        {/* Tekne Krokisi */}
        <div className="relative max-w-xs mx-auto">
          {/* BAŞ - Üçgen Kısım */}
          <div className="relative">
            <div className="text-center mb-3">
              <span className="text-sm font-bold text-slate-800 bg-white/95 px-4 py-2 rounded-full shadow-xl border border-slate-300">⚓ BAŞ</span>
            </div>
            
            <div 
              className="relative mx-auto w-32 h-20 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-2 border-slate-400"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
              }}
            >
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="bg-white/90 p-1.5 rounded-full shadow-lg border border-slate-300">
                  <span className="text-lg">⚓</span>
                </div>
                <div className="bg-white/90 p-1.5 rounded-full shadow-lg border border-slate-300">
                  <span className="text-sm">🚽</span>
                </div>
              </div>
            </div>
          </div>

          {/* ANA GÖVDE - Dikdörtgen Kısım */}
          <div className="relative bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 w-32 mx-auto shadow-2xl rounded-b-2xl border-2 border-slate-400 border-t-0">
            {/* İskele (Sol) Label */}
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
              <span className="text-xs font-bold text-black bg-white/95 px-3 py-1 rounded-full shadow-xl border border-blue-600">🌊 İSKELE</span>
            </div>
            
            {/* Sancak (Sağ) Label */}
            <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 rotate-90">
              <span className="text-xs font-bold text-slate-800 bg-white/95 px-3 py-1 rounded-full shadow-xl border border-slate-300">🌊 SANCAK</span>
            </div>

            {/* Koltuk Düzeni */}
            <div className="flex justify-between p-3">
              {/* İskele Koltukları (Sol) */}
              <div className="flex flex-col space-y-2">
                {iskeleSeat.map(seatId => renderSeat(seatId))}
              </div>

              {/* Orta Koridor */}
              <div className="w-6 bg-gradient-to-b from-slate-400 via-slate-450 to-slate-500 rounded-lg shadow-inner border border-slate-500">
                <div className="space-y-1 pt-3">
                  <div className="w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                  <div className="w-2 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                  <div className="w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                </div>
              </div>

              {/* Sancak Koltukları (Sağ) */}
              <div className="flex flex-col space-y-2">
                {sancakSeat.map(seatId => renderSeat(seatId))}
              </div>
            </div>
          </div>

          {/* KIÇ */}
          <div className="text-center mt-3">
            <span className="text-sm font-bold text-slate-800 bg-white/95 px-4 py-2 rounded-full shadow-xl border border-slate-300">🚤 KIÇ</span>
          </div>
        </div>

        {/* Koltuk Durumu Açıklamaları */}
        <div className="flex justify-center space-x-2 text-xs mt-4">
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-blue-200">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Boş</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-green-200">
            <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Seçili</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/95 px-3 py-2 rounded-full shadow-lg border border-red-200">
            <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
            <span className="font-bold text-slate-800">Dolu</span>
          </div>
        </div>
      </div>
    );
  };

  const addNewReservation = async () => {
    if (!newReservation.selectedBoat) {
      alert('Lütfen tekne seçin');
      return;
    }
    
    if (!newReservation.selectedDate || !newReservation.selectedTime) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }
    
    if (newReservation.selectedSeats.length !== newReservation.guestCount) {
      alert(`Lütfen ${newReservation.guestCount} adet koltuk seçin`);
      return;
    }
    
    if (!newReservation.guestInfo.name || !newReservation.guestInfo.surname) {
      alert('Lütfen ad ve soyad girin');
      return;
    }
    
    if (!newReservation.guestInfo.phone) {
      alert('Lütfen telefon numarası girin');
      return;
    }

    setAdding(true);
    
    try {
      const selectedBoat = boats.find(b => b.id === newReservation.selectedBoat);
      
      const reservationData = {
        reservationNumber: generateReservationNumber(),
        guestCount: newReservation.guestCount,
        selectedDate: newReservation.selectedDate,
        selectedTime: newReservation.selectedTime,
        selectedSeats: newReservation.selectedSeats,
        selectedBoat: newReservation.selectedBoat,
        boatName: selectedBoat?.name || '',
        isPrivateTour: false,
        tourType: newReservation.tourType,
        priceOption: newReservation.priceOption,
        guestInfos: [
          {
            name: newReservation.guestInfo.name,
            surname: newReservation.guestInfo.surname,
            phone: newReservation.guestInfo.phone,
            email: newReservation.guestInfo.email || '',
            gender: 'Erkek',
            age: '30'
          }
        ],
        status: newReservation.status,
        paymentStatus: newReservation.paymentStatus,
        createdAt: new Date(),
        adminCreated: true
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      
      alert('Randevu başarıyla eklendi!');
      router.push('/admin/reservations');
    } catch (error: any) {
      console.error('Randevu ekleme hatası:', error);
      alert('Randevu eklenirken hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/reservations" className="text-blue-600 hover:text-blue-800">
                ← Randevu Yönetimi
              </Link>
              <h1 className="text-xl font-bold text-gray-900">➕ Randevu Ekle</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Tekne Seçimi */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
              🚢 Tekne Seçimi
            </h2>
            <p className="text-slate-600 mb-6 text-center">
              Lütfen önce bir tekne seçin
            </p>
            
            <div className="max-w-md mx-auto">
              <select
                value={newReservation.selectedBoat}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  selectedBoat: e.target.value,
                  selectedSeats: [],
                  selectedDate: '',
                  selectedTime: ''
                }))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white shadow-lg transition-all duration-300"
              >
                <option value="">Tekne seçin...</option>
                {boats.map(boat => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name} ({getBoatOrder(boat.id)})
                  </option>
                ))}
              </select>
              
              {newReservation.selectedBoat && (
                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-green-200 shadow-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">✅</span>
                    <span className="text-green-800 font-bold text-lg">
                      {boats.find(b => b.id === newReservation.selectedBoat)?.name} ({getBoatOrder(newReservation.selectedBoat)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {newReservation.selectedBoat && (
            <>
              {/* Kişi Sayısı */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
                  👥 Kişi Sayısı
                </h3>
                <div className="max-w-sm mx-auto">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newReservation.guestCount}
                    onChange={(e) => setNewReservation(prev => ({
                      ...prev,
                      guestCount: parseInt(e.target.value) || 1,
                      selectedSeats: []
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-center text-xl font-bold shadow-lg"
                  />
                </div>
              </div>

              {/* Responsive Layout: Takvim + Saat Seçimi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Sol Taraf: Takvim */}
                <div className="space-y-6">
                  {renderCalendar()}
                </div>

                {/* Sağ Taraf: Saat Seçimi */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">⏰ Saat Seçin</h3>
                    
                    {newReservation.selectedDate ? (
                      <div className="space-y-3">
                        {availableTimes.map(time => (
                          <button
                            key={time}
                            onClick={() => setNewReservation(prev => ({
                              ...prev,
                              selectedTime: time,
                              selectedSeats: []
                            }))}
                            className={`w-full p-4 rounded-xl border-2 font-bold transition-all duration-300 ${
                              newReservation.selectedTime === time
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 scale-105 shadow-lg'
                                : 'bg-white text-slate-800 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-500">
                        <span className="text-4xl mb-4 block">📅</span>
                        <p>Önce bir tarih seçin</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Koltuk Seçimi */}
              {newReservation.selectedDate && newReservation.selectedTime && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                    🪑 Koltuk Seçimi ({newReservation.selectedSeats.length}/{newReservation.guestCount})
                  </h3>
                  {renderSeatSelection()}
                </div>
              )}

              {/* Müşteri Bilgileri */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                  👤 Müşteri Bilgileri
                </h3>
                
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ad</label>
                      <input
                        type="text"
                        placeholder="Müşteri adı"
                        value={newReservation.guestInfo.name}
                        onChange={(e) => setNewReservation(prev => ({
                          ...prev,
                          guestInfo: {...prev.guestInfo, name: e.target.value}
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Soyad</label>
                      <input
                        type="text"
                        placeholder="Müşteri soyadı"
                        value={newReservation.guestInfo.surname}
                        onChange={(e) => setNewReservation(prev => ({
                          ...prev,
                          guestInfo: {...prev.guestInfo, surname: e.target.value}
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                      <input
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        value={newReservation.guestInfo.phone}
                        onChange={(e) => setNewReservation(prev => ({
                          ...prev,
                          guestInfo: {...prev.guestInfo, phone: e.target.value}
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">E-posta (opsiyonel)</label>
                      <input
                        type="email"
                        placeholder="ornek@email.com"
                        value={newReservation.guestInfo.email}
                        onChange={(e) => setNewReservation(prev => ({
                          ...prev,
                          guestInfo: {...prev.guestInfo, email: e.target.value}
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/admin/reservations"
                  className="px-8 py-4 text-slate-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 font-bold text-center border-2 border-gray-300 hover:border-gray-400"
                >
                  ← Geri Dön
                </Link>
                <button
                  onClick={addNewReservation}
                  disabled={adding || newReservation.selectedSeats.length !== newReservation.guestCount}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-300 font-bold border-2 border-green-500 hover:border-green-600 disabled:border-gray-400 disabled:cursor-not-allowed"
                >
                  {adding ? '🔄 Ekleniyor...' : '✅ Randevu Ekle'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AddReservationPage;
