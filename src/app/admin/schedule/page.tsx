'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface TimeSlot {
  start: string;
  end: string;
  id: string;
}

interface DaySchedule {
  date: string;
  timeSlots: TimeSlot[];
  isCustom: boolean;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: 'morning', start: '07:00', end: '13:00' },
  { id: 'afternoon', start: '14:00', end: '20:00' }
];

export default function ScheduleManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentSchedule, setCurrentSchedule] = useState<TimeSlot[]>(defaultTimeSlots);
  const [isCustomDay, setIsCustomDay] = useState<boolean>(false);

  // Takvim için
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customDates, setCustomDates] = useState<string[]>([]);

  // Auth kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Özel günleri çek
  useEffect(() => {
    fetchCustomDates();
  }, [currentMonth]);

  // Seçilen gün değiştiğinde saatleri çek
  useEffect(() => {
    if (selectedDate) {
      fetchDaySchedule(selectedDate);
    }
  }, [selectedDate]);

  const fetchCustomDates = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      
      const startDateStr = formatLocalDate(year, month, 1);
      const endDateStr = formatLocalDate(year, month, lastDay);
      
      const schedulesRef = collection(db, 'schedules');
      // Index kullanarak direkt Firebase'de filtrele (daha performanslı)
      const q = query(
        schedulesRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr),
        where('isCustom', '==', true)
      );
      
      const snapshot = await getDocs(q);
      // Artık sadece isCustom: true olanlar geliyor
      const dates = snapshot.docs.map(doc => doc.data().date);
      setCustomDates(dates);
    } catch (error) {
      console.error('Özel günler çekilemedi:', error);
    }
  };

  const fetchDaySchedule = async (date: string) => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', date));
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        setCurrentSchedule(data.timeSlots || defaultTimeSlots);
        setIsCustomDay(true);
      } else {
        setCurrentSchedule(defaultTimeSlots);
        setIsCustomDay(false);
      }
    } catch (error) {
      console.error('Günlük program çekilemedi:', error);
      setCurrentSchedule(defaultTimeSlots);
      setIsCustomDay(false);
    }
  };

  const saveDaySchedule = async () => {
    if (!selectedDate) {
      alert('Lütfen bir tarih seçin');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'schedules', selectedDate), {
        date: selectedDate,
        timeSlots: currentSchedule,
        isCustom: true,
        updatedAt: new Date()
      });
      
      setIsCustomDay(true);
      fetchCustomDates(); // Özel günleri yenile
      alert('Günlük program başarıyla kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme hatası! Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!selectedDate) {
      alert('Lütfen bir tarih seçin');
      return;
    }

    if (!confirm('Bu günü varsayılan saatlere döndürmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Firestore'dan sil
      await setDoc(doc(db, 'schedules', selectedDate), {
        date: selectedDate,
        timeSlots: defaultTimeSlots,
        isCustom: false,
        deletedAt: new Date()
      });
      
      setCurrentSchedule(defaultTimeSlots);
      setIsCustomDay(false);
      fetchCustomDates();
      alert('Gün varsayılan saatlere döndürüldü!');
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
      alert('Sıfırlama hatası! Lütfen tekrar deneyin.');
    }
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot_${Date.now()}`,
      start: '09:00',
      end: '15:00'
    };
    setCurrentSchedule([...currentSchedule, newSlot]);
  };

  const updateTimeSlot = (id: string, field: 'start' | 'end', value: string) => {
    setCurrentSchedule(prev => prev.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const deleteTimeSlot = (id: string) => {
    if (currentSchedule.length <= 1) {
      alert('En az bir saat dilimi olmalıdır');
      return;
    }
    setCurrentSchedule(prev => prev.filter(slot => slot.id !== id));
  };

  // Yerel tarih formatı için yardımcı fonksiyon
  const formatLocalDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Takvim render fonksiyonları
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Önceki ayın günleri
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = new Date(year, month, -i).getDate();
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = formatLocalDate(prevYear, prevMonth, dayNum);
      
      days.push({
        date: dayNum,
        dateString,
        isCurrentMonth: false,
        isCustom: false
      });
    }
    
    // Bu ayın günleri
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateString = formatLocalDate(year, month, i);
      days.push({
        date: i,
        dateString,
        isCurrentMonth: true,
        isCustom: customDates.includes(dateString)
      });
    }
    
    // Sonraki ayın günleri
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateString = formatLocalDate(nextYear, nextMonth, i);
      
      days.push({
        date: i,
        dateString,
        isCurrentMonth: false,
        isCustom: false
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Giriş Gerekli</h2>
          <p className="text-gray-600 mb-6">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
          <Link href="/admin" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
            Admin Paneline Git
          </Link>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Admin Panel
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">⏰ Saat Yönetimi</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Bilgi Kartı */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">ℹ️</div>
            <div>
              <h3 className="text-blue-800 font-semibold mb-2">Günlük Saat Yönetimi</h3>
              <p className="text-blue-700 text-sm mb-2">
                Belirli günler için özel saat dilimleri ayarlayabilirsiniz. 
                Özel ayar yapılmayan günlerde varsayılan saatler kullanılır.
              </p>
              <div className="flex items-center space-x-2 text-blue-600 text-xs">
                <span>🕐 Varsayılan: 07:00-13:00, 14:00-20:00</span>
                <span>•</span>
                <span>⚙️ Gün bazlı özelleştirme</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol: Takvim */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">📅 Takvim</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ←
                </button>
                <h3 className="text-lg font-medium text-gray-800 min-w-[150px] text-center">
                  {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* Takvim Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-200 relative
                    ${day.isCurrentMonth 
                      ? day.dateString === selectedDate
                        ? 'bg-blue-500 text-white' 
                        : day.isCustom
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                    }
                  `}
                  disabled={!day.isCurrentMonth}
                >
                  {day.date}
                  {day.isCustom && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Legenda */}
            <div className="mt-4 flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Seçili</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Özel Saat</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-50 border border-gray-300 rounded"></div>
                <span>Varsayılan</span>
              </div>
            </div>
          </div>

          {/* Sağ: Saat Düzenleme */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">⏰ Saat Düzenleme</h2>
              {selectedDate && (
                <div className="text-sm text-gray-600">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-lg font-medium mb-2">Tarih Seçin</p>
                <p className="text-sm">Saat düzenlemek için soldaki takvimden bir tarih seçin</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Durum Göstergesi */}
                <div className={`p-3 rounded-lg border ${
                  isCustomDay 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isCustomDay ? 'bg-orange-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {isCustomDay ? 'Özel Saat Düzenlemesi' : 'Varsayılan Saatler'}
                    </span>
                  </div>
                </div>

                {/* Saat Slotları */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Saat Dilimleri</h3>
                    <button
                      onClick={addTimeSlot}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      + Saat Ekle
                    </button>
                  </div>

                  {currentSchedule.map((slot, index) => (
                    <div key={slot.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 w-12">#{index + 1}</span>
                      
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      
                      <span className="text-gray-500">-</span>
                      
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      
                      <button
                        onClick={() => deleteTimeSlot(slot.id)}
                        disabled={currentSchedule.length <= 1}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                {/* Aksiyonlar */}
                <div className="flex space-x-3">
                  <button
                    onClick={saveDaySchedule}
                    disabled={saving}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
                  </button>
                  
                  {isCustomDay && (
                    <button
                      onClick={resetToDefault}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      🔄 Varsayılana Dön
                    </button>
                  )}
                </div>

                {/* Örnek */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Önizleme</h4>
                  <div className="space-y-1">
                    {currentSchedule.map((slot, index) => (
                      <div key={slot.id} className="text-sm text-blue-700">
                        Seans {index + 1}: {slot.start} - {slot.end}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 