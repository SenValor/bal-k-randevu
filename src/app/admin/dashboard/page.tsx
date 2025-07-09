'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';

interface Reservation {
  id: string;
  reservationNumber: string;
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  isPrivateTour: boolean;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    total: 0,
    todayReservations: 0,
    totalRevenue: 0
  });

  // Rezervasyonları dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
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
        calculateStats(reservationList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateStats = (reservations: Reservation[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const completed = reservations.filter(r => r.status === 'completed').length;
    const total = reservations.length;
    const todayReservations = reservations.filter(r => r.selectedDate === today).length;
    const totalRevenue = reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    setStats({ pending, confirmed, completed, total, todayReservations, totalRevenue });
  };

  // Otomatik tamamlanma kontrolü
  const checkAndCompleteReservations = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Dakika cinsinden
    
    for (const reservation of reservations) {
      if (reservation.status === 'confirmed' && reservation.selectedDate === today) {
        let shouldComplete = false;
        
        // Normal turlar için saat kontrolü
        if (!reservation.isPrivateTour && reservation.selectedTime) {
          const timeRange = reservation.selectedTime.split('-');
          if (timeRange.length === 2) {
            const endTime = timeRange[1].trim();
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const endTimeInMinutes = endHour * 60 + endMinute;
            
            // Tur bitiş saatinden 30 dakika sonra otomatik tamamla
            if (currentTime >= endTimeInMinutes + 30) {
              shouldComplete = true;
            }
          }
        }
        
        // Özel turlar için (6 saat olan turlar)
        if (reservation.isPrivateTour) {
          // Gece 21:00'dan sonra tamamla (turlar max 20:00'da bitiyor)
          if (currentTime >= 21 * 60) {
            shouldComplete = true;
          }
        }
        
        if (shouldComplete) {
          try {
            await updateDoc(doc(db, 'reservations', reservation.id), {
              status: 'completed',
              completedAt: new Date().toISOString(),
              autoCompleted: true
            });
            console.log(`Rezervasyon otomatik tamamlandı: ${reservation.reservationNumber}`);
          } catch (error) {
            console.error('Otomatik tamamlanma hatası:', error);
          }
        }
      }
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
      title: 'Randevu Ekle',
      description: 'Manuel randevu oluştur',
      href: '/admin/add-reservation',
      icon: '➕',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Bekleyen Randevular',
      description: `${stats.pending} randevu bekliyor`,
      href: '/admin/reservations?status=pending',
      icon: '⏳',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Onaylı Randevular',
      description: `${stats.confirmed} randevu onaylı`,
      href: '/admin/reservations?status=confirmed',
      icon: '✅',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Fotoğraf Yönetimi',
      description: 'Website fotoğrafları',
      href: '/admin/photos',
      icon: '📸',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'SSS Yönetimi',
      description: 'Sıkça sorulan sorular',
      href: '/admin/sss',
      icon: '❓',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Sistem Ayarları',
      description: 'Uygulama ayarları',
      href: '/admin/settings',
      icon: '⚙️',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const recentReservations = reservations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                🎣 Balık Sefası
              </Link>
              <span className="text-sm text-gray-500">Admin Dashboard</span>
            </div>
            
            <button
              onClick={() => signOut(auth)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard'a Hoş Geldiniz! 👋
          </h1>
          <p className="text-gray-600">
            Rezervasyon sisteminizi tek yerden yönetin
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
                        {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')} • {reservation.selectedTime}
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