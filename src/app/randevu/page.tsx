'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export default function RandevuPage() {
  // Adım takibi
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Form verileri
  const [tourType, setTourType] = useState<'normal' | 'private' | 'fishing-swimming'>('normal'); // normal, özel tur veya balık+yüzme
  const [priceOption, setPriceOption] = useState<'own-equipment' | 'with-equipment'>('own-equipment');
  const [prices, setPrices] = useState({
    normalOwn: 850,
    normalWithEquipment: 1000,
    privateTour: 12000,
    fishingSwimming: 15000
  });
  const [guestCount, setGuestCount] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    surname: '',
    phone: '',
    email: ''
  });
  
  // Sistem verileri
  const [availableTimes, setAvailableTimes] = useState<string[]>(['07:00-13:00', '14:00-20:00']);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [occupiedDates, setOccupiedDates] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Firebase'den fiyatları çek
  const fetchPrices = async () => {
    try {
      const pricesDoc = await getDoc(doc(db, 'settings', 'prices'));
      if (pricesDoc.exists()) {
        const data = pricesDoc.data();
        setPrices({
          normalOwn: data.normalOwn || 850,
          normalWithEquipment: data.normalWithEquipment || 1000,
          privateTour: data.privateTour || 12000,
          fishingSwimming: data.fishingSwimming || 15000
        });
      }
    } catch (error) {
      console.error('Fiyatlar çekilemedi:', error);
    }
  };

  // Firebase'den saatleri ve fiyatları çek
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      try {
        const timesDoc = await getDoc(doc(db, 'settings', 'availableTimes'));
        if (timesDoc.exists()) {
          const data = timesDoc.data();
          if (data.times && Array.isArray(data.times)) {
            setAvailableTimes(data.times);
          }
        }
      } catch (error) {
        console.error('Saatler çekilemedi:', error);
      }
    };
    
    fetchAvailableTimes();
    fetchPrices(); // Fiyatları da çek

    // Fiyatları real-time dinle
    const unsubscribePrices = onSnapshot(doc(db, 'settings', 'prices'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const newPrices = {
          normalOwn: data.normalOwn || 850,
          normalWithEquipment: data.normalWithEquipment || 1000,
          privateTour: data.privateTour || 12000,
          fishingSwimming: data.fishingSwimming || 15000
        };
        setPrices(newPrices);
        console.log('Fiyatlar güncellendi:', newPrices);
      }
    });

    return () => {
      unsubscribePrices();
    };
  }, []);

  // Ayın dolu günlerini çek
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
        
        const q = query(
          collection(db, 'reservations'),
          where('selectedDate', '>=', firstDay),
          where('selectedDate', '<=', lastDay),
          where('status', '==', 'confirmed')
        );
        
        const querySnapshot = await getDocs(q);
        const dateOccupancy: {[key: string]: number} = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.selectedDate) {
            let occupiedCount = 0;
            
            if (data.isPrivateTour) {
              // Özel tur = 12 koltuk dolu
              occupiedCount = 12;
            } else if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
              // Normal tur = seçili koltuk sayısı kadar dolu
              occupiedCount = data.selectedSeats.length;
            }
            
            // Eğer o tarih zaten varsa, koltuk sayısını ekle
            if (dateOccupancy[data.selectedDate]) {
              dateOccupancy[data.selectedDate] += occupiedCount;
            } else {
              dateOccupancy[data.selectedDate] = occupiedCount;
            }
            
            // Maksimum 12 koltuk olabilir
            if (dateOccupancy[data.selectedDate] > 12) {
              dateOccupancy[data.selectedDate] = 12;
            }
          }
        });
        
        setOccupiedDates(dateOccupancy);
      } catch (error) {
        console.error('Dolu günler çekilemedi:', error);
      }
    };
    
    fetchOccupiedDates();
  }, [currentMonth]);

  // Takvim işlevleri
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    const today = new Date();
    // Bugünün tarih string formatı (yerel saat dilimi)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Önceki ayın günleri
    const prevMonth = new Date(year, monthIndex - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const prevYear = monthIndex === 0 ? year - 1 : year;
      const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
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
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isDisabled: dateStr < todayStr
      });
    }
    
    // Sonraki ayın günleri
    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
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

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  // Tekne koltuk düzeni
  const iskeleSeat = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'];
  const sancakSeat = ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];

  // Koltuk durumu kontrolü
  const getSeatStatus = (seat: string) => {
    if (occupiedSeats.includes(seat)) return 'occupied';
    if (selectedSeats.includes(seat)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-gradient-to-br from-red-500 to-red-600 border-red-600 cursor-not-allowed';
      case 'selected': return 'bg-gradient-to-br from-green-400 to-green-600 border-green-600 shadow-xl scale-110';
      case 'available': return 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-110 shadow-lg hover:shadow-xl';
      default: return 'bg-gray-300 border-gray-400';
    }
  };

  // Koltuk render fonksiyonu
  const renderSeat = (seatId: string) => {
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    const canSelect = !isOccupied && (!isSelected && selectedSeats.length < guestCount || isSelected);
    
    return (
      <button
        key={seatId}
        onClick={() => {
          if (tourType === 'private' || tourType === 'fishing-swimming') return; // Özel/Balık+yüzme turda koltuk seçimi yok
          
          if (!isOccupied) {
            if (isSelected) {
              // Koltuk seçimini kaldır
              setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
            } else if (selectedSeats.length < guestCount) {
              // Yeni koltuk ekle
              setSelectedSeats([...selectedSeats, seatId]);
            }
          }
        }}
        disabled={isOccupied || tourType === 'private' || tourType === 'fishing-swimming'}
        className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg border-2 ${getSeatColor(getSeatStatus(seatId))} ${
          (!canSelect && !isOccupied && !isSelected) || (tourType === 'private' || tourType === 'fishing-swimming') ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          (tourType === 'private' || tourType === 'fishing-swimming')
            ? `${tourType === 'fishing-swimming' ? 'Balık+yüzme' : 'Özel'} turda tüm koltuklar otomatik seçilmiştir`
            : isOccupied 
            ? 'Bu koltuk dolu' 
            : isSelected 
            ? 'Seçimi kaldırmak için tıklayın'
            : selectedSeats.length >= guestCount
            ? `Maksimum ${guestCount} koltuk seçebilirsiniz`
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

  // Dolu koltukları çek
  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time) return;
    
    try {
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', date),
        where('selectedTime', '==', time),
        where('status', '==', 'confirmed')
      );
      
      const querySnapshot = await getDocs(q);
      const occupied: string[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
          occupied.push(...data.selectedSeats);
        }
        
        if (data.isPrivateTour) {
          const allSeats = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];
          allSeats.forEach(seat => {
            if (!occupied.includes(seat)) {
              occupied.push(seat);
            }
          });
        }
      });
      
      setOccupiedSeats(occupied);
    } catch (error) {
      console.error('Dolu koltuklar çekilemedi:', error);
    }
  };

  // Tarih ve saat seçildiğinde dolu koltukları çek ve real-time dinle
  useEffect(() => {
    if (selectedDate && selectedTime && tourType === 'normal') {
      fetchOccupiedSeats(selectedDate, selectedTime);

      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', selectedDate),
        where('selectedTime', '==', selectedTime),
        where('status', '==', 'confirmed')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const occupied: string[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            occupied.push(...data.selectedSeats);
          }
          
          if (data.isPrivateTour) {
            const allSeats = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];
            allSeats.forEach(seat => {
              if (!occupied.includes(seat)) {
                occupied.push(seat);
              }
            });
          }
        });
        
        setOccupiedSeats(occupied);
      });

      return () => unsubscribe();
    } else {
      setOccupiedSeats([]);
      // Özel tur için koltukları sıfırlamayalım
      if (tourType === 'normal') {
        setSelectedSeats([]);
      }
    }
  }, [selectedDate, selectedTime, tourType]);

  // Özel tur veya balık+yüzme turu seçildiğinde tüm koltukları seç
  useEffect(() => {
    if (tourType === 'private' || tourType === 'fishing-swimming') {
      setSelectedSeats([...iskeleSeat, ...sancakSeat]);
    } else {
      setSelectedSeats([]);
    }
  }, [tourType]);

  // Özel tur veya balık+yüzme turu için tarih seçildiğinde de koltukları seç
  useEffect(() => {
    if ((tourType === 'private' || tourType === 'fishing-swimming') && selectedDate) {
      setSelectedSeats([...iskeleSeat, ...sancakSeat]);
    }
  }, [selectedDate, tourType]);

  // Rezervasyon kaydetme
  const saveReservation = async () => {
    setLoading(true);
    try {
      const isSpecialTour = tourType === 'private' || tourType === 'fishing-swimming';
      
      // Rezervasyon numarası üretme
      const generateReservationNumber = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 9000) + 1000;
        return `RV-${year}${month}${day}-${random}`;
      };
      
      // Fiyat hesaplama
      let selectedPrice = 0;
      let priceDetails = '';
      
      if (tourType === 'normal') {
        if (priceOption === 'own-equipment') {
          selectedPrice = prices.normalOwn;
          priceDetails = 'Normal Tur - Kendi Ekipmanı';
        } else {
          selectedPrice = prices.normalWithEquipment;
          priceDetails = 'Normal Tur - Ekipman Dahil';
        }
      } else if (tourType === 'private') {
        selectedPrice = prices.privateTour;
        priceDetails = 'Kapalı Tur (Özel) - Tüm Tekne';
      } else if (tourType === 'fishing-swimming') {
        selectedPrice = prices.fishingSwimming;
        priceDetails = 'Balık + Yüzme Turu - 6 Saat';
      }
      
      const reservationData = {
        tourType,
        reservationNumber: generateReservationNumber(),
        guestCount: isSpecialTour ? 12 : guestCount,
        selectedDate,
        selectedTime: isSpecialTour ? 
          (tourType === 'fishing-swimming' ? '6 saat özel tur' : '07:00-20:00') : 
          selectedTime,
        isPrivateTour: isSpecialTour,
        selectedSeats: selectedSeats,
        guestInfos: [guestInfo],
        status: 'pending',
        paymentStatus: 'waiting',
        priceOption: tourType === 'normal' ? priceOption : 'with-equipment',
        selectedPrice: selectedPrice,
        priceDetails: priceDetails,
        totalAmount: isSpecialTour ? selectedPrice : selectedPrice * guestCount,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      setCurrentStep(5); // Başarı sayfası
    } catch (error) {
      console.error('Rezervasyon kaydedilemedi:', error);
      alert('Rezervasyon sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = getCalendarDays(currentMonth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4 sm:mb-6 text-blue-100 hover:text-white transition-colors text-sm sm:text-base">
            ← Ana Sayfaya Dön
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">🎣 Randevu Al</h1>
          <p className="text-base sm:text-xl text-blue-100">
            Basit adımlarla rezervasyon yapın
          </p>
        </div>
      </div>

      {/* Adım İndikatörü */}
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center mb-4 sm:mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                currentStep >= step 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-8 sm:w-16 h-1 ${
                  currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form İçeriği */}
        <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border border-blue-200">

          {/* Adım 1: Tur Tipi ve Fiyat Seçimi */}
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-4">
                Hangi türde bir tur istiyorsunuz?
              </h2>
              <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Fiyat seçeneklerimizi inceleyin ve size uygun olanı seçin
              </p>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-6xl mx-auto">
                
                {/* Normal Tur - Kendi Ekipmanı */}
                <div 
                  onClick={() => {
                    setTourType('normal');
                    setPriceOption('own-equipment');
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'normal' && priceOption === 'own-equipment'
                      ? 'border-green-500 bg-green-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🎣</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Normal Tur - Kendi Ekipmanı</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Kendi oltanızla diğer misafirlerle birlikte katılım
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 1-12 kişi arası • Koltuk bazlı rezervasyon • 07:00-13:00 veya 14:00-20:00
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{prices.normalOwn.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">kişi başı</div>
                    </div>
                  </div>
                </div>

                {/* Normal Tur - Ekipman Dahil */}
                <div 
                  onClick={() => {
                    setTourType('normal');
                    setPriceOption('with-equipment');
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'normal' && priceOption === 'with-equipment'
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🐟</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Normal Tur - Ekipman Dahil</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Olta ve ilk takım Balık Sefası tarafından sağlanır
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 1-12 kişi arası • Kaliteli olta, ip, yem dahil • 07:00-13:00 veya 14:00-20:00
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{prices.normalWithEquipment.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">kişi başı</div>
                      <div className="text-xs text-blue-600 font-medium">+{(prices.normalWithEquipment - prices.normalOwn).toLocaleString('tr-TR')} TL ekipman</div>
                    </div>
                  </div>
                </div>

                {/* Özel Tur */}
                <div 
                  onClick={() => setTourType('private')}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'private'
                      ? 'border-purple-500 bg-purple-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">⭐</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Kapalı Tur (Özel)</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Tüm tekne sadece sizin grubunuz için - 12 olta ve takım dahil
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 12 kişiye kadar • Tüm tekne kiralama • Gün boyu (07:00-20:00)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600">{prices.privateTour.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">grup fiyatı</div>
                      <div className="text-xs text-purple-600 font-medium">tüm ekipman dahil</div>
                    </div>
                  </div>
                </div>

                {/* Balık + Yüzme Turu */}
                <div 
                  onClick={() => setTourType('fishing-swimming')}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'fishing-swimming'
                      ? 'border-cyan-500 bg-cyan-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🏊‍♂️</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Balık + Yüzme Turu</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          6 saat - İlk balık avı ardından yüzme keyfi (Özel tur)
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 12 kişiye kadar • Tüm ekipman dahil • Yüzme molası • 6 saat süre
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-cyan-600">{prices.fishingSwimming.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">grup fiyatı</div>
                      <div className="text-xs text-cyan-600 font-medium">balık + yüzme</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yaş Ücretlendirmesi Bilgisi */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h4 className="font-bold text-yellow-800 mb-2">👶 Çocuk Ücretlendirmesi</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• <strong>0-3 yaş:</strong> Ücretsiz (kucakta)</p>
                  <p>• <strong>3-6 yaş:</strong> Yarım ücret (koltuk gerekli)</p>
                  <p>• <strong>6 yaş üstü:</strong> Tam ücret</p>
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Tüm çocuklara güvenlik nedeniyle koltuk verilmek zorundadır
                  </p>
                </div>
              </div>

              {/* İkinci Tekne Bilgilendirmesi */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">🚤 İkinci Teknemiz</h4>
                <div className="text-sm text-blue-700">
                  <p>📱 <strong>Seçtiğiniz tarih doluysa ikinci teknemiz için bize WhatsApp üzerinden ulaşın.</strong></p>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Aynı kapasitede ikinci teknemizle size alternatif saatler sunabiliriz
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!tourType}
                className={`mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg w-full sm:w-auto ${
                  tourType 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* Adım 2: Kişi Sayısı (Sadece Normal Tur İçin) */}
          {currentStep === 2 && (
            <div className="text-center">
              {tourType === 'normal' ? (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Kaç kişi katılacaksınız?
                  </h2>
                  
                  <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-6 sm:mb-8">
                    <button
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full font-bold text-lg sm:text-xl hover:bg-red-600 transition-all duration-300 touch-manipulation"
                    >
                      -
                    </button>
                    
                    <div className="bg-blue-50 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-blue-200">
                      <span className="text-2xl sm:text-4xl font-bold text-slate-800">{guestCount}</span>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1">kişi</p>
                    </div>
                    
                    <button
                      onClick={() => setGuestCount(Math.min(12, guestCount + 1))}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 text-white rounded-full font-bold text-lg sm:text-xl hover:bg-green-600 transition-all duration-300 touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                  
                  <p className="text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">
                    Maksimum 12 kişi katılabilir
                  </p>
                </>
              ) : tourType === 'private' ? (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Kapalı Tur (Özel) Seçtiniz
                  </h2>
                  
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">⭐</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-purple-800 mb-2 sm:mb-4">Tüm Tekne Sizin!</h3>
                    <div className="text-purple-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                      <p>✅ 12 kişiye kadar katılım</p>
                      <p>✅ Gün boyu kullanım (07:00-20:00)</p>
                      <p>✅ 12 olta ve takım dahil</p>
                      <p>✅ Özel hizmet</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Balık + Yüzme Turu Seçtiniz
                  </h2>
                  
                  <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🏊‍♂️</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-cyan-800 mb-2 sm:mb-4">Balık Avı + Yüzme Keyfi!</h3>
                    <div className="text-cyan-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                      <p>✅ 12 kişiye kadar katılım</p>
                      <p>✅ 6 saat özel tur</p>
                      <p>✅ Balık avı + yüzme molası</p>
                      <p>✅ Tüm ekipmanlar dahil</p>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 touch-manipulation"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

                    {/* Adım 3: Tarih ve Saat Seçimi */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6 text-center">
                Tarih {tourType === 'normal' ? 've Saat' : ''} Seçin
              </h2>
              
              {/* Seçim Özeti */}
              {selectedDate && ((tourType === 'private' || tourType === 'fishing-swimming') || selectedTime) && (
                <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                  <h4 className="font-bold text-green-800 mb-2 text-sm sm:text-base">✅ Seçimleriniz</h4>
                  <p className="text-green-700 text-xs sm:text-sm">
                    📅 {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </p>
                                      <p className="text-green-700 text-xs sm:text-sm">
                      🕐 {(tourType === 'private' || tourType === 'fishing-swimming') ? 
                           (tourType === 'fishing-swimming' ? '6 Saat Özel Tur' : 'Gün Boyu (07:00-20:00)') : 
                           selectedTime}
                    </p>
                    <p className="text-green-700 text-xs sm:text-sm">
                      👥 {(tourType === 'private' || tourType === 'fishing-swimming') ? 
                           `12 kişi (${tourType === 'fishing-swimming' ? 'Balık+Yüzme' : 'Özel'} Tur)` : 
                           `${guestCount} kişi`}
                    </p>
                </div>
              )}

              {/* Responsive Layout: Takvim + Koltuk Seçimi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-6">
                
                {/* Sol Taraf: Takvim ve Saat Seçimi */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Takvim */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                    <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">📅 Tarih Seçin</h3>
                    
                    {/* Takvim Başlığı */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <button
                        onClick={prevMonth}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300 touch-manipulation"
                      >
                        <span className="text-blue-600 font-bold text-sm sm:text-base">‹</span>
                      </button>
                      
                      <h4 className="text-sm sm:text-lg font-bold text-slate-800">
                        {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                      </h4>
                      
                      <button
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
                          <span className="text-xs font-bold text-slate-600">{day}</span>
                        </div>
                      ))}
                    </div>

                    {/* Takvim Günleri */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayInfo, index) => {
                        const occupiedCount = occupiedDates[dayInfo.date] || 0;
                        const isSelected = selectedDate === dayInfo.date;
                        const isFullyOccupied = occupiedCount >= 12;
                        const isPartiallyOccupied = occupiedCount > 0 && occupiedCount < 12;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (!dayInfo.isDisabled && !isFullyOccupied) {
                                setSelectedDate(dayInfo.date);
                              }
                            }}
                            disabled={dayInfo.isDisabled || isFullyOccupied}
                            className={`aspect-square rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative touch-manipulation ${
                              dayInfo.isDisabled 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : isSelected
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110 shadow-lg'
                                : isFullyOccupied && dayInfo.isCurrentMonth
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white cursor-not-allowed opacity-75'
                                : isPartiallyOccupied && dayInfo.isCurrentMonth
                                ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 hover:scale-105 shadow-md'
                                : dayInfo.isCurrentMonth
                                ? 'text-slate-700 hover:bg-blue-100 hover:scale-105'
                                : 'text-gray-400'
                            }`}
                            title={
                              dayInfo.isDisabled
                                ? 'Geçmiş tarih'
                                : isFullyOccupied && dayInfo.isCurrentMonth
                                ? `Tamamen dolu (${occupiedCount}/12 koltuk) - Seçilemez`
                                : isPartiallyOccupied && dayInfo.isCurrentMonth
                                ? `Kısmen dolu (${occupiedCount}/12 koltuk)`
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
                    <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 text-xs mt-3 sm:mt-4">
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-green-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Seçili</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-red-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Dolu (Seçilemez)</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-orange-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Kısmi</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-blue-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Boş</span>
                      </div>
                    </div>
                  </div>

                  {/* Saat Seçimi - Sadece Normal Tur İçin */}
                  {tourType === 'normal' && selectedDate && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                      <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">🕐 Saat Seçin</h3>
                      <div className="flex flex-col gap-2 sm:gap-3">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`px-4 sm:px-6 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                              selectedTime === time
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-105'
                                : 'bg-blue-50 hover:bg-blue-100 text-slate-800'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Özel Tur Bilgisi */}
                  {(tourType === 'private' || tourType === 'fishing-swimming') && selectedDate && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-purple-200 p-3 sm:p-6">
                      <div className={`text-center border rounded-xl p-3 sm:p-4 ${
                        tourType === 'fishing-swimming' 
                          ? 'bg-cyan-50 border-cyan-200'
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <div className="text-3xl sm:text-4xl mb-2">
                          {tourType === 'fishing-swimming' ? '🏊‍♂️' : '⭐'}
                        </div>
                        <p className={`font-bold text-base sm:text-lg ${
                          tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                        }`}>
                          {tourType === 'fishing-swimming' ? 'Balık + Yüzme Turu: 6 Saat' : 'Özel Tur: Gün Boyu'}
                        </p>
                        <p className={`text-xs sm:text-sm ${
                          tourType === 'fishing-swimming' ? 'text-cyan-700' : 'text-purple-700'
                        }`}>
                          {tourType === 'fishing-swimming' 
                            ? 'Balık avı + yüzme molası' 
                            : '07:00-20:00 arası tüm tekne sizin'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ Taraf: Koltuk Seçimi */}
                {selectedDate && ((tourType === 'private' || tourType === 'fishing-swimming') || selectedTime) && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                    <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">
                      {(tourType === 'private' || tourType === 'fishing-swimming') ? 
                        (tourType === 'fishing-swimming' ? '🏊‍♂️ Balık+Yüzme Turu - Tüm Koltuklar Sizin' : '⭐ Özel Tur - Tüm Koltuklar Sizin') : 
                        '🪑 Koltuk Seçin'}
                    </h3>
                    
                    {/* Koltuk Seçim Bilgilendirmesi */}
                    {tourType === 'normal' && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 inline-block">
                          <p className="text-blue-800 text-xs sm:text-sm font-medium">
                            💡 <strong>{guestCount} kişi</strong> için <strong>{guestCount} koltuk</strong> seçin
                          </p>
                          {selectedSeats.length < guestCount && (
                            <p className="text-blue-700 text-xs mt-1">
                              Henüz {guestCount - selectedSeats.length} koltuk daha seçmelisiniz
                            </p>
                          )}
                          {selectedSeats.length === guestCount && (
                            <p className="text-green-700 text-xs mt-1">
                              ✅ Tüm koltuklar seçildi!
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Real-time Doluluk Bilgisi */}
                    {tourType === 'normal' && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 inline-block">
                          <p className="text-blue-800 text-xs font-medium mb-1">
                            🔄 <strong>Seçili Saat:</strong> {selectedTime}
                          </p>
                          <div className="flex items-center space-x-2 justify-center">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${occupiedSeats.length === 0 ? 'bg-green-500' : occupiedSeats.length >= 10 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                            <p className="text-blue-800 text-xs font-medium">
                              <strong>Doluluk:</strong> {occupiedSeats.length}/12
                            </p>
                          </div>
                          {occupiedSeats.length === 0 && (
                            <p className="text-green-700 text-xs mt-1">
                              ✅ Tüm koltuklar müsait!
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Özel Tur Bilgilendirmesi */}
                    {(tourType === 'private' || tourType === 'fishing-swimming') && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className={`border rounded-xl p-2 sm:p-3 inline-block ${
                          tourType === 'fishing-swimming'
                            ? 'bg-cyan-50 border-cyan-200'
                            : 'bg-purple-50 border-purple-200'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                          }`}>
                            {tourType === 'fishing-swimming' ? '🏊‍♂️' : '⭐'} <strong>
                              {tourType === 'fishing-swimming' ? 'Balık + Yüzme:' : 'Özel Tur:'} 
                            </strong> {tourType === 'fishing-swimming' ? '6 Saat' : 'Gün Boyu'}
                          </p>
                          <div className="flex items-center space-x-2 justify-center">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                              tourType === 'fishing-swimming' ? 'bg-cyan-500' : 'bg-purple-500'
                            }`}></div>
                            <p className={`text-xs font-medium ${
                              tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                            }`}>
                              🚤 Tüm tekne sizin
                            </p>
                          </div>
                          <p className={`text-xs mt-1 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-700' : 'text-purple-700'
                          }`}>
                            ✅ 12 koltuk otomatik seçildi
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Tekne Krokisi */}
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

                    {/* Koltuk Durumu Açıklamaları - Sadece Normal Tur */}
                    {tourType === 'normal' && (
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:space-x-2 text-xs mt-3 sm:mt-4">
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
                    )}

                    {/* Seçili Koltuklar */}
                    {selectedSeats.length > 0 && (
                      <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200 shadow-lg">
                        <p className="text-green-800 font-bold text-center text-xs sm:text-sm mb-2">
                          ✅ Seçili Koltuklar ({selectedSeats.length}/{(tourType === 'private' || tourType === 'fishing-swimming') ? 12 : guestCount})
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                          {selectedSeats.map((seat) => (
                            <span key={seat} className="bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold">
                              {seat}
                            </span>
                          ))}
                        </div>
                        {tourType === 'normal' && selectedSeats.length < guestCount && (
                          <p className="text-green-700 text-xs text-center mt-2">
                            {guestCount - selectedSeats.length} koltuk daha seçin
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
               
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={
                    !selectedDate || 
                    (tourType === 'normal' && !selectedTime) ||
                    (tourType === 'normal' && selectedSeats.length !== guestCount) ||
                    ((tourType === 'private' || tourType === 'fishing-swimming') && selectedSeats.length !== 12)
                  }
                  className={`px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                    selectedDate && 
                    ((tourType === 'private' || tourType === 'fishing-swimming') || selectedTime) &&
                    ((tourType === 'normal' && selectedSeats.length === guestCount) || 
                     ((tourType === 'private' || tourType === 'fishing-swimming') && selectedSeats.length === 12))
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {tourType === 'normal' && selectedSeats.length < guestCount 
                    ? `${guestCount - selectedSeats.length} koltuk daha seçin`
                    : 'Devam Et →'
                  }
                </button>
              </div>
            </div>
          )}

          {/* Adım 4: İletişim Bilgileri */}
          {currentStep === 4 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                İletişim Bilgileriniz
              </h2>
              
              <div className="max-w-md mx-auto space-y-4 mb-6 sm:mb-8">
                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    Ad Soyad *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                      className="px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                      placeholder="Ad"
                    />
                    <input
                      type="text"
                      value={guestInfo.surname}
                      onChange={(e) => setGuestInfo({...guestInfo, surname: e.target.value})}
                      className="px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                    placeholder="05XX XXX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    E-posta (İsteğe bağlı)
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              {/* Son Özet */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                <h4 className="font-bold text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">📋 Rezervasyon Özeti</h4>
                <div className="text-left space-y-2 text-blue-700 text-sm sm:text-base">
                  <p>🎣 <strong>Tur Tipi:</strong> {
                    tourType === 'private' ? 'Kapalı Tur (Özel)' : 
                    tourType === 'fishing-swimming' ? 'Balık + Yüzme Turu' : 
                    'Normal Tur'
                  }</p>
                  <p>👥 <strong>Kişi Sayısı:</strong> {(tourType === 'private' || tourType === 'fishing-swimming') ? '12 kişi (Tüm Tekne)' : `${guestCount} kişi`}</p>
                  <p>📅 <strong>Tarih:</strong> {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}</p>
                  <p>🕐 <strong>Saat:</strong> {
                    tourType === 'private' ? 'Gün Boyu (07:00-20:00)' : 
                    tourType === 'fishing-swimming' ? '6 Saat Özel Tur' : 
                    selectedTime
                  }</p>
                  <p>🪑 <strong>Koltuklar:</strong> {(tourType === 'private' || tourType === 'fishing-swimming') ? 'Tüm Tekne (12 Koltuk)' : selectedSeats.join(', ')}</p>
                  <p>👤 <strong>İletişim:</strong> {guestInfo.name} {guestInfo.surname}</p>
                  <p>📞 <strong>Telefon:</strong> {guestInfo.phone}</p>
                  {tourType === 'normal' && (
                    <p>⚓ <strong>Ekipman:</strong> {priceOption === 'own-equipment' ? 'Kendi ekipmanım var' : 'Ekipman dahil (+150 TL)'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  onClick={saveReservation}
                  disabled={!guestInfo.name || !guestInfo.surname || !guestInfo.phone || loading}
                  className={`px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                    guestInfo.name && guestInfo.surname && guestInfo.phone && !loading
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '💾 Kaydediliyor...' : '✅ Rezervasyonu Tamamla'}
                </button>
              </div>
            </div>
          )}

          {/* Adım 5: Başarı Sayfası */}
          {currentStep === 5 && (
            <div className="text-center">
              <div className="relative max-w-2xl mx-auto">
                {/* Kutlama Animasyonu */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 animate-bounce delay-100">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <div className="absolute top-0 right-1/4 animate-bounce delay-300">
                    <span className="text-4xl">🎊</span>
                  </div>
                  <div className="absolute top-10 left-1/3 animate-bounce delay-500">
                    <span className="text-3xl">⚓</span>
                  </div>
                  <div className="absolute top-10 right-1/3 animate-bounce delay-700">
                    <span className="text-3xl">🚤</span>
                  </div>
                </div>

                                    {/* Ana Kart */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 border-2 border-green-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
                  
                  {/* Arka Plan Dekorasyonu */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-blue-100/20 rounded-2xl sm:rounded-3xl"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-200/30 to-green-200/30 rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12"></div>
                  
                  {/* İçerik */}
                  <div className="relative z-10">
                    {/* Başlık */}
                    <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-pulse">
                      ✅
                    </div>
                    
                    <h2 className="text-xl sm:text-4xl font-bold text-green-800 mb-3 sm:mb-4 animate-fade-in">
                      🎉 Rezervasyonunuz Başarıyla Oluşturuldu!
                    </h2>
                    
                    {/* Durum Bilgisi */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 animate-pulse">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
                        <span className="text-yellow-800 font-bold text-sm sm:text-lg">
                          📋 Randevunuz Onay Aşamasında
                        </span>
                      </div>
                      <p className="text-yellow-700 text-xs sm:text-sm mt-2">
                        Rezervasyon detaylarınız inceleniyor...
                      </p>
                    </div>

                    {/* Bilgilendirme Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      
                      {/* WhatsApp Bilgisi */}
                      <div className="bg-white/80 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📱</div>
                        <h3 className="text-green-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          WhatsApp İletişim
                        </h3>
                        <p className="text-green-700 text-xs sm:text-sm">
                          Size WhatsApp üzerinden yazacağız ve rezervasyon detaylarınızı paylaşacağız.
                        </p>
                      </div>

                      {/* Ödeme Bilgisi */}
                      <div className="bg-white/80 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💰</div>
                        <h3 className="text-blue-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Ödeme Şekli
                        </h3>
                        <p className="text-blue-700 text-xs sm:text-sm">
                          Tekne ücretleri elden teslim alınır. Peşin ödeme yapmanıza gerek yoktur.
                        </p>
                      </div>

                      {/* Onay Süreci */}
                      <div className="bg-white/80 border border-purple-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⏰</div>
                        <h3 className="text-purple-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Onay Süreci
                        </h3>
                        <p className="text-purple-700 text-xs sm:text-sm">
                          Rezervasyonunuz 24 saat içinde onaylanacak ve size bilgi verilecektir.
                        </p>
                      </div>

                      {/* Tekne Bilgisi */}
                      <div className="bg-white/80 border border-teal-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🚤</div>
                        <h3 className="text-teal-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Tekne Hazırlığı
                        </h3>
                        <p className="text-teal-700 text-xs sm:text-sm">
                          Teknemiz sizin için hazırlanacak ve tüm güvenlik önlemleri alınacaktır.
                        </p>
                      </div>

                    </div>

                    {/* Rezervasyon Özeti */}
                    <div className="bg-white/90 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                      <h3 className="text-blue-800 font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center justify-center">
                        <span className="mr-2">📋</span>
                        Rezervasyon Özeti
                      </h3>
                      <div className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">👤 Misafir:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{guestInfo.name} {guestInfo.surname}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">📱 Telefon:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{guestInfo.phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🚤 Tur Tipi:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'private' ? '⭐ Kapalı Tur (Özel)' : 
                             tourType === 'fishing-swimming' ? '🏊‍♂️ Balık + Yüzme' : 
                             '👥 Normal Tur'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">📅 Tarih:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🕐 Saat:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'private' ? 'Gün Boyu (07:00-20:00)' : 
                             tourType === 'fishing-swimming' ? '6 Saat Özel Tur' :
                             selectedTime}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">👥 Kişi Sayısı:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {(tourType === 'private' || tourType === 'fishing-swimming') ? '12 kişi' : `${guestCount} kişi`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🪑 Koltuklar:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {selectedSeats.join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-slate-600">💰 Paket:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'normal' ? 
                              (priceOption === 'own-equipment' ? 'Kendi Ekipmanı' : 'Ekipman Dahil') :
                              tourType === 'private' ? 'Kapalı Tur (Özel)' : 'Balık + Yüzme Turu'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">💵 Fiyat:</span>
                          <span className="font-bold text-green-600 text-xs sm:text-sm">
                            {tourType === 'normal' ? 
                              (priceOption === 'own-equipment' ? 
                                `${prices.normalOwn.toLocaleString('tr-TR')} TL/kişi` : 
                                `${prices.normalWithEquipment.toLocaleString('tr-TR')} TL/kişi`) :
                              tourType === 'private' ? 
                                `${prices.privateTour.toLocaleString('tr-TR')} TL (Grup)` : 
                                `${prices.fishingSwimming.toLocaleString('tr-TR')} TL (Grup)`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-slate-600 font-bold">🧾 Toplam Tutar:</span>
                          <span className="font-bold text-green-700 text-sm sm:text-base">
                            {(tourType === 'private' || tourType === 'fishing-swimming') ? 
                              (tourType === 'private' ? 
                                `${prices.privateTour.toLocaleString('tr-TR')} TL` : 
                                `${prices.fishingSwimming.toLocaleString('tr-TR')} TL`) :
                              (priceOption === 'own-equipment' ? 
                                `${(prices.normalOwn * guestCount).toLocaleString('tr-TR')} TL` : 
                                `${(prices.normalWithEquipment * guestCount).toLocaleString('tr-TR')} TL`)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teşekkür Mesajı */}
                    <div className="bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🙏</div>
                      <h3 className="text-blue-800 font-bold text-base sm:text-xl mb-2">
                        Balık Sefası'nı Tercih Ettiğiniz İçin Teşekkürler!
                      </h3>
                      <p className="text-blue-700 text-sm sm:text-base">
                        İstanbul Boğazı'nda unutulmaz anlar yaşayacaksınız. 
                        Profesyonel ekibimiz sizlere en iyi hizmeti sunmak için hazır!
                      </p>
                    </div>

                    {/* Butonlar */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <button
                        onClick={() => {
                          setCurrentStep(1);
                          setTourType('normal');
                          setPriceOption('own-equipment');
                          setGuestCount(1);
                          setSelectedDate('');
                          setSelectedTime('');
                          setSelectedSeats([]);
                          setGuestInfo({
                            name: '',
                            surname: '',
                            phone: '',
                            email: ''
                          });
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
                      >
                        🚤 Yeni Rezervasyon Yap
                      </button>
                      
                      <Link
                        href="/"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
                      >
                        🏠 Ana Sayfaya Dön
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
} 