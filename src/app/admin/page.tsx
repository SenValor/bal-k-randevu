'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { createResilientListener } from '@/lib/firestoreHelpers';

interface Boat {
  id: string;
  name: string;
  isActive: boolean;
  status?: 'active' | 'inactive' | 'coming-soon' | 'maintenance';
  statusMessage?: string;
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
  tourType?: 'normal' | 'private' | 'fishing-swimming'; // Tur tipi bilgisi
  selectedBoat?: string; // Seçilen tekne ID'si
  boatName?: string; // Seçilen tekne adı
  guestInfos: Array<{
    name: string;
    surname: string;
    gender: string;
    phone: string;
    age: string;
    email: string;
  }>;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'waiting' | 'received' | 'confirmed';
  createdAt: string;
  totalAmount?: number;
}

export default function AdminPanel() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<string>('all'); // 'all' veya tekne ID'si
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Yerel tarih formatı için yardımcı fonksiyon
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    total: 0,
    todayReservations: 0,
    totalRevenue: 0,
    upcoming: 0
  });

  // Auth kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setShowPasswordModal(false);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Tekneleri dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = createResilientListener(
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
      },
      (error) => {
        console.error('Tekne verilerini dinleme hatası:', error);
        setBoats([]);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Rezervasyonları dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = createResilientListener(
      collection(db, 'reservations'),
      (snapshot) => {
        const reservationList: Reservation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          reservationList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as Reservation);
        });
        
        setReservations(reservationList);
        setLoading(false);
      },
      (error) => {
        console.error('Rezervasyon verilerini dinleme hatası:', error);
        setReservations([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Rezervasyonlar veya seçilen tekne değiştiğinde istatistikleri güncelle
  useEffect(() => {
    const filteredReservations = getFilteredReservations();
    calculateStats(filteredReservations);
  }, [reservations, selectedBoat]);

  // Seçilen tekneye göre rezervasyonları filtrele
  const getFilteredReservations = (): Reservation[] => {
    if (selectedBoat === 'all') {
      return reservations;
    }
    return reservations.filter(r => r.selectedBoat === selectedBoat);
  };

  const calculateStats = (reservations: Reservation[]) => {
    const today = formatLocalDate(new Date());
    
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const completed = reservations.filter(r => r.status === 'completed').length;
    const total = reservations.length;
    const todayReservations = reservations.filter(r => r.selectedDate === today).length;
    const totalRevenue = reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    // Yaklaşan randevuları hesapla
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingCount = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'pending')
      .filter(r => {
        const reservationDate = new Date(r.selectedDate);
        const todayDate = new Date(today);
        return reservationDate >= todayDate && reservationDate <= threeDaysLater;
      }).length;

    setStats({ pending, confirmed, completed, total, todayReservations, totalRevenue, upcoming: upcomingCount });
  };

  // Otomatik tamamlanma kontrolü
  const checkAndCompleteReservations = async () => {
    const now = new Date();
    const today = formatLocalDate(now);
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Dakika cinsinden
    
    for (const reservation of reservations) {
      if (reservation.status === 'confirmed' && reservation.selectedDate === today) {
        let shouldComplete = false;
        
        // Normal turlar için saat kontrolü
        if (!reservation.isPrivateTour && reservation.selectedTime) {
          const timeRange = reservation.selectedTime.split('-');
          if (timeRange.length === 2) {
            const startTime = timeRange[0].trim();
            const endTime = timeRange[1].trim();
            
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            const startTimeInMinutes = startHour * 60 + startMinute;
            let endTimeInMinutes = endHour * 60 + endMinute;
            
            // 🔥 KRİTİK: Gece yarısını geçen turları tespit et (örn: 20:00-02:00)
            // Eğer bitiş saati başlangıç saatinden küçükse, gece seansıdır
            const isNightSession = endTimeInMinutes < startTimeInMinutes;
            
            if (isNightSession) {
              // Gece seansı: Bitiş saati ertesi güne ait
              // Eğer şu anki saat bitiş saatinden küçükse (örn: saat 01:00 ve bitiş 02:00)
              // demek ki hala aynı gece seansındayız
              if (currentTime < startTimeInMinutes) {
                // Şu anki saat gecenin erken saatleri (00:00-06:00 arası genelde)
                // ve başlangıç saatinden önce (örn: şimdi 01:00, başlangıç 20:00)
                // Bitiş saatinden 30 dakika sonra mı kontrol et
                if (currentTime >= endTimeInMinutes + 30) {
                  shouldComplete = true;
                }
              }
              // Eğer şu anki saat başlangıç saatinden büyükse (örn: saat 21:00 ve başlangıç 20:00)
              // demek ki tur henüz devam ediyor, tamamlanmamalı
            } else {
              // Normal gündüz seansı: Bitiş saatinden 30 dakika sonra tamamla
              if (currentTime >= endTimeInMinutes + 30) {
                shouldComplete = true;
              }
            }
          }
        }
        
        // Özel turlar için (6 saat olan turlar)
        if (reservation.isPrivateTour) {
          // Özel turlar için de gece seansı kontrolü yap
          if (reservation.selectedTime) {
            const timeRange = reservation.selectedTime.split('-');
            if (timeRange.length === 2) {
              const startTime = timeRange[0].trim();
              const endTime = timeRange[1].trim();
              
              const [startHour, startMinute] = startTime.split(':').map(Number);
              const [endHour, endMinute] = endTime.split(':').map(Number);
              
              const startTimeInMinutes = startHour * 60 + startMinute;
              let endTimeInMinutes = endHour * 60 + endMinute;
              
              const isNightSession = endTimeInMinutes < startTimeInMinutes;
              
              if (isNightSession) {
                // Gece seansı özel tur
                if (currentTime < startTimeInMinutes && currentTime >= endTimeInMinutes + 30) {
                  shouldComplete = true;
                }
              } else {
                // Normal gündüz özel tur
                if (currentTime >= endTimeInMinutes + 30) {
                  shouldComplete = true;
                }
              }
            }
          } else {
            // Saat bilgisi yoksa eski mantık: Gece 21:00'dan sonra tamamla
            if (currentTime >= 21 * 60) {
              shouldComplete = true;
            }
          }
        }
        
        if (shouldComplete) {
          try {
            await updateDoc(doc(db, 'reservations', reservation.id), {
              status: 'completed',
              completedAt: new Date().toISOString(),
              autoCompleted: true
            });
            console.log(`✅ Rezervasyon otomatik tamamlandı: ${reservation.reservationNumber} (${reservation.selectedTime})`);
          } catch (error) {
            console.error('❌ Otomatik tamamlanma hatası:', error);
          }
        }
      }
    }
  };

  const handleLogin = async () => {
    if (!adminEmail || !adminPassword) return;
    
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setShowPasswordModal(false);
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      alert('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Otomatik kontrol sistemi (her 5 dakikada bir)
  useEffect(() => {
    const interval = setInterval(() => {
      if (reservations.length > 0) {
        checkAndCompleteReservations();
      }
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [reservations]);

  const quickActions = [
    {
      title: 'Rezervasyon Takvimi',
      description: 'Aylık rezervasyon durumunu görüntüle',
      href: '/admin/calendar',
      icon: '📅',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      stats: 'Takvim görünümü'
    },
    {
      title: 'Randevu Yönetimi',
      description: 'Tüm randevuları görüntüle ve yönet',
      href: '/admin/reservations',
      icon: '📋',
      color: 'bg-blue-500 hover:bg-blue-600',
      stats: `${stats.total} toplam randevu`
    },
    {
      title: 'Bekleyen Randevular',
      description: 'Onay bekleyen randevular',
      href: '/admin/reservations?status=pending',
      icon: '⏳',
      color: 'bg-orange-500 hover:bg-orange-600',
      stats: `${stats.pending} bekleyen`
    },
    {
      title: 'Onaylı Randevular',
      description: 'Onaylanmış randevular',
      href: '/admin/reservations?status=confirmed',
      icon: '✅',
      color: 'bg-green-500 hover:bg-green-600',
      stats: `${stats.confirmed} onaylı`
    },
    {
      title: 'Hakkımızda Düzenle',
      description: 'Soru-cevap içeriklerini düzenle',
      href: '/admin/hakkimizda',
      icon: '📝',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      stats: 'İçerik yönetimi'
    },
    {
      title: 'Fotoğraf Yönetimi',
      description: 'Website fotoğraflarını yönet',
      href: '/admin/photos',
      icon: '📸',
      color: 'bg-purple-500 hover:bg-purple-600',
      stats: 'Galeri yönetimi'
    },
    {
      title: 'SSS Yönetimi',
      description: 'Sıkça sorulan soruları yönet',
      href: '/admin/sss',
      icon: '❓',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      stats: 'Sorular & Cevaplar'
    },
    {
      title: 'Tekne Yönetimi',
      description: 'Tekneleri yönet, saat ayarları, fotoğraf ekle, oturma düzeni ayarla',
      href: '/admin/boats',
      icon: '⛵',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      stats: 'Tekne & Saat ayarları'
    },
    {
      title: 'Kara Liste',
      description: 'Gelmeyen müşterileri yönet',
      href: '/admin/blacklist',
      icon: '🚫',
      color: 'bg-red-500 hover:bg-red-600',
      stats: 'Müşteri takip'
    },
    {
      title: 'Sistem Ayarları',
      description: 'Uygulama ayarlarını düzenle',
      href: '/admin/settings',
      icon: '⚙️',
      color: 'bg-gray-500 hover:bg-gray-600',
      stats: 'Genel ayarlar'
    }
  ];

  const filteredReservations = getFilteredReservations();
  
  const recentReservations = filteredReservations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Yaklaşan randevuları hesapla (3 gün içinde)
  const getUpcomingReservations = () => {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    return filteredReservations
      .filter(r => r.status === 'confirmed' || r.status === 'pending')
      .filter(r => {
        const reservationDate = new Date(r.selectedDate);
        return reservationDate >= today && reservationDate <= threeDaysLater;
      })
      .sort((a, b) => new Date(a.selectedDate).getTime() - new Date(b.selectedDate).getTime());
  };

  const upcomingReservations = getUpcomingReservations();

  // Gün sayısını hesapla
  const getDaysUntilReservation = (date: string) => {
    const today = new Date();
    const reservationDate = new Date(date);
    const diffTime = reservationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Aciliyet rengini belirle
  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-red-100 border-red-300 text-red-800';
    if (daysUntil === 1) return 'bg-orange-100 border-orange-300 text-orange-800';
    if (daysUntil === 2) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  // Aciliyet metni
  const getUrgencyText = (daysUntil: number) => {
    if (daysUntil === 0) return 'BUGÜN';
    if (daysUntil === 1) return 'YARIN';
    if (daysUntil === 2) return '2 GÜN SONRA';
    return `${daysUntil} GÜN SONRA`;
  };

  // Giriş modalı
  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 Admin Girişi</h2>
            <p className="text-gray-600">Lütfen admin bilgilerinizi girin</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            
            <input
              type="password"
              placeholder="Şifreniz"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {authLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
                🎣 Balık Sefası
              </Link>
              <span className="hidden sm:block text-sm text-gray-500">Admin Dashboard</span>
              
              {/* Tekne Seçici */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">⛵</span>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tüm Tekneler</option>
                  {boats.map((boat, index) => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} (T{index + 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/admin/calendar"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-indigo-400"
                title="Rezervasyon Takvimi"
              >
                <span className="text-base sm:text-lg">📅</span>
                <span className="hidden sm:inline">Rezervasyon Takvimi</span>
                <span className="sm:hidden">Takvim</span>
              </Link>
              
              <button
                onClick={() => signOut(auth)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Çıkış Yap</span>
                <span className="sm:hidden">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard'a Hoş Geldiniz! 👋
              </h1>
              <p className="text-gray-600">
                Rezervasyon sisteminizi tek yerden yönetin
              </p>
            </div>
            
            {/* Mobil Tekne Seçici */}
            <div className="md:hidden">
              <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 px-3 py-2">
                <span className="text-blue-600">⛵</span>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  className="text-sm focus:outline-none bg-transparent flex-1"
                >
                  <option value="all">Tüm Tekneler</option>
                  {boats.map((boat, index) => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} (T{index + 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Seçilen Tekne Bilgisi */}
          {selectedBoat !== 'all' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">⛵</span>
                <span className="text-blue-800 font-medium">
                  {boats.find(b => b.id === selectedBoat)?.name} istatistikleri gösteriliyor
                </span>
                <button
                  onClick={() => setSelectedBoat('all')}
                  className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Tüm tekneleri göster
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Yaklaşan (3 Gün)</p>
                <p className="text-3xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="text-4xl opacity-80">⚡</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Bekleyen Randevular</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="text-4xl opacity-80">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Onaylı Randevular</p>
                <p className="text-3xl font-bold">{stats.confirmed}</p>
              </div>
              <div className="text-4xl opacity-80">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tamamlanan</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Toplam Randevu</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`${action.color} text-white p-6 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{action.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                    <p className="text-xs opacity-75 mt-1">{action.stats}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Yaklaşan Randevular */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">⚡ Yaklaşan Randevular (3 Gün)</h2>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {upcomingReservations.length} randevu
            </span>
          </div>
          
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-600">Yaklaşan 3 gün içinde randevu yok</p>
              <p className="text-sm text-gray-500 mt-1">Harika! Şimdilik rahat durabilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => {
                const daysUntil = getDaysUntilReservation(reservation.selectedDate);
                return (
                  <div
                    key={reservation.id}
                    className={`border-l-4 pl-4 py-4 rounded-lg ${getUrgencyColor(daysUntil)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-lg">
                            {daysUntil === 0 ? '🔥' : daysUntil === 1 ? '⚡' : '📅'}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            {reservation.guestInfos[0]?.name} {reservation.guestInfos[0]?.surname}
                          </p>
                          <p className="text-sm opacity-75">
                            📞 {reservation.guestInfos[0]?.phone} | 👥 {reservation.guestCount} kişi
                          </p>
                          <p className="text-sm opacity-75">
                            📅 {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')} • {reservation.selectedTime}
                          </p>
                          <p className="text-sm opacity-75">
                            🚢 {
                          reservation.tourType === 'fishing-swimming' ? 'Balık + Yüzme Turu' :
                          reservation.tourType === 'private' ? 'Kapalı Tur (Özel)' :
                          'Normal Tur'
                        } • 💺 {reservation.selectedSeats.join(', ')}
                          </p>
                          {reservation.boatName && (
                            <p className="text-sm opacity-75">
                              ⛵ Tekne: {reservation.boatName}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-1">
                            📝 Rezervasyon: {new Date(reservation.createdAt).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold mb-1">
                          {getUrgencyText(daysUntil)}
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                            reservation.status === 'confirmed' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                          }`}>
                            {reservation.status === 'pending' ? 'Bekliyor' : 'Onaylı'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.paymentStatus === 'waiting' ? 'bg-yellow-200 text-yellow-800' :
                            reservation.paymentStatus === 'received' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                          }`}>
                            💳 {reservation.paymentStatus === 'waiting' ? 'Bekliyor' : 
                                reservation.paymentStatus === 'received' ? 'Alındı' : 'Onaylı'}
                          </span>
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          #{reservation.reservationNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="text-center pt-4 border-t">
                <Link
                  href="/admin/reservations"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Tüm Randevuları Yönet →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Son Randevular</h2>
          
          {recentReservations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-600">Henüz randevu yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      reservation.status === 'pending' ? 'bg-orange-500' :
                      reservation.status === 'confirmed' ? 'bg-blue-500' :
                      reservation.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.guestInfos[0]?.name} {reservation.guestInfos[0]?.surname}
                      </p>
                      <p className="text-sm text-gray-600">
                        Randevu: {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')} • {reservation.selectedTime}
                      </p>
                      <p className="text-xs text-blue-600">
                        Rezervasyon: {new Date(reservation.createdAt).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      reservation.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      reservation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status === 'pending' ? 'Bekliyor' :
                       reservation.status === 'confirmed' ? 'Onaylı' :
                       reservation.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Link
                  href="/admin/reservations"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tüm Randevuları Görüntüle →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 