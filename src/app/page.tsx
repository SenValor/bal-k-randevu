'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<Array<{id: number, size: number, left: number, delay: number}>>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [guestInfos, setGuestInfos] = useState<Array<{
    name: string;
    surname: string;
    gender: string;
    phone: string;
    age: string;
  }>>([]);
  const [isPrivateTour, setIsPrivateTour] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [reservationConfirmed, setReservationConfirmed] = useState<boolean>(false);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [calendarOccupancy, setCalendarOccupancy] = useState<{[key: string]: {morning: number, afternoon: number}}>({});

  // Scroll Referansları
  const rezervasyonRef = useRef<HTMLDivElement>(null);
  const tarihRef = useRef<HTMLDivElement>(null);
  const saatRef = useRef<HTMLDivElement>(null);
  const koltukRef = useRef<HTMLDivElement>(null);
  const ozetRef = useRef<HTMLDivElement>(null);

  // Smooth scroll fonksiyonu
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, offset = 80) => {
    if (ref.current) {
      const elementPosition = ref.current.offsetTop;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Kişi sayısı değiştirme fonksiyonu - Artık scroll yapmıyor
  const handleGuestCountChange = (newCount: number) => {
    setGuestCount(newCount);
    
    // Seçili koltuk sayısı yeni kişi sayısından fazlaysa, fazla olanları çıkar
    if (selectedSeats.length > newCount) {
      setSelectedSeats(selectedSeats.slice(0, newCount));
    }
  };

  // Tarih seçildiğinde uygun bölüme kay
  useEffect(() => {
    if (selectedDate) {
      if (isPrivateTour) {
        // Özel turda direkt koltuk bölümüne git
        setTimeout(() => scrollToSection(koltukRef, 50), 800);
      } else {
        // Normal rezervasyonda saat seçimine git
        setTimeout(() => scrollToSection(saatRef, 120), 800);
      }
    }
  }, [selectedDate, isPrivateTour]);

  // Saat seçildiğinde koltuk bölümüne kay (sadece normal rezervasyonlarda)
  useEffect(() => {
    if (selectedTime && !isPrivateTour) {
      setTimeout(() => scrollToSection(koltukRef, 50), 800);
    }
  }, [selectedTime, isPrivateTour]);

  // Koltuk seçimi için scroll kontrolü - sadece manual koltuk seçiminde çalışır
  const [lastSeatAction, setLastSeatAction] = useState<'add' | 'remove' | null>(null);
  
  useEffect(() => {
    // Sadece manuel koltuk seçimi/çıkarma işleminden sonra scroll yap
    if (lastSeatAction && selectedSeats.length === guestCount && guestCount > 0 && selectedSeats.length > 0) {
      setTimeout(() => scrollToSection(ozetRef, 80), 1000);
    }
    setLastSeatAction(null); // Flag'i sıfırla
  }, [selectedSeats, lastSeatAction, guestCount]);

  // Bubble efekti için
  useEffect(() => {
    const newBubbles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      delay: Math.random() * 8
    }));
    setBubbles(newBubbles);
  }, []);

  // Görsel rotasyonu için
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Tarih ve saat seçildiğinde dolu koltukları çek ve real-time dinle
  useEffect(() => {
    if (selectedDate && selectedTime) {
      // İlk veriyi çek
      fetchOccupiedSeats(selectedDate, selectedTime);

      // Real-time listener kurarak admin onayları anında göster
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Real-time listener kuruluyor:', { selectedDate, selectedTime });
      }
      
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', selectedDate),
        where('selectedTime', '==', selectedTime),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const occupied: string[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Koltuk bilgilerini al
          if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            occupied.push(...data.selectedSeats);
          }
          
          // Özel tur ise tüm koltukları dolu yap
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
        
        // Debug log - sadece development ortamında
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [${new Date().toLocaleTimeString('tr-TR')}] Real-time güncelleme:`, {
            tarih: selectedDate,
            saat: selectedTime,
            doluKoltuklar: occupied,
            toplamRezervasyon: snapshot.size,
            rezervasyonlar: snapshot.docs.map(doc => ({
              id: doc.id,
              status: doc.data().status,
              koltuklar: doc.data().selectedSeats,
              ozelTur: doc.data().isPrivateTour
            }))
          });
        }
      }, (error) => {
        console.error('Real-time listener hatası:', error);
      });

      // Cleanup fonksiyonu
      return () => unsubscribe();
    } else {
      setOccupiedSeats([]);
    }
  }, [selectedDate, selectedTime]);

  // Takvim doluluk durumunu hesapla
  const fetchCalendarOccupancy = async (month: Date) => {
    try {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      
      // O ayın başı ve sonu
      const startOfMonth = new Date(year, monthIndex, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 Takvim doluluk hesaplanıyor:', { startOfMonth, endOfMonth });
      }
      
      // Basitleştirilmiş query - sadece tarih aralığı (index gerektirmiyor)
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '>=', startOfMonth),
        where('selectedDate', '<=', endOfMonth)
      );
      
      const querySnapshot = await getDocs(q);
      const occupancy: {[key: string]: {morning: number, afternoon: number}} = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Client-side filtering: sadece pending ve confirmed rezervasyonları al
        if (data.status !== 'pending' && data.status !== 'confirmed') {
          return;
        }
        
        const dateKey = data.selectedDate;
        
        if (!occupancy[dateKey]) {
          occupancy[dateKey] = { morning: 0, afternoon: 0 };
        }
        
        const timeSlot = data.selectedTime === '07:00-13:00' ? 'morning' : 'afternoon';
        
        if (data.isPrivateTour) {
          // Özel tur ise tüm 12 koltuk dolu
          occupancy[dateKey][timeSlot] = 12;
        } else {
          // Normal rezervasyon - koltuk sayısını ekle
          const seatCount = data.selectedSeats ? data.selectedSeats.length : 0;
          occupancy[dateKey][timeSlot] += seatCount;
        }
      });
      
      setCalendarOccupancy(occupancy);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Takvim doluluk hesaplandı:', occupancy);
      }
    } catch (error) {
      console.error('Takvim doluluk hesaplanamadı:', error);
    }
  };

  // Takvim ayı değiştiğinde doluluk durumunu çek
  useEffect(() => {
    fetchCalendarOccupancy(currentMonth);
  }, [currentMonth]);

     // Günün doluluk durumunu hesapla (0-12 arası)
   const getDayOccupancy = (dateStr: string) => {
     const dayData = calendarOccupancy[dateStr];
     if (!dayData) return { total: 0, percentage: 0, morning: 0, afternoon: 0 };
     
     const morning = dayData.morning || 0;
     const afternoon = dayData.afternoon || 0;
     const total = morning + afternoon;
     const maxCapacity = 24; // 12 sabah + 12 öğleden sonra
     const percentage = Math.round((total / maxCapacity) * 100);
     
     return { total, percentage, morning, afternoon };
   };

  // Günün rengini hesapla
  const getDayColor = (dateStr: string, isCurrentMonth: boolean, isDisabled: boolean) => {
    if (isDisabled || !isCurrentMonth) {
      return 'text-gray-400';
    }
    
    const { percentage } = getDayOccupancy(dateStr);
    
    if (percentage === 0) {
      return 'text-slate-700'; // Boş - normal
    } else if (percentage < 50) {
      return 'text-orange-600 bg-orange-50'; // Az dolu - turuncu
    } else if (percentage < 100) {
      return 'text-red-600 bg-red-50'; // Çoğunlukla dolu - kırmızı
    } else {
      return 'text-white bg-red-600'; // Tamamen dolu - koyu kırmızı
    }
  };

  // Gerçek tekne koltuk düzeni - İskele (Sol) ve Sancak (Sağ)
  const iskeleSeat = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'];
  const sancakSeat = ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];

  // Takvim işlevleri
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Ayın ilk günü
    const firstDay = new Date(year, monthIndex, 1);
    // Ayın son günü
    const lastDay = new Date(year, monthIndex + 1, 0);
    // Ayın kaç gün olduğu
    const daysInMonth = lastDay.getDate();
    // Ayın ilk günü hangi gün (0=Pazar, 1=Pazartesi...)
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi=0 olacak şekilde ayarla
    
    const days = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Önceki ayın son günlerini ekle
    const prevMonth = new Date(year, monthIndex - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, monthIndex - 1, day);
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
        isDisabled: true
      });
    }
    
    // Bu ayın günlerini ekle
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isPast: date < today,
        isDisabled: date < today
      });
    }
    
    // Sonraki ayın ilk günlerini ekle (42 gün olacak şekilde - 6 hafta)
    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const date = new Date(year, monthIndex + 1, day);
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
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
    // Geçmiş aylara gitmeyi engelle
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  const calendarDays = getCalendarDays(currentMonth);

  // Mevcut saatler
  const availableTimes = [
    '07:00-13:00', '14:00-20:00'
  ];

  const getSeatStatus = (seat: string) => {
    if (occupiedSeats.includes(seat)) return 'occupied';
    if (selectedSeats.includes(seat)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-gradient-to-br from-red-500 to-red-600 border-red-600 cursor-not-allowed';
      case 'selected': return 'bg-gradient-to-br from-green-400 to-green-600 border-green-600 shadow-xl scale-110 neon-glow';
      case 'available': return 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-110 shadow-lg hover:shadow-xl';
      default: return 'bg-gray-300 border-gray-400';
    }
  };

  const renderSeat = (seatId: string) => {
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    const canSelect = !isOccupied && (!isSelected && selectedSeats.length < guestCount || isSelected);
    
    return (
      <button
        key={seatId}
        onClick={() => {
          // Özel turda koltuk seçimi yapılamaz
          if (isPrivateTour) return;
          
          if (!isOccupied) {
            if (isSelected) {
              // Koltuk zaten seçili, çıkar
              setLastSeatAction('remove');
              setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
            } else if (selectedSeats.length < guestCount) {
              // Yeni koltuk ekle (kişi sayısı limitine kadar)
              setLastSeatAction('add');
              setSelectedSeats([...selectedSeats, seatId]);
            }
          }
        }}
        disabled={isOccupied || isPrivateTour}
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all duration-300 shadow-lg border-2 ${getSeatColor(getSeatStatus(seatId))} ${
          (!canSelect && !isOccupied && !isSelected) || isPrivateTour ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          isPrivateTour
            ? 'Özel turda tüm koltuklar otomatik seçilmiştir'
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
          {/* Koltuk gölgesi */}
          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-black/30 rounded-full"></div>
        </div>
      </button>
    );
  };

  const isReservationComplete = selectedSeats.length === guestCount && selectedDate && 
    (isPrivateTour || selectedTime) && guestCount > 0;
  
  // Kişi bilgileri formunu hazırla
  const initializeGuestInfos = () => {
    // Özel turda sadece 1 kişi (yetkili/organizatör) bilgisi gerekli
    const personCount = isPrivateTour ? 1 : guestCount;
    
    const infos = Array.from({ length: personCount }, () => ({
      name: '',
      surname: '',
      gender: '',
      phone: '',
      age: ''
    }));
    setGuestInfos(infos);
    setShowPersonalInfoForm(true);
  };

  // Kişi bilgileri tamamlandı mı kontrol et
  const expectedPersonCount = isPrivateTour ? 1 : guestCount;
  const isPersonalInfoComplete = guestInfos.length === expectedPersonCount && 
    guestInfos.every(info => info.name && info.surname && info.gender && info.phone && info.age);

  // IBAN bilgileri
  const bankInfo = {
    iban: "TR98 0006 4000 0011 2345 6789 01",
    accountHolder: "Balık Sefası Tekne Turizm",
    bankName: "Türkiye İş Bankası"
  };

  // Clipboard'a kopyalama fonksiyonu
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Başarı mesajı göster (basit alert, sonra toast eklenebilir)
      alert(`${type} kopyalandı!`);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
      alert('Kopyalama başarısız!');
    }
  };

  // Firebase'den seçili tarih ve saat için dolu koltukları çek
  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time) return;
    
    try {
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', date),
        where('selectedTime', '==', time),
        where('status', 'in', ['pending', 'confirmed']) // Bekleyen ve onaylanmış rezervasyonlar
      );
      
      const querySnapshot = await getDocs(q);
      const occupied: string[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Koltuk bilgilerini al
        if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
          occupied.push(...data.selectedSeats);
        }
        
        // Özel tur ise tüm koltukları dolu yap
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${date} ${time} için dolu koltuklar:`, occupied); // Debug için
      }
    } catch (error) {
      console.error('Dolu koltuklar çekilemedi:', error);
    }
  };

  // Rezervasyonu Firebase'e kaydet
  const saveReservation = async () => {
    setLoading(true);
    try {
      const reservationData = {
        guestCount,
        selectedDate,
        selectedTime,
        selectedSeats,
        isPrivateTour,
        guestInfos,
        // Özel tur için grup lideri notu ekle
        ...(isPrivateTour && {
          note: 'Özel tur - Girilen bilgiler grup lideri/yetkili kişiye aittir. Toplam 12 kişi için tüm tekne kiralanmıştır.'
        }),
        status: 'pending',
        paymentStatus: 'waiting',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Rezervasyon kaydedilemedi:', error);
      alert('Rezervasyon sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative wave-bg">
      {/* Bubble Animation */}
      <div className="bubbles">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="bubble"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}%`,
              animationDelay: `${bubble.delay}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo ve Başlık */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl floating group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-white font-bold text-2xl">🐟</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg">
                  <div className="absolute inset-1 bg-white rounded-full"></div>
                </div>
                {/* Şık çember efekti */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  Balık Sefası
                </h1>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-600 font-medium">🌊 Tekne Kiralama & Balık Avı</span>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* İletişim Butonları */}
            <div className="flex items-center space-x-3">
              {/* Gizli Admin Linki */}
              <Link 
                href="/admin"
                className="opacity-30 hover:opacity-100 transition-all duration-300"
                title="Admin Panel"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">🎛️</span>
                </div>
              </Link>
              {/* WhatsApp Butonu */}
              <a 
                href="https://wa.me/905310892537?text=Merhaba, tekne kiralama hakkında bilgi almak istiyorum." 
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-full hover:from-green-600 hover:to-green-700 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                </svg>
                
                {/* Tooltip */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  WhatsApp ile iletişim
                </div>
                
                {/* Şık parlaklık efekti */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>

              {/* Telefon Butonu */}
              <a 
                href="tel:05310892537" 
                className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-full text-sm font-bold hover:from-blue-600 hover:to-blue-700 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span className="hidden sm:inline">Ara</span>
                
                {/* Tooltip mobil için */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap sm:hidden">
                  Hemen ara
                </div>
                
                {/* Şık parlaklık efekti */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </div>
          </div>
        </div>

        {/* Şık alt çizgi efekti */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4 floating">
            🌊 Denizde Balık Avı Keyfi
          </h2>
          <p className="text-white/90 leading-relaxed text-sm backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
            İstanbul Sarıyer'de profesyonel balıkçı teknesi kiralama. 
            Konforlu koltuklar, deneyimli kaptan ve güvenli yolculuk.
          </p>
          
          {/* Rezervasyona Başla Butonu */}
          <button
            onClick={() => scrollToSection(rezervasyonRef, 100)}
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 active:scale-95 shadow-2xl hover:shadow-3xl transition-all duration-300 shimmer floating"
          >
            🚀 Rezervasyona Başla
          </button>
          <p className="text-white/80 text-xs mt-2 animate-pulse">
            ⬇️ Adım adım rezervasyon sürecine başlayın
          </p>
        </div>

        {/* Tekne Görselleri */}
        <div className="glass-card p-6 mb-6 hover-lift">
          <h3 className="text-lg font-bold mb-4 text-center">
            <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
              📸 Teknemiz
            </span>
          </h3>
          
          {/* Ana Görsel */}
          <div className="relative mb-4 rounded-2xl overflow-hidden shadow-xl">
            <div className="aspect-[16/9] relative">
              <Image
                src={`/tekne-gorseller/tekne-${currentImageIndex + 1}.jpg`}
                alt={`Balık Sefası Tekne Görsel ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                priority={currentImageIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
              {currentImageIndex + 1} / 10
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <div className="text-lg font-bold drop-shadow-lg">Balık Sefası Teknesi</div>
              <div className="text-sm opacity-90 drop-shadow-lg">Profesyonel Balık Avı Turu</div>
            </div>
          </div>

          {/* Küçük Görseller Grid */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`aspect-square rounded-lg overflow-hidden transition-all duration-300 relative ${
                  currentImageIndex === i 
                    ? 'ring-3 ring-blue-400 scale-105 shadow-xl' 
                    : 'hover:scale-105 shadow-lg'
                }`}
              >
                <Image
                  src={`/tekne-gorseller/tekne-${i + 1}.jpg`}
                  alt={`Tekne Görsel ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 20vw, 10vw"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-all duration-300"></div>
                <div className="absolute top-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                  {i + 1}
                </div>
                {currentImageIndex === i && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Rezervasyon Bilgileri */}
        <div ref={rezervasyonRef} className="glass-card p-6 mb-6 hover-lift">
          <h3 className="text-lg font-bold mb-6 text-center">
            <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
              📅 Rezervasyon Bilgileri
            </span>
          </h3>

          {/* Kişi Sayısı */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-800 mb-3 bg-white/80 px-3 py-1 rounded-full inline-block">
              👥 Kaç Kişi?
            </label>
            <div className="text-center mb-3">
              <p className="text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full inline-block">
                👥 Kişi sayısını seçin, sonra aşağıdaki tarih seçimine geçin
              </p>
            </div>

            {/* Özel Tur Seçeneği */}
            <div className="mb-4 text-center">
              <button
                onClick={() => {
                  setIsPrivateTour(!isPrivateTour);
                  if (!isPrivateTour) {
                    // Özel tur seçildi - 12 kişi yap ve tüm koltukları seç
                    handleGuestCountChange(12);
                    setSelectedSeats([...iskeleSeat, ...sancakSeat]);
                    // Özel tur için otomatik "Gün Boyu" saat ayarla
                    setSelectedTime('07:00-20:00');
                  } else {
                    // Özel tur iptal edildi - normal moda dön
                    handleGuestCountChange(1);
                    setSelectedSeats([]);
                    setSelectedTime(''); // Saati temizle
                  }
                }}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                  isPrivateTour
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                    : 'bg-white/90 text-slate-800 border border-purple-300 hover:bg-purple-50'
                }`}
              >
                                 {isPrivateTour ? '⭐ Özel Tur Seçili' : '⭐ Özel Tur '}
              </button>
              
                             {isPrivateTour && (
                 <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-lg">
                   <div className="text-center">
                     <p className="text-sm font-bold text-purple-700 mb-2">🚤 Özel Tur Aktif</p>
                     <div className="space-y-2 text-xs text-slate-600">
                       <p>✅ Tüm tekne sizin grubunuz için ayrıldı</p>
                       <p>✅ 12 kişiye kadar katılım</p>
                       <p>✅ Oltalar ve ilk takımlar dahil</p>
                       <div className="mt-3 p-2 bg-orange-100 rounded-lg border border-orange-200">
                         <p className="text-orange-800 font-bold text-xs">
                           ⚠️ <strong>Önemli:</strong> Seçtiğiniz günün tamamen boş olması gereklidir!
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            {/* Normal Kişi Sayısı Seçimi (Özel tur değilse) */}
            {!isPrivateTour && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => {
                    const newCount = Math.max(1, guestCount - 1);
                    handleGuestCountChange(newCount);
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-full font-bold hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  -
                </button>
                <div className="bg-white/90 px-6 py-3 rounded-full shadow-lg border border-blue-200">
                  <span className="text-2xl font-bold text-slate-800">{guestCount}</span>
                </div>
                <button
                  onClick={() => {
                    const newCount = Math.min(12, guestCount + 1);
                    handleGuestCountChange(newCount);
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-full font-bold hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  +
                </button>
              </div>
            )}

            <p className="text-center text-xs text-slate-600 mt-2 bg-white/70 px-3 py-1 rounded-full inline-block">
              {isPrivateTour ? '⭐ Özel Tur - Tüm Tekne' : `Maksimum 12 kişi • ${selectedSeats.length}/${guestCount} koltuk seçildi`}
            </p>
          </div>

          {/* Tarih Seçimi - Modern Takvim */}
          <div ref={tarihRef} className="mb-6">
            <label className="block text-sm font-bold text-slate-800 mb-2 bg-white/80 px-3 py-1 rounded-full inline-block">
              📅 Tarih Seçin
            </label>
            <div className="text-center mb-4">
              {isPrivateTour ? (
                <div className="space-y-2">
                  <p className="text-purple-600 text-xs bg-purple-50 px-3 py-1 rounded-full inline-block">
                    ⭐ Özel Tur için tarih seçimi
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                    <p className="text-orange-800 text-xs font-bold">
                      ⚠️ <strong>Özel Tur Koşulu:</strong> Seçtiğiniz günün tamamen boş olması gereklidir.<br/>
                      Başka rezervasyonların olduğu günlerde özel tur yapılamaz.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-green-600 text-xs bg-green-50 px-3 py-1 rounded-full inline-block">
                  📅 Tarih seçtikten sonra otomatik olarak saat seçimine geçeceğiz
                </p>
              )}
            </div>
            
            <div className="bg-white/90 rounded-2xl shadow-lg border border-blue-200 p-4">
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
                  const occupancy = getDayOccupancy(dayInfo.date);
                  const dayColorClass = getDayColor(dayInfo.date, dayInfo.isCurrentMonth, dayInfo.isDisabled);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!dayInfo.isDisabled) {
                          setSelectedDate(dayInfo.date);
                        }
                      }}
                      disabled={dayInfo.isDisabled}
                      className={`
                        aspect-square rounded-lg text-sm font-bold transition-all duration-300 relative
                        ${dayInfo.isDisabled 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'hover:scale-110 hover:shadow-lg cursor-pointer'
                        }
                        ${selectedDate === dayInfo.date
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-xl scale-110'
                          : dayInfo.isToday
                          ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400'
                          : dayInfo.isCurrentMonth && !dayInfo.isDisabled
                          ? `${dayColorClass} border border-gray-200 hover:border-green-300`
                          : 'text-gray-400'
                        }
                      `}
                      title={
                        dayInfo.isCurrentMonth && !dayInfo.isDisabled && occupancy.total > 0
                          ? `${occupancy.total}/24 koltuk dolu (Sabah: ${occupancy.morning}/12, Öğleden sonra: ${occupancy.afternoon}/12)`
                          : undefined
                      }
                    >
                      <span className="relative z-10">{dayInfo.day}</span>
                      
                      {/* Doluluk göstergesi */}
                      {dayInfo.isCurrentMonth && !dayInfo.isDisabled && occupancy.total > 0 && selectedDate !== dayInfo.date && (
                        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                          {/* Sabah göstergesi */}
                          {occupancy.morning > 0 && (
                            <div className={`w-1 h-1 rounded-full ${
                              occupancy.morning >= 12 ? 'bg-red-500' : 
                              occupancy.morning >= 6 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}></div>
                          )}
                          {/* Öğleden sonra göstergesi */}
                          {occupancy.afternoon > 0 && (
                            <div className={`w-1 h-1 rounded-full ${
                              occupancy.afternoon >= 12 ? 'bg-red-500' : 
                              occupancy.afternoon >= 6 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}></div>
                          )}
                        </div>
                      )}
                      
                      {/* Bugün göstergesi */}
                      {dayInfo.isToday && selectedDate !== dayInfo.date && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Doluluk Göstergesi Açıklaması */}
              <div className="mt-4 text-center">
                <div className="flex justify-center space-x-2 text-xs mb-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow-sm border">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-slate-700">Az dolu</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow-sm border">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-slate-700">Yarı dolu</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow-sm border">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-slate-700">Tam dolu</span>
                  </div>
                </div>
              </div>

              {/* Seçili Tarih Bilgisi */}
              {selectedDate && (
                <div className="mt-2 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 inline-block">
                    <span className="text-green-800 font-bold text-sm">
                      ✅ Seçili: {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    {/* Seçili günün doluluk bilgisi */}
                    {(() => {
                      const dayOccupancy = getDayOccupancy(selectedDate);
                      if (dayOccupancy.total > 0) {
                        return (
                          <div className="text-green-700 text-xs mt-1">
                            📊 Doluluk: {dayOccupancy.total}/24 koltuk (Sabah: {dayOccupancy.morning}/12, Öğleden sonra: {dayOccupancy.afternoon}/12)
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saat Seçimi - Sadece normal rezervasyonlar için */}
        {!isPrivateTour && (
          <div ref={saatRef} className="glass-card p-6 mb-6 hover-lift">
            <h3 className="text-lg font-bold mb-2 text-center">
              <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
                🕐 Saat Seçin
              </span>
            </h3>
            <div className="text-center mb-4">
              <p className="text-orange-600 text-xs bg-orange-50 px-3 py-1 rounded-full inline-block">
                🕐 Saat seçtikten sonra otomatik olarak koltuk seçimine geçeceğiz
              </p>
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-6 py-3 rounded-xl text-center font-bold transition-all duration-300 min-w-[140px] ${
                    selectedTime === time
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-xl scale-105'
                      : 'bg-white/80 hover:bg-white/90 text-slate-800 shadow-lg hover:scale-105'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Özel Tur Bilgilendirmesi */}
        {isPrivateTour && (
          <div ref={saatRef} className="glass-card p-6 mb-6 hover-lift">
            <h3 className="text-lg font-bold mb-4 text-center">
              <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
                ⭐ Özel Tur - Gün Boyu Kiralama
              </span>
            </h3>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl text-white">🚤</span>
                </div>
                <h4 className="text-lg font-bold text-purple-800">Gün Boyu Özel Tekne Kiralama</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span>Sabah 07:00 - Akşam 20:00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span>Tüm tekne sadece sizin grubunuz için</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span>12 kişiye kadar katılım</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span>Oltalar ve takımlar dahil</span>
                  </div>
                </div>
                <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-4">
                  <p className="text-orange-800 text-sm font-bold">
                    ⚠️ <strong>Önemli:</strong> Seçtiğiniz günün tamamen boş olması gereklidir!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tekne Krokisi */}
        <div ref={koltukRef} className="glass-card p-6 mb-6 hover-lift">
          <h3 className="text-lg font-bold mb-2 text-center">
            <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
              ⚓ Tekne Krokisi & Koltuk Seçimi
            </span>
          </h3>
          <div className="text-center mb-4">
            <p className="text-purple-600 text-xs bg-purple-50 px-3 py-1 rounded-full inline-block">
              🪑 Koltukları seçtikten sonra otomatik olarak rezervasyon özetine geçeceğiz
            </p>
          </div>
          
          {/* Koltuk Seçim Bilgilendirmesi */}
          <div className="mb-6 text-center space-y-3">
            {isPrivateTour ? (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 inline-block">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⭐</span>
                  </div>
                  <p className="text-purple-800 text-lg font-bold">
                    Özel Tur Aktif
                  </p>
                </div>
                <p className="text-purple-700 text-sm">
                  🚤 Tüm tekne sadece sizin grubunuz için ayrıldı
                </p>
                <p className="text-purple-600 text-xs mt-1">
                  Koltuk seçimi otomatik olarak tamamlandı
                </p>
              </div>
            ) : (
              <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 inline-block">
                <p className="text-blue-800 text-sm font-medium">
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
            )}

            {/* Real-time Doluluk Bilgisi - Sadece normal rezervasyonlar için */}
            {selectedDate && selectedTime && !isPrivateTour && (
              <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 inline-block">
                <p className="text-blue-800 text-xs font-medium mb-1">
                  🔄 <strong>Seçili Saat Dilimi:</strong> {selectedTime}
                </p>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${occupiedSeats.length === 0 ? 'bg-green-500' : occupiedSeats.length >= 10 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                  <p className="text-blue-800 text-xs font-medium">
                    <strong>Doluluk:</strong> {occupiedSeats.length}/12 koltuk dolu
                  </p>
                </div>
                {occupiedSeats.length > 0 && (
                  <p className="text-blue-700 text-xs mt-1">
                    Dolu koltuklar: {occupiedSeats.sort().join(', ')}
                  </p>
                )}
                {occupiedSeats.length === 0 && (
                  <p className="text-green-700 text-xs mt-1">
                    ✅ Tüm koltuklar müsait!
                  </p>
                )}
                {occupiedSeats.length >= 12 && (
                  <p className="text-red-700 text-xs mt-1">
                    ❌ Bu saat dilimi tamamen dolu!
                  </p>
                )}
                {/* Debug bilgisi - sadece development ortamında */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-purple-600 text-xs mt-1 border-t pt-1">
                    🐛 Debug: [{occupiedSeats.join(', ')}] - Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                  </p>
                )}
              </div>
            )}

            {/* Özel Tur Bilgilendirmesi */}
            {isPrivateTour && selectedDate && (
              <div className="bg-purple-50/90 border border-purple-200 rounded-xl p-3 inline-block">
                <p className="text-purple-800 text-xs font-medium mb-1">
                  ⭐ <strong>Özel Tur:</strong> Gün Boyu (07:00-20:00)
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <p className="text-purple-800 text-xs font-medium">
                    🚤 Tüm tekne sizin grubunuz için ayrıldı
                  </p>
                </div>
                <p className="text-purple-700 text-xs mt-1">
                  ✅ 12 koltuk da otomatik olarak seçilmiştir
                </p>
              </div>
            )}
          </div>
          
          <div className="relative max-w-md mx-auto">
            {/* BAŞ - Üçgen Kısım */}
            <div className="relative">
              {/* Baş Label */}
              <div className="text-center mb-3">
                <span className="text-sm font-bold text-slate-800 bg-white/95 px-4 py-2 rounded-full shadow-xl border border-slate-300">⚓ BAŞ</span>
              </div>
              
              {/* Üçgen Şekil */}
              <div 
                className="relative mx-auto w-40 h-28 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-2 border-slate-400"
                style={{
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                }}
              >
                {/* Baş bölümü içerik */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-3">
                  <div className="bg-white/90 p-2 rounded-full shadow-lg border border-slate-300">
                    <span className="text-xl">⚓</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-full shadow-lg border border-slate-300">
                    <span className="text-lg">🚽</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ANA GÖVDE - Dikdörtgen Kısım */}
            <div className="relative bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 w-40 mx-auto shadow-2xl rounded-b-2xl border-2 border-slate-400 border-t-0">
              {/* İskele (Sol) Label */}
              <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 -rotate-90">
                <span className="text-sm font-bold text-black bg-white/95 px-3 py-2 rounded-full shadow-xl border border-blue-600">🌊 İSKELE</span>
              </div>
              
              {/* Sancak (Sağ) Label */}
              <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 rotate-90">
                <span className="text-sm font-bold text-slate-800 bg-white/95 px-3 py-2 rounded-full shadow-xl border border-slate-300">🌊 SANCAK</span>
              </div>

              {/* Koltuk Düzeni */}
              <div className="flex justify-between p-5">
                {/* İskele Koltukları (Sol) */}
                <div className="flex flex-col space-y-3">
                  {iskeleSeat.map(seatId => renderSeat(seatId))}
                </div>

                {/* Orta Koridor */}
                <div className="w-10 bg-gradient-to-b from-slate-400 via-slate-450 to-slate-500 rounded-lg shadow-inner border border-slate-500">
                  {/* Koridor detayları */}
                  <div className="space-y-2 pt-4">
                    <div className="w-6 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                    <div className="w-4 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                    <div className="w-6 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                  </div>
                </div>

                {/* Sancak Koltukları (Sağ) */}
                <div className="flex flex-col space-y-3">
                  {sancakSeat.map(seatId => renderSeat(seatId))}
                </div>
              </div>
            </div>

            {/* KIÇ */}
            <div className="text-center mt-3">
              <span className="text-sm font-bold text-slate-800 bg-white/95 px-4 py-2 rounded-full shadow-xl border border-slate-300">🚤 KIÇ</span>
            </div>
          </div>

          {/* Koltuk Durumu Açıklamaları - Sadece normal rezervasyonlar için */}
          {!isPrivateTour && (
            <div className="flex justify-center space-x-2 text-xs mt-6 flex-wrap gap-2">
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
              <div className="flex items-center space-x-1 bg-white/95 px-2 py-1 rounded-full shadow-lg border border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-purple-800 text-xs">🔄 Canlı</span>
              </div>
            </div>
          )}

          {selectedSeats.length > 0 && !isPrivateTour && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200 shadow-lg">
              <p className="text-green-800 font-bold text-center text-sm mb-2">
                ✅ Seçili Koltuklar ({selectedSeats.length}/{guestCount})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedSeats.map((seat) => (
                  <span key={seat} className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {seat}
                  </span>
                ))}
              </div>
              {selectedSeats.length < guestCount && (
                <p className="text-green-700 text-xs text-center mt-2">
                  {guestCount - selectedSeats.length} koltuk daha seçin
                </p>
              )}
            </div>
          )}

          {/* Özel Tur için basit onay */}
          {isPrivateTour && selectedSeats.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-200 shadow-lg">
              <p className="text-purple-800 font-bold text-center text-sm">
                ⭐ Özel Tur - Tüm koltuklar rezerve edildi
              </p>
              <p className="text-purple-700 text-xs text-center mt-1">
                12 koltuk (Tüm Tekne) • Gün Boyu Kiralama
              </p>
            </div>
          )}
        </div>

        {/* Rezervasyon Özeti */}
        {!showPersonalInfoForm && (
          <div ref={ozetRef} className="glass-card p-6 mb-6 hover-lift">
            <h3 className="text-lg font-bold mb-4 text-center">
              <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
                🎯 Rezervasyon Özeti
              </span>
            </h3>

            {/* Rezervasyon Özeti */}
            {isReservationComplete && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
                <h4 className="font-bold text-slate-800 mb-2">📋 Seçimleriniz</h4>
                <div className="space-y-1 text-sm text-slate-700">
                  {isPrivateTour && (
                    <div className="bg-purple-100 px-3 py-2 rounded-lg text-purple-800 border border-purple-200">
                      <p className="font-bold text-sm mb-1">⭐ Özel Tur - Tüm Tekne</p>
                      <div className="text-xs text-purple-700 space-y-1">
                        <p>✅ 12 kişiye kadar katılım</p>
                        <p>✅ Oltalar ve takımlar dahil</p>
                        <p>👤 Yetkili kişi: {guestInfos[0]?.name} {guestInfos[0]?.surname}</p>
                        <p>⚠️ Gün tamamen boş olmalı</p>
                      </div>
                    </div>
                  )}
                                      <p>👥 <strong>{guestCount} kişi</strong></p>
                    <p>📅 <strong>{new Date(selectedDate).toLocaleDateString('tr-TR')}</strong></p>
                    <p>🕐 <strong>{isPrivateTour ? 'Gün Boyu (07:00-20:00)' : selectedTime}</strong></p>
                  <p>🪑 <strong>{isPrivateTour ? 'Tüm koltuklar (özel tur)' : selectedSeats.join(', ') + ' koltukları'}</strong></p>
                  {isPrivateTour && (
                    <p className="text-purple-700 text-xs">
                      🎣 Oltalar ve ilk takımlar dahil
                    </p>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                if (isReservationComplete) {
                  initializeGuestInfos();
                }
              }}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden ${
                isReservationComplete 
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:from-orange-600 hover:via-red-600 hover:to-pink-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isReservationComplete}
            >
              {isReservationComplete && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-[buttonShimmer_2s_infinite]"></div>
              )}
              <span className="relative z-10">
                {isReservationComplete 
                  ? isPrivateTour 
                    ? '🚀 Özel Tur Rezervasyona Devam Et → Tüm Tekne'
                    : `🚀 Rezervasyona Devam Et → ${guestCount} Kişi`
                  : '📝 Lütfen Tüm Bilgileri Doldurun'}
              </span>
            </button>
          </div>
        )}

        {/* Kişi Bilgileri Formu - ARTIK HEMEN REZERVASYON ÖZETİ'NDEN SONRA */}
        {showPersonalInfoForm && (
          <div className="glass-card p-6 mb-6 hover-lift">
            <h3 className="text-lg font-bold mb-6 text-center">
              <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
                {isPrivateTour 
                  ? '👤 Yetkili Kişi Bilgileri (Grup Lideri)' 
                  : `👥 Kişi Bilgileri (${guestCount} Kişi)`
                }
              </span>
            </h3>

            {/* Özel tur açıklaması */}
            {isPrivateTour && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-purple-800 text-sm font-medium text-center">
                  ⭐ <strong>Özel Tur:</strong> Sadece grup lideri/yetkili kişi bilgilerini girin. 
                  Bu kişi tüm grup adına iletişim kurulacak temsilci olacaktır.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {guestInfos.map((guest, index) => (
                <div key={index} className="bg-white/90 rounded-xl p-4 border border-blue-200 shadow-lg">
                  <h4 className="font-bold text-slate-800 mb-3 text-center">
                    {isPrivateTour 
                      ? 'Grup Lideri / Yetkili Kişi Bilgileri' 
                      : `${index + 1}. Kişi Bilgileri`
                    }
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* İsim */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ad</label>
                      <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => {
                          const newInfos = [...guestInfos];
                          newInfos[index].name = e.target.value;
                          setGuestInfos(newInfos);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="İsim"
                      />
                    </div>

                    {/* Soyisim */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Soyad</label>
                      <input
                        type="text"
                        value={guest.surname}
                        onChange={(e) => {
                          const newInfos = [...guestInfos];
                          newInfos[index].surname = e.target.value;
                          setGuestInfos(newInfos);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="Soyisim"
                      />
                    </div>

                    {/* Cinsiyet */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cinsiyet</label>
                      <select
                        value={guest.gender}
                        onChange={(e) => {
                          const newInfos = [...guestInfos];
                          newInfos[index].gender = e.target.value;
                          setGuestInfos(newInfos);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="">Seçiniz</option>
                        <option value="erkek">Erkek</option>
                        <option value="kadın">Kadın</option>
                      </select>
                    </div>

                    {/* Yaş */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Yaş</label>
                      <input
                        type="number"
                        value={guest.age}
                        onChange={(e) => {
                          const newInfos = [...guestInfos];
                          newInfos[index].age = e.target.value;
                          setGuestInfos(newInfos);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="Yaş"
                        min="1"
                        max="100"
                      />
                    </div>

                    {/* Telefon */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                      <input
                        type="tel"
                        value={guest.phone}
                        onChange={(e) => {
                          const newInfos = [...guestInfos];
                          newInfos[index].phone = e.target.value;
                          setGuestInfos(newInfos);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Navigasyon */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPersonalInfoForm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-400 text-white hover:bg-gray-500 transition-all duration-300"
              >
                ← Geri Dön
              </button>
              
              <button
                onClick={() => {
                  if (isPersonalInfoComplete) {
                    saveReservation();
                  }
                }}
                disabled={!isPersonalInfoComplete || loading}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  isPersonalInfoComplete && !loading
                    ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 shimmer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading 
                  ? '💾 Kaydediliyor...'
                  : isPersonalInfoComplete 
                  ? isPrivateTour 
                    ? '🎉 Özel Tur Rezervasyonunu Onayla' 
                    : '🎉 Rezervasyonu Onayla'
                  : isPrivateTour
                  ? '📝 Yetkili Kişi Bilgilerini Doldurun'
                  : '📝 Kişi Bilgilerini Doldurun'}
              </button>
            </div>
          </div>
        )}

        {/* Hizmetler */}
        <div className="glass-card p-6 mb-6 hover-lift">
          <h3 className="text-lg font-bold mb-4 text-center">
            <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
              🎣 Hizmetlerimiz
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">🎣</div>
              <p className="text-sm font-bold text-slate-700">Balık Turu</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">🏊‍♂️</div>
              <p className="text-sm font-bold text-slate-700">Yüzme Turu</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">🔥</div>
              <p className="text-sm font-bold text-slate-700">Mangal</p>
            </div>
          </div>
        </div>

        {/* İletişim */}
        <div className="glass-card p-6 mb-6 hover-lift">
          <h3 className="text-lg font-bold mb-4 text-center">
            <span className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-slate-800">
              📍 İletişim Bilgileri
            </span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-white/90 p-4 rounded-xl shadow-lg border border-blue-200">
              <span className="text-blue-600 text-lg">📍</span>
              <div>
                <p className="font-bold text-slate-800 text-sm">Konum</p>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Eyüp Odabaşı Sporcular Parkı<br />
                  Yenimahalle Mah. Yeni Mahalle Cd<br />
                  34450 Sarıyer/İstanbul
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white/90 p-4 rounded-xl shadow-lg border border-green-200">
              <span className="text-green-600 text-lg">📞</span>
              <div>
                <p className="font-bold text-slate-800 text-sm">İletişim</p>
                <a href="tel:05310892537" className="text-green-700 font-bold text-sm hover:text-green-800">
                  0531 089 25 37
                </a>
              </div>
            </div>
                      </div>
          </div>
        </section>

        {/* Ödeme Modal'ı */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">💳 Ödeme Bilgileri</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300"
                  >
                    <span className="text-gray-600 font-bold">×</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Rezervasyonunuzu tamamlamak için ödeme yapın
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Rezervasyon Özeti */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-slate-800 mb-2">📋 Rezervasyon Özeti</h4>
                  <div className="space-y-1 text-sm text-slate-700">
                    {isPrivateTour && (
                      <div className="bg-purple-100 px-2 py-1 rounded-lg text-purple-800 font-bold mb-1">
                        <p>⭐ Özel Tur - Tüm Tekne</p>
                        <p className="text-xs font-normal">👤 Yetkili: {guestInfos[0]?.name} {guestInfos[0]?.surname}</p>
                      </div>
                    )}
                    <p>👥 <strong>{guestCount} kişi{isPrivateTour ? ' (Özel Tur)' : ''}</strong></p>
                    <p>📅 <strong>{new Date(selectedDate).toLocaleDateString('tr-TR')}</strong></p>
                    <p>🕐 <strong>{isPrivateTour ? 'Gün Boyu (07:00-20:00)' : selectedTime}</strong></p>
                    <p>🪑 <strong>{isPrivateTour ? 'Tüm koltuklar (özel tur)' : selectedSeats.join(', ') + ' koltukları'}</strong></p>
                  </div>
                </div>

                {/* Banka Bilgileri */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    🏦 Banka Bilgileri
                  </h4>
                  
                  {/* Banka Adı */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Banka</p>
                        <p className="font-bold text-slate-800">{bankInfo.bankName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hesap Sahibi */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Hesap Sahibi</p>
                        <p className="font-bold text-slate-800">{bankInfo.accountHolder}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(bankInfo.accountHolder, 'Hesap sahibi')}
                        className="ml-2 p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all duration-300"
                        title="Hesap sahibini kopyala"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* IBAN */}
                  <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">IBAN</p>
                        <p className="font-bold text-slate-800 font-mono text-lg">{bankInfo.iban}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(bankInfo.iban.replace(/\s/g, ''), 'IBAN')}
                        className="ml-2 p-2 bg-yellow-200 hover:bg-yellow-300 rounded-lg transition-all duration-300"
                        title="IBAN'ı kopyala"
                      >
                        <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Uyarı */}
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-800">
                      <strong>⚠️ Önemli:</strong> Ödeme açıklamasına <strong>"{new Date(selectedDate).toLocaleDateString('tr-TR')} - {isPrivateTour ? 'Özel Tur' : guestCount + ' Kişi'}"</strong> yazınız.
                    </p>
                  </div>
                </div>

                {/* Ödeme Yaptım Butonu */}
                <button
                  onClick={() => {
                    setPaymentCompleted(true);
                    setShowPaymentModal(false);
                    setReservationConfirmed(true);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:via-green-700 hover:to-emerald-700 active:scale-95 shadow-xl hover:shadow-2xl transition-all duration-300 shimmer"
                >
                  ✅ Ödemeyi Yaptım
                </button>

                <p className="text-center text-xs text-gray-600 mt-3">
                  Ödeme yaptıktan sonra bu butona tıklayın
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Onay Aşaması Modal'ı */}
        {reservationConfirmed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">⏳</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Rezervasyonunuz Onay Aşamasında
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ödemeniz alındıktan sonra rezervasyonunuz onaylanacak ve WhatsApp üzerinden bilgilendirileceksiniz.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 text-sm mb-1">📱 İletişim</h4>
                  <p className="text-blue-700 text-xs">
                    Sorularınız için: <strong>0531 089 25 37</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReservationConfirmed(false);
                    setShowPersonalInfoForm(false);
                    // Formu sıfırla
                    setSelectedSeats([]);
                    setSelectedDate('');
                    setSelectedTime('');
                    setGuestCount(1);
                    setIsPrivateTour(false);
                    setGuestInfos([]);
                    setPaymentCompleted(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🏠 Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
