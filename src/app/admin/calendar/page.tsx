'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface Boat {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  isPrivateTour: boolean;
  selectedBoat?: string; // Seçilen tekne ID'si
  boatName?: string; // Seçilen tekne adı
  guestInfos: Array<{
    name: string;
    surname: string;
    phone: string;
    email: string;
  }>;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'waiting' | 'received' | 'confirmed';
  createdAt: string;
  totalAmount?: number;
}

interface DayStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  seats: number;
  reservations: Reservation[];
}

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [monthStats, setMonthStats] = useState<{[key: string]: DayStats}>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoatFilter, setSelectedBoatFilter] = useState<string>(''); // '' = Tüm Tekneler

  // Tekneleri çek
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'boats'),
      (snapshot) => {
        const boatList: Boat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          boatList.push({
            id: doc.id,
            name: data.name,
            isActive: data.isActive,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        });
        
        setBoats(boatList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
    );

    return () => unsubscribe();
  }, []);

  // Tekne sırası belirleme (T1, T2, T3...)
  const getBoatOrder = (boatId: string) => {
    const index = boats.findIndex(boat => boat.id === boatId);
    return index >= 0 ? `T${index + 1}` : 'T?';
  };

  // Ayın rezervasyonlarını çek
  useEffect(() => {
    const fetchMonthReservations = async () => {
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
        
        // Tekne filtresi ile query oluştur
        let q;
        if (selectedBoatFilter) {
          // Belirli tekne seçildi
          q = query(
            collection(db, 'reservations'),
            where('selectedDate', '>=', firstDay),
            where('selectedDate', '<=', lastDay),
            where('selectedBoat', '==', selectedBoatFilter)
          );
        } else {
          // Tüm tekneler - tüm rezervasyonları getir
          q = query(
            collection(db, 'reservations'),
            where('selectedDate', '>=', firstDay),
            where('selectedDate', '<=', lastDay)
          );
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allReservations: Reservation[] = [];
          const dayStats: {[key: string]: DayStats} = {};
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const reservation: Reservation = {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as Reservation;
            
            allReservations.push(reservation);
            
            const dateKey = reservation.selectedDate;
            if (!dayStats[dateKey]) {
              dayStats[dateKey] = {
                total: 0,
                pending: 0,
                confirmed: 0,
                completed: 0,
                cancelled: 0,
                revenue: 0,
                seats: 0,
                reservations: []
              };
            }
            
            dayStats[dateKey].total++;
            dayStats[dateKey][reservation.status]++;
            dayStats[dateKey].reservations.push(reservation);
            
            if (reservation.status === 'completed') {
              dayStats[dateKey].revenue += reservation.totalAmount || 0;
            }
            
            if (reservation.isPrivateTour) {
              dayStats[dateKey].seats += 12;
            } else {
              dayStats[dateKey].seats += reservation.selectedSeats?.length || 0;
            }
          });
          
          setReservations(allReservations);
          setMonthStats(dayStats);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Rezervasyonlar yüklenirken hata:', error);
        setLoading(false);
      }
    };

    fetchMonthReservations();
  }, [currentMonth, selectedBoatFilter]); // selectedBoatFilter dependency eklendi

  // Takvim günlerini oluştur
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
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
        isToday: false
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }
    
    // Sonraki ayın günleri
    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
      const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getDayColor = (stats: DayStats | undefined, isCurrentMonth: boolean, isToday: boolean) => {
    if (!isCurrentMonth) return 'text-gray-400 bg-gray-50';
    if (isToday) return 'bg-blue-100 border-2 border-blue-500 text-blue-800 font-bold';
    if (!stats || stats.total === 0) return 'text-gray-700 hover:bg-gray-100';
    
    // Tekne filtresi varsa tek tekne (24), yoksa tüm tekneler (boats.length * 24)
    const maxSeats = selectedBoatFilter ? 24 : (boats.length * 24 || 24);
    const occupancyRate = stats.seats / maxSeats;
    
    if (occupancyRate >= 1) return 'bg-red-100 text-red-800 border border-red-300';
    if (occupancyRate >= 0.75) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (occupancyRate >= 0.5) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-green-100 text-green-800 border border-green-300';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const calendarDays = getCalendarDays(currentMonth);
  const selectedDayStats = selectedDay ? monthStats[selectedDay] : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">📅 Rezervasyon Takvimi</h1>
            </div>
            
            {/* Tekne Filtresi */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">🚢 Tekne:</span>
              <select
                value={selectedBoatFilter}
                onChange={(e) => setSelectedBoatFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tüm Tekneler</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name} ({getBoatOrder(boat.id)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Sol Taraf: Takvim */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              
              {/* Takvim Başlığı */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevMonth}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                  >
                    <span className="text-white font-bold text-lg">‹</span>
                  </button>
                  
                  <h2 className="text-2xl font-bold">
                    {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </h2>
                  
                  <button
                    onClick={nextMonth}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                  >
                    <span className="text-white font-bold text-lg">›</span>
                  </button>
                </div>
              </div>

              {/* Hafta Günleri */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                  <div key={day} className="p-4 text-center">
                    <span className="text-sm font-bold text-gray-600">{day}</span>
                  </div>
                ))}
              </div>

              {/* Takvim Günleri */}
              <div className="grid grid-cols-7">
                {calendarDays.map((dayInfo, index) => {
                  const stats = monthStats[dayInfo.date];
                  const dayColor = getDayColor(stats, dayInfo.isCurrentMonth, dayInfo.isToday);
                  const isSelected = selectedDay === dayInfo.date;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (dayInfo.isCurrentMonth) {
                          setSelectedDay(selectedDay === dayInfo.date ? null : dayInfo.date);
                        }
                      }}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-200 transition-all duration-300 hover:bg-gray-50 ${dayColor} ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="h-full flex flex-col">
                        {/* Gün Numarası */}
                        <div className="text-lg font-bold mb-1">{dayInfo.day}</div>
                        
                        {/* İstatistikler */}
                        {stats && dayInfo.isCurrentMonth && (
                          <div className="flex-1 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>📋</span>
                              <span className="font-medium">{stats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>💺</span>
                              <span className="font-medium">{stats.seats}/{selectedBoatFilter ? 24 : (boats.length * 24 || 24)}</span>
                            </div>
                            {stats.revenue > 0 && (
                              <div className="text-green-700 font-bold text-xs">
                                {formatCurrency(stats.revenue)}
                              </div>
                            )}
                            {/* Durum göstergeleri */}
                            <div className="flex justify-center space-x-1 mt-2">
                              {stats.pending > 0 && (
                                <span className="w-2 h-2 rounded-full bg-orange-500" title={`${stats.pending} bekleyen`}></span>
                              )}
                              {stats.confirmed > 0 && (
                                <span className="w-2 h-2 rounded-full bg-blue-500" title={`${stats.confirmed} onaylı`}></span>
                              )}
                              {stats.completed > 0 && (
                                <span className="w-2 h-2 rounded-full bg-green-500" title={`${stats.completed} tamamlandı`}></span>
                              )}
                              {stats.cancelled > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500" title={`${stats.cancelled} iptal`}></span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Renk Açıklaması */}
            <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Doluluk Oranı</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm text-gray-700">Az dolu (&lt;50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-700">Orta (50-75%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                  <span className="text-sm text-gray-700">Dolu (75-100%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm text-gray-700">Tamamen dolu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf: Seçili Gün Detayları */}
          <div className="xl:col-span-1">
            {selectedDay && selectedDayStats ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📅 {new Date(selectedDay).toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </h3>

                {/* Özet İstatistikler */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">{selectedDayStats.total}</div>
                    <div className="text-sm text-blue-600">Toplam Rezervasyon</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-800">{selectedDayStats.seats}/24</div>
                    <div className="text-sm text-green-600">Koltuk Doluluk</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 col-span-2">
                    <div className="text-2xl font-bold text-purple-800">{formatCurrency(selectedDayStats.revenue)}</div>
                    <div className="text-sm text-purple-600">Günlük Gelir</div>
                  </div>
                </div>

                {/* Durum Dağılımı */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">📊 Durum Dağılımı</h4>
                  <div className="space-y-2">
                    {selectedDayStats.pending > 0 && (
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor('pending')}`}>
                          {getStatusText('pending')}
                        </span>
                        <span className="font-bold">{selectedDayStats.pending}</span>
                      </div>
                    )}
                    {selectedDayStats.confirmed > 0 && (
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor('confirmed')}`}>
                          {getStatusText('confirmed')}
                        </span>
                        <span className="font-bold">{selectedDayStats.confirmed}</span>
                      </div>
                    )}
                    {selectedDayStats.completed > 0 && (
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor('completed')}`}>
                          {getStatusText('completed')}
                        </span>
                        <span className="font-bold">{selectedDayStats.completed}</span>
                      </div>
                    )}
                    {selectedDayStats.cancelled > 0 && (
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor('cancelled')}`}>
                          {getStatusText('cancelled')}
                        </span>
                        <span className="font-bold">{selectedDayStats.cancelled}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rezervasyon Listesi */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">📋 Rezervasyonlar</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedDayStats.reservations.map((reservation) => (
                      <div key={reservation.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{reservation.reservationNumber}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(reservation.status)}`}>
                            {getStatusText(reservation.status)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>👤 {reservation.guestInfos?.[0]?.name} {reservation.guestInfos?.[0]?.surname}</div>
                          <div>🕐 {reservation.selectedTime}</div>
                          <div>👥 {reservation.guestCount} kişi</div>
                          {reservation.selectedBoat && (
                            <div>🚢 {reservation.boatName || getBoatOrder(reservation.selectedBoat)}</div>
                          )}
                          <div>💺 {reservation.selectedSeats.join(', ')}</div>
                          {reservation.totalAmount && (
                            <div>💰 {formatCurrency(reservation.totalAmount)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hızlı Aksiyonlar */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link
                    href={`/admin/reservations?date=${selectedDay}`}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center block"
                  >
                    Detaylı Yönetim →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Gün Seçin</h3>
                <p className="text-gray-600 text-sm">
                  Rezervasyon detaylarını görmek için takvimden bir gün seçin
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 