'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface Reservation {
  id: string;
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
  }>;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'waiting' | 'received' | 'confirmed';
  createdAt: string;
}

export default function AdminPanel() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingReservation, setEditingReservation] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    selectedDate: string;
    selectedTime: string;
  }>({ selectedDate: '', selectedTime: '' });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Gelişmiş düzenleme için state'ler
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingFullReservation, setEditingFullReservation] = useState<Reservation | null>(null);
  const [fullEditForm, setFullEditForm] = useState<Partial<Reservation>>({});

  // Auth state listener - kullanıcının giriş durumunu kontrol et
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kullanıcı giriş yapmış
        setIsAuthenticated(true);
        setShowPasswordModal(false);
        console.log('Kullanıcı zaten giriş yapmış:', user.email);
      } else {
        // Kullanıcı giriş yapmamış
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase'den rezervasyonları real-time dinle
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      
      const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
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
        console.log('Admin panel - real-time rezervasyonlar güncellendi:', reservationList.length);
      }, (error) => {
        console.error('Rezervasyon listener hatası:', error);
        alert('Rezervasyonlar dinlenirken hata oluştu!');
        setLoading(false);
      });

      // Cleanup
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!adminEmail || !adminPassword) {
      alert('Lütfen email ve şifre girin!');
      return;
    }

    setLoading(true);
    try {
      // Firebase Authentication ile giriş yap
      await signInWithEmailAndPassword(auth, adminEmail.toLowerCase(), adminPassword);
      
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setAdminEmail(''); // Email'i temizle
      setAdminPassword(''); // Şifreyi temizle
      console.log('Admin başarıyla giriş yaptı');
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      
      // Firebase Auth hata kodlarına göre kullanıcı dostu mesajlar
      let errorMessage = 'Giriş sırasında bir hata oluştu!';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı!';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Hatalı şifre!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi!';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Bu kullanıcı hesabı devre dışı bırakılmış!';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin!';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // Manuel ödeme onaylama
  const markPaymentReceived = async (reservationId: string) => {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        paymentStatus: 'received'
      });
      // Real-time listener otomatik güncelleyecek, local state güncelleme gerekmiyor
    } catch (error) {
      console.error('Ödeme durumu güncellenemedi:', error);
      alert('Ödeme durumu güncellenirken hata oluştu!');
    }
  };

  // Rezervasyon onaylama
  const approveReservation = async (reservationId: string) => {
    try {
      // WhatsApp mesajı için rezervasyon bilgisi
      const reservation = reservations.find(r => r.id === reservationId);
      
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'confirmed'
      });

      // Real-time listener otomatik güncelleyecek

      // WhatsApp mesajı gönder
      if (reservation && reservation.guestInfos[0]) {
        const phone = reservation.guestInfos[0].phone.replace(/\s/g, '').replace(/^0/, '90');
        const message = `Merhaba ${reservation.guestInfos[0].name} ${reservation.guestInfos[0].surname}! 
        
🎉 Rezervasyonunuz onaylandı!

📅 Tarih: ${new Date(reservation.selectedDate).toLocaleDateString('tr-TR')}
🕐 Saat: ${reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}
👥 Kişi: ${reservation.guestCount}
${reservation.isPrivateTour ? '⭐ Özel Tur - Tüm Tekne' : '🪑 Koltuklar: ' + reservation.selectedSeats.join(', ')}

📍 Buluşma: Eyüp Odabaşı Sporcular Parkı
⚓ İyi eğlenceler dileriz!

Balık Sefası Ekibi`;

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Rezervasyon onaylanamadı:', error);
      alert('Rezervasyon onaylanırken hata oluştu!');
    }
  };

  // Rezervasyon reddetme
  const rejectReservation = async (reservationId: string) => {
    if (confirm('Bu rezervasyonu reddetmek istediğinizden emin misiniz?')) {
      try {
        const reservationRef = doc(db, 'reservations', reservationId);
        await updateDoc(reservationRef, {
          status: 'cancelled'
        });
        // Real-time listener otomatik güncelleyecek
      } catch (error) {
        console.error('Rezervasyon reddedilemedi:', error);
        alert('Rezervasyon reddedilirken hata oluştu!');
      }
    }
  };

  // Tarih/saat düzenleme
  const updateDateTime = async (reservationId: string) => {
    if (!editForm.selectedDate || !editForm.selectedTime) {
      alert('Lütfen tarih ve saat seçin!');
      return;
    }

    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        selectedDate: editForm.selectedDate,
        selectedTime: editForm.selectedTime
      });

      // Real-time listener otomatik güncelleyecek

      setEditingReservation(null);
      setEditForm({ selectedDate: '', selectedTime: '' });
    } catch (error) {
      console.error('Tarih/saat güncellenemedi:', error);
      alert('Tarih/saat güncellenirken hata oluştu!');
    }
  };

  const cancelReservation = async (reservationId: string) => {
    if (confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
      try {
        const reservationRef = doc(db, 'reservations', reservationId);
        await updateDoc(reservationRef, {
          status: 'cancelled'
        });
        // Real-time listener otomatik güncelleyecek
      } catch (error) {
        console.error('Rezervasyon iptal edilemedi:', error);
        alert('Rezervasyon iptal edilirken hata oluştu!');
      }
    }
  };

  // Rezervasyon silme (tamamen Firebase'den silme)
  const deleteReservation = async (reservationId: string) => {
    if (confirm('Bu rezervasyonu KALICI OLARAK silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!')) {
      if (confirm('Son kez soruyorum: Rezervasyonu tamamen silmek istediğinizden emin misiniz?')) {
        try {
          const reservationRef = doc(db, 'reservations', reservationId);
          await deleteDoc(reservationRef);
          // Real-time listener otomatik güncelleyecek
          alert('Rezervasyon başarıyla silindi!');
        } catch (error) {
          console.error('Rezervasyon silinemedi:', error);
          alert('Rezervasyon silinirken hata oluştu!');
        }
      }
    }
  };

  // Gelişmiş düzenleme modal'ını aç
  const openEditModal = (reservation: Reservation) => {
    setEditingFullReservation(reservation);
    setFullEditForm({
      guestCount: reservation.guestCount,
      selectedDate: reservation.selectedDate,
      selectedTime: reservation.selectedTime,
      selectedSeats: [...reservation.selectedSeats],
      isPrivateTour: reservation.isPrivateTour,
      guestInfos: reservation.guestInfos.map(guest => ({...guest})),
      status: reservation.status,
      paymentStatus: reservation.paymentStatus
    });
    setShowEditModal(true);
  };

  // Gelişmiş düzenleme kaydet
  const saveFullEdit = async () => {
    if (!editingFullReservation || !fullEditForm) return;

    try {
      const reservationRef = doc(db, 'reservations', editingFullReservation.id);
      await updateDoc(reservationRef, fullEditForm);
      
      setShowEditModal(false);
      setEditingFullReservation(null);
      setFullEditForm({});
      alert('Rezervasyon başarıyla güncellendi!');
    } catch (error) {
      console.error('Rezervasyon güncellenemedi:', error);
      alert('Rezervasyon güncellenirken hata oluştu!');
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'pending') return res.status === 'pending';
    if (activeTab === 'confirmed') return res.status === 'confirmed';
    return true; // all
  });

  // Auth loading durumu
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl text-white">🔄</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Yükleniyor...</h2>
          <p className="text-gray-600 mt-2">Giriş durumu kontrol ediliyor</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        {showPasswordModal && (
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🔐</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Admin Girişi</h2>
              <p className="text-gray-600 mt-2">Yönetim paneline erişim için şifre girin</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Email adresinizi girin"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Şifre</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Şifrenizi girin"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? '🔄 Kontrol Ediliyor...' : '🚀 Giriş Yap'}
              </button>

              <div className="text-center">
                <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  ← Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">🎛️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
                <p className="text-sm text-gray-600">Rezervasyon Yönetimi</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link 
                href="/"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-all duration-300"
              >
                🏠 Ana Sayfa
              </Link>
              <button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    setIsAuthenticated(false);
                    setShowPasswordModal(true);
                    setAdminEmail('');
                    setAdminPassword('');
                    console.log('Admin çıkış yaptı');
                  } catch (error) {
                    console.error('Çıkış hatası:', error);
                    alert('Çıkış yapılırken hata oluştu!');
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300"
              >
                🚪 Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen Rezervasyonlar</p>
                <p className="text-3xl font-bold text-orange-600">
                  {reservations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Onaylanmış Rezervasyonlar</p>
                <p className="text-3xl font-bold text-green-600">
                  {reservations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Rezervasyon</p>
                <p className="text-3xl font-bold text-blue-600">{reservations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'pending', label: 'Bekleyen', icon: '⏳', count: reservations.filter(r => r.status === 'pending').length },
                { key: 'confirmed', label: 'Onaylanmış', icon: '✅', count: reservations.filter(r => r.status === 'confirmed').length },
                { key: 'all', label: 'Tümü', icon: '📋', count: reservations.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Rezervasyon Listesi */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">⏳</span>
              </div>
              <h3 className="text-lg font-bold text-blue-600 mb-2">Yükleniyor...</h3>
              <p className="text-gray-500">Rezervasyonlar getiriliyor.</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">Rezervasyon Bulunamadı</h3>
              <p className="text-gray-500">Bu kategoride henüz rezervasyon bulunmuyor.</p>
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Rezervasyon Header */}
                <div className={`p-4 ${
                  reservation.isPrivateTour 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                } text-white`}>
                  <div className="flex items-center justify-between">
                                         <div className="flex items-center space-x-3">
                       <span className="text-2xl">
                         {reservation.isPrivateTour ? '⭐' : '🎣'}
                       </span>
                       <div>
                         <h3 className="font-bold text-lg text-white">
                           {reservation.isPrivateTour ? 'Özel Tur' : 'Normal Rezervasyon'}
                         </h3>
                         <p className="text-sm opacity-90 text-white">
                           #{reservation.id} • {reservation.guestCount} kişi
                         </p>
                       </div>
                     </div>
                    
                                         <div className="text-right">
                       <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                         reservation.status === 'pending' 
                           ? 'bg-orange-100 text-orange-800' 
                           : reservation.status === 'confirmed'
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {reservation.status === 'pending' ? '⏳ Manuel Kontrol Bekliyor' : 
                          reservation.status === 'confirmed' ? '✅ Onaylandı' : '❌ İptal/Reddedildi'}
                       </div>
                     </div>
                  </div>
                </div>

                {/* Rezervasyon Detayları */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                         {/* Sol: Tarih ve Saat Bilgileri */}
                     <div className="space-y-4">
                       <div>
                         <div className="flex items-center justify-between mb-2">
                           <h4 className="font-bold text-slate-800">📅 Rezervasyon Detayları</h4>
                           {reservation.status === 'pending' && !reservation.isPrivateTour && (
                             <button
                               onClick={() => {
                                 setEditingReservation(reservation.id);
                                 setEditForm({
                                   selectedDate: reservation.selectedDate,
                                   selectedTime: reservation.selectedTime
                                 });
                               }}
                               className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-lg transition-all duration-300"
                             >
                               ✏️ Düzenle
                             </button>
                           )}
                           {reservation.status === 'pending' && reservation.isPrivateTour && (
                             <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded-lg">
                               ⭐ Özel Tur - Düzenlenemez
                             </span>
                           )}
                         </div>

                         {editingReservation === reservation.id ? (
                           <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                             <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Tarih</label>
                               <input
                                 type="date"
                                 value={editForm.selectedDate}
                                 onChange={(e) => setEditForm({...editForm, selectedDate: e.target.value})}
                                 className="w-full px-2 py-1 rounded border text-xs"
                               />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Saat</label>
                               <select
                                 value={editForm.selectedTime}
                                 onChange={(e) => setEditForm({...editForm, selectedTime: e.target.value})}
                                 className="w-full px-2 py-1 rounded border text-xs"
                               >
                                 <option value="">Saat Seçin</option>
                                 <option value="07:00-13:00">07:00-13:00</option>
                                 <option value="14:00-20:00">14:00-20:00</option>
                               </select>
                             </div>
                             <div className="flex space-x-2">
                               <button
                                 onClick={() => updateDateTime(reservation.id)}
                                 className="flex-1 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded font-bold"
                               >
                                 ✅ Kaydet
                               </button>
                               <button
                                 onClick={() => {
                                   setEditingReservation(null);
                                   setEditForm({ selectedDate: '', selectedTime: '' });
                                 }}
                                 className="flex-1 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded font-bold"
                               >
                                 ❌ İptal
                               </button>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-2 text-sm text-slate-700">
                             <p><strong className="text-slate-800">Tarih:</strong> {new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { 
                               weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                             })}</p>
                             <p><strong className="text-slate-800">Saat:</strong> {reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}</p>
                             <p><strong className="text-slate-800">Koltuklar:</strong> {
                               reservation.isPrivateTour ? 'Tüm tekne' : reservation.selectedSeats.join(', ')
                             }</p>
                             <p><strong className="text-slate-800">Oluşturma:</strong> {new Date(reservation.createdAt).toLocaleString('tr-TR')}</p>
                           </div>
                         )}
                       </div>

                                             {/* Ödeme Durumu */}
                       <div className={`p-3 rounded-xl border ${
                         reservation.paymentStatus === 'waiting' 
                           ? 'bg-yellow-50 border-yellow-200' 
                           : reservation.paymentStatus === 'received'
                           ? 'bg-blue-50 border-blue-200'
                           : 'bg-green-50 border-green-200'
                       }`}>
                         <div className="flex items-center justify-between mb-1">
                           <p className="font-bold text-sm text-slate-800">💳 Ödeme Durumu</p>
                           {reservation.paymentStatus === 'waiting' && reservation.status === 'pending' && (
                             <button
                               onClick={() => markPaymentReceived(reservation.id)}
                               className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded font-bold"
                             >
                               ✓ Alındı
                             </button>
                           )}
                         </div>
                         <p className={`text-sm font-medium ${
                           reservation.paymentStatus === 'waiting' 
                             ? 'text-yellow-700' 
                             : reservation.paymentStatus === 'received'
                             ? 'text-blue-700'
                             : 'text-green-700'
                         }`}>
                           {reservation.paymentStatus === 'waiting' ? '⏳ Ödeme Bekleniyor' : 
                            reservation.paymentStatus === 'received' ? '💰 Ödeme Alındı' : '✅ Ödeme Onaylandı'}
                         </p>
                       </div>
                    </div>

                    {/* Orta: Misafir Bilgileri */}
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">👥 Misafir Bilgileri</h4>
                                             <div className="space-y-2 max-h-48 overflow-y-auto">
                         {reservation.guestInfos.map((guest, index) => (
                           <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <p className="font-medium text-slate-800">
                               {guest.name} {guest.surname}
                             </p>
                             <div className="text-xs text-slate-600 space-y-1 mt-1">
                               <p className="text-slate-600">📞 {guest.phone}</p>
                               <p className="text-slate-600">👤 {guest.gender} • 🎂 {guest.age} yaş</p>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>

                                         {/* Sağ: Aksiyonlar */}
                     <div>
                       <h4 className="font-bold text-slate-800 mb-2">⚡ İşlemler</h4>
                       <div className="space-y-2">
                         {/* Ödeme Kontrol Butonları */}
                         {reservation.status === 'pending' && reservation.paymentStatus === 'waiting' && (
                           <button
                             onClick={() => markPaymentReceived(reservation.id)}
                             className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                           >
                             💰 Ödeme Alındı Olarak İşaretle
                           </button>
                         )}

                         {/* Rezervasyon Onay/Red Butonları */}
                         {reservation.status === 'pending' && reservation.paymentStatus === 'received' && (
                           <div className="space-y-2">
                             {reservation.isPrivateTour && (
                               <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                 <p className="text-orange-800 text-xs font-bold text-center">
                                   ⚠️ Özel Tur: Günün tamamen boş olduğunu kontrol edin!
                                 </p>
                               </div>
                             )}
                             <button
                               onClick={() => approveReservation(reservation.id)}
                               className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                             >
                               ✅ Rezervasyonu Onayla & WhatsApp Gönder
                             </button>
                             <button
                               onClick={() => rejectReservation(reservation.id)}
                               className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300"
                             >
                               ❌ Rezervasyonu Reddet
                             </button>
                           </div>
                         )}

                         {/* Onaylanmış Rezervasyonlar için WhatsApp */}
                         {reservation.status === 'confirmed' && (
                           <button
                             onClick={() => {
                               const guest = reservation.guestInfos[0];
                               const phone = guest.phone.replace(/\s/g, '').replace(/^0/, '90');
                               const message = `Merhaba ${guest.name}! Balık Sefası rezervasyonunuz ile ilgili bilgi vermek istiyoruz.`;
                               window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                             }}
                             className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all duration-300"
                           >
                             💬 WhatsApp Mesajı Gönder
                           </button>
                         )}

                         {/* Genel İletişim Butonları */}
                         <button
                           onClick={() => {
                             const guest = reservation.guestInfos[0];
                             window.open(`tel:${guest.phone}`, '_self');
                           }}
                           className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all duration-300"
                         >
                           📞 Ara
                         </button>

                         {/* Gelişmiş Düzenleme Butonu */}
                         <button
                           onClick={() => openEditModal(reservation)}
                           className="w-full py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold text-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                         >
                           ✏️ Gelişmiş Düzenle
                         </button>

                         {/* Manuel İptal Butonu */}
                         {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                           <button
                             onClick={() => cancelReservation(reservation.id)}
                             className="w-full py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-all duration-300"
                           >
                             🗑️ Manuel İptal
                           </button>
                         )}

                         {/* Kalıcı Silme Butonu */}
                         <button
                           onClick={() => deleteReservation(reservation.id)}
                           className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-sm hover:from-red-700 hover:to-red-800 transition-all duration-300 border-2 border-red-800"
                         >
                           🗑️ KALICI SİL
                         </button>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Gelişmiş Düzenleme Modal'ı */}
      {showEditModal && editingFullReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">✏️ Rezervasyon Düzenle</h3>
                  <p className="text-sm opacity-90">#{editingFullReservation.id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFullReservation(null);
                    setFullEditForm({});
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                >
                  <span className="text-white font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol: Temel Bilgiler */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-lg border-b border-gray-200 pb-2">📋 Temel Bilgiler</h4>
                  
                  {/* Durum */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Durum</label>
                    <select
                      value={fullEditForm.status || ''}
                      onChange={(e) => setFullEditForm({...fullEditForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-slate-800"
                    >
                      <option value="pending">⏳ Bekleyen</option>
                      <option value="confirmed">✅ Onaylanmış</option>
                      <option value="cancelled">❌ İptal/Reddedilmiş</option>
                    </select>
                  </div>

                  {/* Ödeme Durumu */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ödeme Durumu</label>
                    <select
                      value={fullEditForm.paymentStatus || ''}
                      onChange={(e) => setFullEditForm({...fullEditForm, paymentStatus: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-slate-800"
                    >
                      <option value="waiting">⏳ Ödeme Bekleniyor</option>
                      <option value="received">💰 Ödeme Alındı</option>
                      <option value="confirmed">✅ Ödeme Onaylandı</option>
                    </select>
                  </div>

                  {/* Özel Tur */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fullEditForm.isPrivateTour || false}
                        onChange={(e) => {
                          const isPrivate = e.target.checked;
                          setFullEditForm({
                            ...fullEditForm,
                            isPrivateTour: isPrivate,
                            guestCount: isPrivate ? 12 : 1,
                            selectedSeats: isPrivate ? ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'] : [],
                            selectedTime: isPrivate ? '07:00-20:00' : '07:00-13:00'
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-bold text-slate-700">⭐ Özel Tur</span>
                    </label>
                  </div>

                  {/* Kişi Sayısı */}
                  {!fullEditForm.isPrivateTour && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Kişi Sayısı</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={fullEditForm.guestCount || 1}
                        onChange={(e) => setFullEditForm({...fullEditForm, guestCount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-slate-800"
                      />
                    </div>
                  )}

                  {/* Tarih */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tarih</label>
                    <input
                      type="date"
                      value={fullEditForm.selectedDate || ''}
                      onChange={(e) => setFullEditForm({...fullEditForm, selectedDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-slate-800"
                    />
                  </div>

                  {/* Saat */}
                  {!fullEditForm.isPrivateTour && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Saat</label>
                      <select
                        value={fullEditForm.selectedTime || ''}
                        onChange={(e) => setFullEditForm({...fullEditForm, selectedTime: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-slate-800"
                      >
                        <option value="">Saat Seçin</option>
                        <option value="07:00-13:00">07:00-13:00</option>
                        <option value="14:00-20:00">14:00-20:00</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Sağ: Koltuklar ve Misafir Bilgileri */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-lg border-b border-gray-200 pb-2">🪑 Koltuklar & 👥 Misafirler</h4>
                  
                  {/* Koltuk Seçimi */}
                  {!fullEditForm.isPrivateTour && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Seçili Koltuklar</label>
                      <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg">
                        {['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'].map(seat => (
                          <button
                            key={seat}
                            onClick={() => {
                              const seats = fullEditForm.selectedSeats || [];
                              if (seats.includes(seat)) {
                                setFullEditForm({
                                  ...fullEditForm,
                                  selectedSeats: seats.filter(s => s !== seat)
                                });
                              } else if (seats.length < (fullEditForm.guestCount || 1)) {
                                setFullEditForm({
                                  ...fullEditForm,
                                  selectedSeats: [...seats, seat]
                                });
                              }
                            }}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all duration-300 ${
                              (fullEditForm.selectedSeats || []).includes(seat)
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {seat.slice(-1)}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Seçili: {(fullEditForm.selectedSeats || []).length}/{fullEditForm.guestCount || 1}
                      </p>
                    </div>
                  )}

                  {/* Misafir Bilgileri */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Misafir Bilgileri ({fullEditForm.isPrivateTour ? 'Grup Lideri' : `${fullEditForm.guestCount || 1} Kişi`})
                    </label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(fullEditForm.guestInfos || []).map((guest, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-bold text-gray-600 mb-2">
                            {fullEditForm.isPrivateTour ? 'Grup Lideri' : `${index + 1}. Kişi`}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Ad"
                              value={guest.name}
                              onChange={(e) => {
                                const newGuests = [...(fullEditForm.guestInfos || [])];
                                newGuests[index] = {...newGuests[index], name: e.target.value};
                                setFullEditForm({...fullEditForm, guestInfos: newGuests});
                              }}
                              className="px-2 py-1 rounded border text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Soyad"
                              value={guest.surname}
                              onChange={(e) => {
                                const newGuests = [...(fullEditForm.guestInfos || [])];
                                newGuests[index] = {...newGuests[index], surname: e.target.value};
                                setFullEditForm({...fullEditForm, guestInfos: newGuests});
                              }}
                              className="px-2 py-1 rounded border text-xs"
                            />
                            <select
                              value={guest.gender}
                              onChange={(e) => {
                                const newGuests = [...(fullEditForm.guestInfos || [])];
                                newGuests[index] = {...newGuests[index], gender: e.target.value};
                                setFullEditForm({...fullEditForm, guestInfos: newGuests});
                              }}
                              className="px-2 py-1 rounded border text-xs"
                            >
                              <option value="">Cinsiyet</option>
                              <option value="erkek">Erkek</option>
                              <option value="kadın">Kadın</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Yaş"
                              value={guest.age}
                              onChange={(e) => {
                                const newGuests = [...(fullEditForm.guestInfos || [])];
                                newGuests[index] = {...newGuests[index], age: e.target.value};
                                setFullEditForm({...fullEditForm, guestInfos: newGuests});
                              }}
                              className="px-2 py-1 rounded border text-xs"
                            />
                            <input
                              type="tel"
                              placeholder="Telefon"
                              value={guest.phone}
                              onChange={(e) => {
                                const newGuests = [...(fullEditForm.guestInfos || [])];
                                newGuests[index] = {...newGuests[index], phone: e.target.value};
                                setFullEditForm({...fullEditForm, guestInfos: newGuests});
                              }}
                              className="px-2 py-1 rounded border text-xs col-span-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFullReservation(null);
                    setFullEditForm({});
                  }}
                  className="flex-1 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-bold transition-all duration-300"
                >
                  ❌ İptal
                </button>
                
                <button
                  onClick={saveFullEdit}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  ✅ Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 