'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface CustomTour {
  id: string;
  name: string;
  price: number;
  capacity: number;
  duration: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

interface NewReservation {
  tourType: string; // 'normal' | 'private' | 'fishing-swimming' | custom tour ID
  priceOption: 'own-equipment' | 'with-equipment';
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
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

export default function AddReservationPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  // Yerel tarih formatı için yardımcı fonksiyon
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
  
  const [newReservation, setNewReservation] = useState<NewReservation>({
    tourType: 'normal',
    priceOption: 'own-equipment',
    guestCount: 1,
    selectedDate: '',
    selectedTime: '',
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
  const iskeleSeat = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'];
  const sancakSeat = ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];

  // Randevu numarası oluşturma
  const generateReservationNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `RV-${year}${month}${day}-${timestamp}`;
  };

  // Firebase'den özel turları çek
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

  // Tarih doluluk hesaplama
  const calculateDateOccupancy = async () => {
    try {
      const reservationsRef = collection(db, 'reservations');
      const snapshot = await getDocs(reservationsRef);
      const occupancyData: {[key: string]: number} = {};
      const dateOccupancyData: {[key: string]: number} = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          const dateKey = `${data.selectedDate}-${data.selectedTime}`;
          const dateOnlyKey = data.selectedDate;
          
          occupancyData[dateKey] = (occupancyData[dateKey] || 0) + data.guestCount;
          dateOccupancyData[dateOnlyKey] = (dateOccupancyData[dateOnlyKey] || 0) + data.guestCount;
        }
      });
      
      setDateOccupancy(occupancyData);
      setOccupiedDates(dateOccupancyData);
    } catch (error: any) {
      console.error('Doluluk hesaplama hatası:', error);
    }
  };

  // Dolu koltukları getir
  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time) return;
    
    try {
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('selectedDate', '==', date),
        where('selectedTime', '==', time)
      );
      
      const snapshot = await getDocs(q);
      const occupied: string[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          occupied.push(...data.selectedSeats);
        }
      });
      
      setOccupiedSeats(occupied);
    } catch (error: any) {
      console.error('Dolu koltuk getirme hatası:', error);
    }
  };

  // Yardımcı fonksiyonlar
  const isSpecialTour = (type: string) => {
    return type === 'private' || type === 'fishing-swimming' || customTours.some(tour => tour.id === type);
  };

  const getSelectedCustomTour = (type: string) => {
    return customTours.find(tour => tour.id === type);
  };

  // Takvim fonksiyonları
  const getCalendarDays = (month: Date) => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - ((startOfMonth.getDay() + 6) % 7));
    
    const days = [];
    const currentDate = new Date(startOfCalendar);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month.getMonth();
      const isDisabled = currentDate < today;
      const dateString = formatLocalDate(currentDate);
      
      days.push({
        day: currentDate.getDate(),
        date: dateString,
        isCurrentMonth,
        isDisabled
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Tarih veya saat değiştiğinde dolu koltukları güncelle
  useEffect(() => {
    if (newReservation.selectedDate && newReservation.selectedTime) {
      fetchOccupiedSeats(newReservation.selectedDate, newReservation.selectedTime);
    }
  }, [newReservation.selectedDate, newReservation.selectedTime]);

  // Özel tur seçildiğinde otomatik ayarlamalar
  useEffect(() => {
    const isSpecial = isSpecialTour(newReservation.tourType);
    
    if (isSpecial) {
      const allSeats = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];
      const customTour = getSelectedCustomTour(newReservation.tourType);
      const capacity = customTour ? customTour.capacity : 12;
      
      setNewReservation(prev => ({
        ...prev,
        guestCount: capacity,
        selectedSeats: allSeats
      }));
    } else if (newReservation.tourType === 'normal') {
      // Normal tur seçildiğinde temizle
      setNewReservation(prev => ({
        ...prev,
        guestCount: 1,
        selectedSeats: []
      }));
    }
  }, [newReservation.tourType, customTours]); // Sadece tur tipi değişiminde çalışsın



  // Sayfa yüklendiğinde doluluk hesapla ve özel turları çek
  useEffect(() => {
    calculateDateOccupancy();
    fetchCustomTours();
  }, []);

  // Koltuk durumu
  const getSeatStatus = (seat: string): 'available' | 'occupied' | 'selected' => {
    if (occupiedSeats.includes(seat)) return 'occupied';
    if (newReservation.selectedSeats.includes(seat)) return 'selected';
    return 'available';
  };

  // Koltuk rengi (ana sayfadaki gibi)
  const getSeatColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 border-blue-500';
      case 'occupied': return 'bg-red-500 border-red-600 cursor-not-allowed';
      case 'selected': return 'bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 border-green-500';
      default: return 'bg-gray-400 border-gray-500';
    }
  };

  // Koltuk seçimi
  const handleSeatSelection = (seatId: string) => {
    const status = getSeatStatus(seatId);
    if (status === 'occupied') return;

    // Özel turlar için koltuk seçimini engelle
    if (isSpecialTour(newReservation.tourType)) {
      return; // Sessizce geç, popup çıkarma
    }

    if (status === 'selected') {
      // Koltuk seçiliyse kaldır
      setNewReservation(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.filter(s => s !== seatId)
      }));
    } else {
      // Koltuk seçili değilse ekle (kişi sayısı kadar)
      if (newReservation.selectedSeats.length < newReservation.guestCount) {
        setNewReservation(prev => ({
          ...prev,
          selectedSeats: [...prev.selectedSeats, seatId]
        }));
      } else {
        alert('Kişi sayısından fazla koltuk seçemezsiniz!');
      }
    }
  };

  // Koltuk render (ana sayfadaki gibi)
  const renderSeat = (seatId: string) => {
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = newReservation.selectedSeats.includes(seatId);
    const canSelect = !isOccupied && (!isSelected && newReservation.selectedSeats.length < newReservation.guestCount || isSelected);
    
    return (
      <button
        key={seatId}
        onClick={() => handleSeatSelection(seatId)}
        disabled={isOccupied || isSpecialTour(newReservation.tourType)}
        className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg border-2 ${getSeatColor(getSeatStatus(seatId))} ${
          (!canSelect && !isOccupied && !isSelected) || isSpecialTour(newReservation.tourType) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          isSpecialTour(newReservation.tourType)
            ? 'Özel tur - tüm koltuklar otomatik seçilmiştir'
            : isOccupied 
            ? 'Bu koltuk dolu' 
            : isSelected 
            ? 'Seçimi kaldırmak için tıklayın'
            : newReservation.selectedSeats.length >= newReservation.guestCount
            ? `Maksimum ${newReservation.guestCount} koltuk seçebilirsiniz`
            : 'Koltuğu seçmek için tıklayın'
        }
      >
        <div className="relative">
          <span className="relative z-10">{seatId.slice(-1)}</span>
          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-black/30 rounded-full"></div>
        </div>
      </button>
    );
  };

  // Randevu ekleme
  const addNewReservation = async () => {
    // Validasyon
    if (!newReservation.selectedDate || !newReservation.selectedTime) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }
    
    // Özel turlar için koltuk kontrolü farklı
    if (isSpecialTour(newReservation.tourType)) {
      // Özel turlarda tüm koltuklar otomatik seçili olmalı
      const expectedSeats = iskeleSeat.concat(sancakSeat);
      if (newReservation.selectedSeats.length !== expectedSeats.length) {
        alert('Özel tur için tüm koltuklar seçilmelidir');
        return;
      }
    } else {
      // Normal turda kişi sayısı kadar koltuk seçili olmalı
      if (newReservation.selectedSeats.length !== newReservation.guestCount) {
        alert('Lütfen kişi sayısı kadar koltuk seçin');
        return;
      }
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
      const isSpecial = isSpecialTour(newReservation.tourType);
      const customTour = getSelectedCustomTour(newReservation.tourType);
      const capacity = customTour ? customTour.capacity : 12;
      
      const reservationData = {
        reservationNumber: generateReservationNumber(),
        guestCount: isSpecial ? capacity : newReservation.guestCount,
        selectedDate: newReservation.selectedDate,
        selectedTime: newReservation.selectedTime,
        selectedSeats: newReservation.selectedSeats,
        isPrivateTour: isSpecial,
        tourType: newReservation.tourType,
        priceOption: newReservation.priceOption,
        guestInfos: [
          {
            name: newReservation.guestInfo.name,
            surname: newReservation.guestInfo.surname,
            phone: newReservation.guestInfo.phone,
            email: newReservation.guestInfo.email || '',
            gender: 'Erkek', // Varsayılan
            age: '30' // Varsayılan
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
      {/* Header */}
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* Tur Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tur Tipi
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Standart Turlar */}
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'normal'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'normal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Normal Tur
                </button>
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'private'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'private'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ⭐ Özel Tur
                </button>
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'fishing-swimming'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'fishing-swimming'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🏊‍♂️ Balık + Yüzme
                </button>
                
                {/* Özel (Custom) Turlar */}
                {customTours.map((customTour, index) => {
                  const colorSchemes = [
                    { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🌟' },
                    { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', icon: '🎯' },
                    { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: '⚡' },
                    { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🚀' },
                    { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', icon: '💎' }
                  ];
                  
                  const scheme = colorSchemes[index % colorSchemes.length];
                  const isSelected = newReservation.tourType === customTour.id;
                  
                  return (
                    <button
                      key={customTour.id}
                      onClick={() => setNewReservation(prev => ({...prev, tourType: customTour.id}))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? `${scheme.border} ${scheme.bg} ${scheme.text}`
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title={`${customTour.name} - ${customTour.capacity} kişi - ${customTour.duration}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{scheme.icon}</span>
                        <span className="font-medium">{customTour.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {customTour.capacity} kişi • {customTour.duration}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Tur Yoksa Bilgilendirme */}
              {customTours.length === 0 && (
                <div className="mt-2 text-sm text-gray-500 italic">
                  💡 Özel turlar Admin → Ayarlar bölümünden eklenebilir
                </div>
              )}
            </div>

            {/* Malzeme Seçeneği */}
            {newReservation.tourType === 'normal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Malzeme Seçeneği
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewReservation(prev => ({...prev, priceOption: 'own-equipment'}))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      newReservation.priceOption === 'own-equipment'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Kendi Malzemesi
                  </button>
                  <button
                    onClick={() => setNewReservation(prev => ({...prev, priceOption: 'with-equipment'}))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      newReservation.priceOption === 'with-equipment'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Malzeme Dahil
                  </button>
                </div>
              </div>
            )}

            {/* Kişi Sayısı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kişi Sayısı
                {isSpecialTour(newReservation.tourType) && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Özel turlar için otomatik {getSelectedCustomTour(newReservation.tourType)?.capacity || 12})
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max={getSelectedCustomTour(newReservation.tourType)?.capacity || 12}
                value={newReservation.guestCount}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  guestCount: parseInt(e.target.value) || 1,
                  selectedSeats: [] // Kişi sayısı değiştiğinde seçilen koltukları temizle
                }))}
                disabled={isSpecialTour(newReservation.tourType)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  isSpecialTour(newReservation.tourType)
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : ''
                }`}
              />
            </div>

            {/* Tarih Seçimi - Özel Takvim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih Seçimi (Doluluk Oranları ile)
              </label>
              <div className="bg-white rounded-lg border border-gray-300 p-3 sm:p-4">
                {/* Takvim Başlığı */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300 touch-manipulation"
                  >
                    <span className="text-blue-600 font-bold text-sm sm:text-base">‹</span>
                  </button>
                  
                  <h4 className="text-sm sm:text-lg font-bold text-gray-800">
                    {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </h4>
                  
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300 touch-manipulation"
                  >
                    <span className="text-blue-600 font-bold text-sm sm:text-base">›</span>
                  </button>
                </div>

                {/* Hafta Günleri */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                    <div key={day} className="text-center py-1 sm:py-2">
                      <span className="text-xs font-bold text-gray-600">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Takvim Günleri */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays(currentMonth).map((dayInfo, index) => {
                    const occupiedCount = occupiedDates[dayInfo.date] || 0;
                    const isSelected = newReservation.selectedDate === dayInfo.date;
                    const isFullyOccupied = occupiedCount >= 24;
                    const isPartiallyOccupied = occupiedCount > 0 && occupiedCount < 24;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!dayInfo.isDisabled && !isFullyOccupied) {
                            // Özel tur seçiliyse ve o günde herhangi bir rezervasyon varsa engelle
                            if (isSpecialTour(newReservation.tourType) && occupiedCount > 0) {
                              const customTour = getSelectedCustomTour(newReservation.tourType);
                              const tourName = customTour ? customTour.name : 
                                             newReservation.tourType === 'fishing-swimming' ? 'Balık + Yüzme Turu' : 
                                             'Özel Tur';
                              
                              alert(`❌ ${dayInfo.day} ${currentMonth.toLocaleDateString('tr-TR', { month: 'long' })} tarihinde ${tourName} seçilemez!\n\n` +
                                    `Bu tarihte ${occupiedCount} koltuk dolu olduğu için özel tur seçimi yapılamaz.\n` +
                                    `Özel turlar için tamamen boş günler gereklidir.\n\n` +
                                    `Lütfen başka bir tarih seçin veya Normal Tur seçeneğini tercih edin.`);
                              return;
                            }
                            
                            setNewReservation(prev => ({
                              ...prev,
                              selectedDate: dayInfo.date,
                              selectedSeats: []
                            }));
                          }
                        }}
                        disabled={dayInfo.isDisabled || isFullyOccupied || (isSpecialTour(newReservation.tourType) && occupiedCount > 0)}
                        className={`aspect-square rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative touch-manipulation ${
                          dayInfo.isDisabled 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : isSelected
                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110 shadow-lg'
                            : isFullyOccupied && dayInfo.isCurrentMonth
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white cursor-not-allowed opacity-75'
                            : (isSpecialTour(newReservation.tourType) && occupiedCount > 0 && dayInfo.isCurrentMonth)
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white cursor-not-allowed opacity-75'
                            : isPartiallyOccupied && dayInfo.isCurrentMonth
                            ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 hover:scale-105 shadow-md'
                            : dayInfo.isCurrentMonth
                            ? 'text-gray-700 hover:bg-blue-100 hover:scale-105'
                            : 'text-gray-400'
                        }`}
                        title={
                          dayInfo.isDisabled
                            ? 'Geçmiş tarih'
                            : isFullyOccupied && dayInfo.isCurrentMonth
                            ? `Tamamen dolu (${occupiedCount} koltuk) - Seçilemez`
                            : (isSpecialTour(newReservation.tourType) && occupiedCount > 0 && dayInfo.isCurrentMonth)
                            ? `Özel tur için seçilemez (${occupiedCount} koltuk dolu) - Özel turlar tamamen boş gün gerektirir`
                            : isPartiallyOccupied && dayInfo.isCurrentMonth
                            ? `Kısmen dolu (${occupiedCount} koltuk) - Normal tur için müsait`
                            : dayInfo.isCurrentMonth
                            ? 'Tamamen boş - Tarih seçmek için tıklayın'
                            : ''
                        }
                      >
                        {dayInfo.day}
                        {/* Dolu günler için küçük nokta ve sayı */}
                        {occupiedCount > 0 && dayInfo.isCurrentMonth && !isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600" style={{fontSize: '6px'}}>
                              {occupiedCount}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Takvim Renk Açıklaması */}
                <div className="grid grid-cols-2 sm:flex sm:justify-center gap-1.5 sm:gap-2 text-xs mt-3 sm:mt-4">
                  <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-green-200">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
                    <span className="font-bold text-gray-800 text-xs">Seçili</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-red-200">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-sm"></div>
                    <span className="font-bold text-gray-800 text-xs">Dolu</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-orange-200">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded shadow-sm"></div>
                    <span className="font-bold text-gray-800 text-xs">Kısmi</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-blue-200">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded shadow-sm"></div>
                    <span className="font-bold text-gray-800 text-xs">Boş</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Saat Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saat
              </label>
              
              <select
                value={newReservation.selectedTime}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  selectedTime: e.target.value,
                  selectedSeats: [] // Saat değiştiğinde seçilen koltukları temizle
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Saat seçin</option>
                {availableTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Koltuk Seçimi */}
            {newReservation.selectedDate && newReservation.selectedTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koltuk Seçimi ({newReservation.selectedSeats.length}/{newReservation.guestCount})
                </label>
                
                {isSpecialTour(newReservation.tourType) && (
                  (() => {
                    const customTour = getSelectedCustomTour(newReservation.tourType);
                    
                    let bgColor = 'bg-purple-50 border border-purple-200';
                    let textColor = 'text-purple-600';
                    let headerColor = 'text-purple-800';
                    let detailColor = 'text-purple-700';
                    let icon = '⭐';
                    let title = 'Özel Tur';
                    let capacity = 12;
                    
                    if (newReservation.tourType === 'fishing-swimming') {
                      bgColor = 'bg-cyan-50 border border-cyan-200';
                      textColor = 'text-cyan-600';
                      headerColor = 'text-cyan-800';
                      detailColor = 'text-cyan-700';
                      icon = '🏊‍♂️';
                      title = 'Balık + Yüzme Turu';
                    } else if (customTour) {
                      const colorSchemes = [
                        { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-600', header: 'text-emerald-800', detail: 'text-emerald-700', icon: '🌟' },
                        { bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-600', header: 'text-rose-800', detail: 'text-rose-700', icon: '🎯' },
                        { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-600', header: 'text-amber-800', detail: 'text-amber-700', icon: '⚡' },
                        { bg: 'bg-indigo-50 border border-indigo-200', text: 'text-indigo-600', header: 'text-indigo-800', detail: 'text-indigo-700', icon: '🚀' },
                        { bg: 'bg-pink-50 border border-pink-200', text: 'text-pink-600', header: 'text-pink-800', detail: 'text-pink-700', icon: '💎' }
                      ];
                      
                      const scheme = colorSchemes[customTours.findIndex(tour => tour.id === newReservation.tourType) % colorSchemes.length];
                      bgColor = scheme.bg;
                      textColor = scheme.text;
                      headerColor = scheme.header;
                      detailColor = scheme.detail;
                      icon = scheme.icon;
                      title = customTour.name;
                      capacity = customTour.capacity;
                    }
                    
                    return (
                      <div className={`mb-4 p-4 rounded-lg ${bgColor}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-2xl ${textColor}`}>
                            {icon}
                          </span>
                          <h4 className={`font-bold ${headerColor}`}>
                            {title} - Tüm Koltuklar Otomatik Seçildi
                          </h4>
                        </div>
                        <p className={`text-sm ${detailColor}`}>
                          ✅ {capacity} koltuk otomatik olarak seçilmiştir (IS1-IS6, SA1-SA6)
                        </p>
                      </div>
                    );
                  })()
                )}
                
                {/* Tekne Krokisi */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-lg p-6">
                  <div className="relative max-w-xs mx-auto">
                    {/* BAŞ - Üçgen Kısım */}
                    <div className="relative">
                      <div className="text-center mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 bg-white/95 px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-xl border border-slate-300">⚓ BAŞ</span>
                      </div>
                      
                      <div 
                        className="relative mx-auto w-28 h-16 sm:w-32 sm:h-20 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-2 border-slate-400"
                        style={{
                          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                        }}
                      >
                        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                          <div className="bg-white/90 p-1 sm:p-1.5 rounded-full shadow-lg border border-slate-300">
                            <span className="text-sm sm:text-lg">⚓</span>
                          </div>
                          <div className="bg-white/90 p-1 sm:p-1.5 rounded-full shadow-lg border border-slate-300">
                            <span className="text-xs sm:text-sm">🚽</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ANA GÖVDE - Dikdörtgen Kısım */}
                    <div className="relative bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 w-28 sm:w-32 mx-auto shadow-2xl rounded-b-2xl border-2 border-slate-400 border-t-0">
                      {/* İskele (Sol) Label */}
                      <div className="absolute -left-12 sm:-left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
                        <span className="text-xs font-bold text-black bg-white/95 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xl border border-blue-600">🌊 İSKELE</span>
                      </div>
                      
                      {/* Sancak (Sağ) Label */}
                      <div className="absolute -right-12 sm:-right-16 top-1/2 transform -translate-y-1/2 rotate-90">
                        <span className="text-xs font-bold text-slate-800 bg-white/95 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xl border border-slate-300">🌊 SANCAK</span>
                      </div>

                      {/* Koltuk Düzeni */}
                      <div className="flex justify-between p-2 sm:p-3">
                        {/* İskele Koltukları (Sol) */}
                        <div className="flex flex-col space-y-1.5 sm:space-y-2">
                          {iskeleSeat.map(seatId => renderSeat(seatId))}
                        </div>

                        {/* Orta Koridor */}
                        <div className="w-4 sm:w-6 bg-gradient-to-b from-slate-400 via-slate-450 to-slate-500 rounded-lg shadow-inner border border-slate-500">
                          <div className="space-y-1 pt-2 sm:pt-3">
                            <div className="w-2 sm:w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                            <div className="w-1.5 sm:w-2 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                            <div className="w-2 sm:w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                          </div>
                        </div>

                        {/* Sancak Koltukları (Sağ) */}
                        <div className="flex flex-col space-y-1.5 sm:space-y-2">
                          {sancakSeat.map(seatId => renderSeat(seatId))}
                        </div>
                      </div>
                    </div>

                    {/* KIÇ */}
                    <div className="text-center mt-2 sm:mt-3">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 bg-white/95 px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-xl border border-slate-300">🚤 KIÇ</span>
                    </div>
                  </div>

                  {/* Koltuk Durumu Açıklamaları */}
                  <div className="grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:space-x-2 text-xs mt-4">
                    <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-blue-200">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded shadow-sm"></div>
                      <span className="font-bold text-slate-800 text-xs">Boş</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-green-200">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
                      <span className="font-bold text-slate-800 text-xs">Seçili</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-red-200">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded shadow-sm"></div>
                      <span className="font-bold text-slate-800 text-xs">Dolu</span>
                    </div>
                  </div>

                  {/* Seçili Koltuklar */}
                  {newReservation.selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200 shadow-lg">
                      <p className="text-green-800 font-bold text-center text-xs sm:text-sm mb-2">
                        ✅ Seçili Koltuklar ({newReservation.selectedSeats.length}/{isSpecialTour(newReservation.tourType) ? 12 : newReservation.guestCount})
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                        {newReservation.selectedSeats.map((seat) => (
                          <span key={seat} className="bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold">
                            {seat}
                          </span>
                        ))}
                      </div>
                      {newReservation.tourType === 'normal' && newReservation.selectedSeats.length < newReservation.guestCount && (
                        <p className="text-green-700 text-xs text-center mt-2">
                          {newReservation.guestCount - newReservation.selectedSeats.length} koltuk daha seçin
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Müşteri Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Bilgileri
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Ad"
                  value={newReservation.guestInfo.name}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, name: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="text"
                  placeholder="Soyad"
                  value={newReservation.guestInfo.surname}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, surname: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  value={newReservation.guestInfo.phone}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, phone: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="email"
                  placeholder="E-posta (opsiyonel)"
                  value={newReservation.guestInfo.email}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, email: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Durum Seçimi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rezervasyon Durumu
                </label>
                <select
                  value={newReservation.status}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    status: e.target.value as 'pending' | 'confirmed'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="confirmed">Onaylı</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Durumu
                </label>
                <select
                  value={newReservation.paymentStatus}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    paymentStatus: e.target.value as 'waiting' | 'received' | 'confirmed'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="waiting">Bekliyor</option>
                  <option value="received">Alındı</option>
                  <option value="confirmed">Onaylandı</option>
                </select>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/reservations"
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </Link>
              <button
                onClick={addNewReservation}
                disabled={adding}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {adding ? 'Ekleniyor...' : 'Randevu Ekle'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 