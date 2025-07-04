'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, onSnapshot, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all' | 'settings' | 'photos'>('pending');
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
  
  // Saat yönetimi için state'ler
  const [availableTimes, setAvailableTimes] = useState<string[]>(['07:00-13:00', '14:00-20:00']);
  const [newTimeSlot, setNewTimeSlot] = useState<string>('');
  const [timesLoading, setTimesLoading] = useState<boolean>(false);

  // Fotoğraf yönetimi için state'ler
  const [boatPhotos, setBoatPhotos] = useState<{id: string, url: string, name: string}[]>([]);
  const [photosLoading, setPhotosLoading] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

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

      // Saatleri ve fotoğrafları da yükle
      fetchAvailableTimes();
      fetchBoatPhotos();

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

  // Saatleri Firebase'den çek
  const fetchAvailableTimes = async () => {
    try {
      setTimesLoading(true);
      const timesDoc = await getDoc(doc(db, 'settings', 'availableTimes'));
      if (timesDoc.exists()) {
        const data = timesDoc.data();
        if (data.times && Array.isArray(data.times)) {
          setAvailableTimes(data.times);
        }
      } else {
        // Varsayılan saatleri kaydet
        await setDoc(doc(db, 'settings', 'availableTimes'), {
          times: ['07:00-13:00', '14:00-20:00'],
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
      }
    } catch (error) {
      console.error('Saatler çekilemedi:', error);
      alert('Saatler yüklenirken hata oluştu!');
    } finally {
      setTimesLoading(false);
    }
  };

  // Yeni saat dilimi ekle
  const addTimeSlot = async () => {
    if (!newTimeSlot.trim()) {
      alert('Lütfen geçerli bir saat dilimi girin!');
      return;
    }

    if (availableTimes.includes(newTimeSlot)) {
      alert('Bu saat dilimi zaten mevcut!');
      return;
    }

    try {
      const newTimes = [...availableTimes, newTimeSlot];
      await setDoc(doc(db, 'settings', 'availableTimes'), {
        times: newTimes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      setAvailableTimes(newTimes);
      setNewTimeSlot('');
      alert('Saat dilimi başarıyla eklendi!');
    } catch (error) {
      console.error('Saat dilimi eklenemedi:', error);
      alert('Saat dilimi eklenirken hata oluştu!');
    }
  };

  // Saat dilimi sil
  const removeTimeSlot = async (timeSlot: string) => {
    if (availableTimes.length <= 1) {
      alert('En az bir saat dilimi olmalıdır!');
      return;
    }

    if (confirm(`"${timeSlot}" saat dilimini silmek istediğinizden emin misiniz?`)) {
      try {
        const newTimes = availableTimes.filter(time => time !== timeSlot);
        await setDoc(doc(db, 'settings', 'availableTimes'), {
          times: newTimes,
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
        
        setAvailableTimes(newTimes);
        alert('Saat dilimi başarıyla silindi!');
      } catch (error) {
        console.error('Saat dilimi silinemedi:', error);
        alert('Saat dilimi silinirken hata oluştu!');
      }
    }
  };

  // Fotoğrafları Firebase'den çek
  const fetchBoatPhotos = async () => {
    try {
      setPhotosLoading(true);
      const photosDoc = await getDoc(doc(db, 'settings', 'boatPhotos'));
      if (photosDoc.exists()) {
        const data = photosDoc.data();
        if (data.photos && Array.isArray(data.photos)) {
          setBoatPhotos(data.photos);
        }
      } else {
        // Boş fotoğraf listesi oluştur
        await setDoc(doc(db, 'settings', 'boatPhotos'), {
          photos: [],
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
        setBoatPhotos([]);
      }
    } catch (error) {
      console.error('Fotoğraflar çekilemedi:', error);
      alert('Fotoğraflar yüklenirken hata oluştu!');
    } finally {
      setPhotosLoading(false);
    }
  };

  // Fotoğraf upload (CORS sorununu çözen versiyon)
  const uploadPhoto = async (file: File) => {
    if (!file) return;

    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece fotoğraf dosyası seçin!');
      return;
    }

    // Dosya boyutunu kontrol et (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır!');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Unique dosya adı oluştur
      const fileName = `boat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `boat-photos/${fileName}`);
      
      // Dosyayı Firebase Storage'a yükle
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Fotoğraf listesini güncelle
      const newPhoto = {
        id: fileName,
        url: downloadURL,
        name: file.name
      };
      
      const updatedPhotos = [...boatPhotos, newPhoto];
      
      // Firestore'da kaydet
      await setDoc(doc(db, 'settings', 'boatPhotos'), {
        photos: updatedPhotos,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      setBoatPhotos(updatedPhotos);
      alert('Fotoğraf başarıyla yüklendi!');
      
    } catch (error: any) {
      console.error('Fotoğraf yüklenemedi:', error);
      const errorMessage = error.message || error.toString();
      
      // CORS hatasını özel olarak ele al
      if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        alert('CORS hatası: Lütfen Firebase Storage Security Rules\'ın doğru ayarlandığından emin olun!');
      } else {
        alert(`Fotoğraf yüklenirken hata oluştu: ${errorMessage}`);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fotoğraf sil
  const deletePhoto = async (photoId: string) => {
    if (confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
      try {
        // Storage'dan sil
        const storageRef = ref(storage, `boat-photos/${photoId}`);
        await deleteObject(storageRef);
        
        // Listeden çıkar
        const updatedPhotos = boatPhotos.filter(photo => photo.id !== photoId);
        
        // Firestore'da güncelle
        await setDoc(doc(db, 'settings', 'boatPhotos'), {
          photos: updatedPhotos,
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
        
        setBoatPhotos(updatedPhotos);
        alert('Fotoğraf başarıyla silindi!');
      } catch (error: any) {
        console.error('Fotoğraf silinemedi:', error);
        alert(`Fotoğraf silinirken hata oluştu: ${error.message || error.toString()}`);
      }
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'pending') return res.status === 'pending';
    if (activeTab === 'confirmed') return res.status === 'confirmed';
    if (activeTab === 'settings') return false; // Ayarlar sekmesinde rezervasyon gösterme
    if (activeTab === 'photos') return false; // Fotoğraf sekmesinde rezervasyon gösterme
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Bekleyen Rezervasyonlar</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600">
                  {reservations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
                <span className="text-lg md:text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Onaylanmış Rezervasyonlar</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">
                  {reservations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
                <span className="text-lg md:text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Toplam Rezervasyon</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{reservations.length}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
                <span className="text-lg md:text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            {/* Mobile Scrollable Tab Navigation */}
            <div className="overflow-x-auto scrollbar-hide">
              <nav className="flex space-x-1 px-4 min-w-max md:justify-center" aria-label="Tabs">
                {[
                  { key: 'pending', label: 'Bekleyen', icon: '⏳', count: reservations.filter(r => r.status === 'pending').length },
                  { key: 'confirmed', label: 'Onaylanmış', icon: '✅', count: reservations.filter(r => r.status === 'confirmed').length },
                  { key: 'all', label: 'Tümü', icon: '📋', count: reservations.length },
                  { key: 'settings', label: 'Ayarlar', icon: '⚙️', count: null },
                  { key: 'photos', label: 'Fotoğraflar', icon: '📸', count: boatPhotos.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`whitespace-nowrap py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-all duration-300 flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-base md:text-lg">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-xs">{tab.label.slice(0, 3)}</span>
                      {tab.count !== null && (
                        <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-bold ${
                          activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Ayarlar Sekmesi */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                <span className="mr-2">🕐</span>
                Saat Dilimi Yönetimi
              </h3>
              <p className="text-gray-600 text-sm">Rezervasyon için kullanılabilir saat dilimlerini yönetin</p>
            </div>

            {/* Mevcut Saat Dilimleri */}
            <div className="mb-6">
              <h4 className="font-bold text-slate-700 mb-3">Mevcut Saat Dilimleri</h4>
              {timesLoading ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Saatler yükleniyor...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableTimes.map((time, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🕐</span>
                        </div>
                        <span className="font-medium text-slate-800">{time}</span>
                      </div>
                      <button
                        onClick={() => removeTimeSlot(time)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all duration-300"
                        title="Saat dilimini sil"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yeni Saat Dilimi Ekleme */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-slate-700 mb-3">Yeni Saat Dilimi Ekle</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  placeholder="Örn: 08:00-14:00"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 bg-white"
                />
                <button
                  onClick={addTimeSlot}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Ekle
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Format: SS:DD-SS:DD (Örnek: 08:00-14:00)
              </p>
            </div>
          </div>
        )}

        {/* Fotoğraf Yönetimi Sekmesi */}
        {activeTab === 'photos' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                <span className="mr-2">📸</span>
                Tekne Fotoğrafları
              </h3>
              <p className="text-gray-600 text-sm">Tekne fotoğraflarını buradan yönetebilirsiniz. Ana sayfada gösterilecek fotoğrafları ekleyin veya silin.</p>
            </div>

            {/* Fotoğraf Yükleme */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center">
                <span className="mr-2">⬆️</span>
                Yeni Fotoğraf Yükle
              </h4>
              <div className="flex flex-col space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadPhoto(file);
                      e.target.value = ''; // Input'u temizle
                    }
                  }}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-blue-500 file:text-white
                    hover:file:bg-blue-600 file:transition-all file:duration-300"
                />
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Desteklenen formatlar: JPG, PNG, WEBP</p>
                  <p>• Maksimum dosya boyutu: 5MB</p>
                  <p>• Önerilen boyut: 800x600 piksel veya daha büyük</p>
                </div>
                {uploadingPhoto && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Fotoğraf yükleniyor...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mevcut Fotoğraflar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-700 flex items-center">
                  <span className="mr-2">🖼️</span>
                  Mevcut Fotoğraflar ({boatPhotos.length})
                </h4>
                {boatPhotos.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Ana sayfada gösterilme sırası: sol üstten başlayarak
                  </p>
                )}
              </div>

              {photosLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Fotoğraflar yükleniyor...</p>
                </div>
              ) : boatPhotos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📷</span>
                  </div>
                  <h5 className="text-lg font-bold text-gray-600 mb-2">Henüz Fotoğraf Yok</h5>
                  <p className="text-gray-500">Yukarıdaki alandan fotoğraf yükleyerek başlayın</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {boatPhotos.map((photo, index) => (
                    <div key={photo.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                      {/* Fotoğraf */}
                      <div className="relative aspect-video bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-bold">
                          #{index + 1}
                        </div>
                      </div>
                      
                      {/* Fotoğraf Bilgileri */}
                      <div className="p-3">
                        <h6 className="font-medium text-slate-800 text-sm mb-1 truncate" title={photo.name}>
                          {photo.name}
                        </h6>
                        <p className="text-xs text-gray-500 mb-3">
                          {new Date(parseInt(photo.id.split('-')[1])).toLocaleDateString('tr-TR')}
                        </p>
                        
                        {/* Aksiyonlar */}
                        <div className="space-y-2">
                          <button
                            onClick={() => window.open(photo.url, '_blank')}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all duration-300"
                          >
                            👁️ Büyük Görüntüle
                          </button>
                          <button
                            onClick={() => deletePhoto(photo.id)}
                            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-300"
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fotoğraf Sıralaması Bilgisi */}
            {boatPhotos.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-lg">💡</span>
                  <div className="text-sm">
                    <p className="font-bold text-yellow-800 mb-1">Fotoğraf Sıralaması Hakkında</p>
                    <p className="text-yellow-700">
                      Fotoğraflar ana sayfada yüklenme tarihine göre sıralanır. En son yüklenen fotoğraf en sona eklenir.
                      Özel bir sıralama istiyorsanız, fotoğrafları istediğiniz sırayla yeniden yükleyebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rezervasyon Listesi */}
        {activeTab !== 'settings' && activeTab !== 'photos' && (
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
                <div className={`p-3 md:p-4 ${
                  reservation.isPrivateTour 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                } text-white`}>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                     <div className="flex items-center space-x-3">
                       <span className="text-xl md:text-2xl">
                         {reservation.isPrivateTour ? '⭐' : '🎣'}
                       </span>
                       <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-base md:text-lg text-white truncate">
                           {reservation.isPrivateTour ? 'Özel Tur' : 'Normal Rezervasyon'}
                         </h3>
                         <p className="text-xs md:text-sm opacity-90 text-white">
                           #{reservation.id.slice(0, 8)}... • {reservation.guestCount} kişi
                         </p>
                       </div>
                     </div>
                    
                     <div className="text-right sm:text-left">
                       <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
                         reservation.status === 'pending' 
                           ? 'bg-orange-100 text-orange-800' 
                           : reservation.status === 'confirmed'
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}>
                         <span className="hidden sm:inline">
                           {reservation.status === 'pending' ? '⏳ Manuel Kontrol Bekliyor' : 
                            reservation.status === 'confirmed' ? '✅ Onaylandı' : '❌ İptal/Reddedildi'}
                         </span>
                         <span className="sm:hidden">
                           {reservation.status === 'pending' ? '⏳ Bekliyor' : 
                            reservation.status === 'confirmed' ? '✅ Onaylı' : '❌ İptal'}
                         </span>
                       </div>
                     </div>
                  </div>
                </div>

                                {/* Rezervasyon Detayları */}
                <div className="p-4 md:p-6">
                  <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                     {/* Sol: Tarih ve Saat Bilgileri */}
                     <div className="space-y-4 lg:space-y-4">
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
                                 {availableTimes.map((time) => (
                                   <option key={time} value={time}>{time}</option>
                                 ))}
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
                       <h4 className="font-bold text-slate-800 mb-2 lg:mb-3">⚡ İşlemler</h4>
                       <div className="space-y-1.5 md:space-y-2">
                         {/* Ödeme Kontrol Butonları */}
                         {reservation.status === 'pending' && reservation.paymentStatus === 'waiting' && (
                           <button
                             onClick={() => markPaymentReceived(reservation.id)}
                             className="w-full py-2 md:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-xs md:text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                           >
                             <span className="hidden sm:inline">💰 Ödeme Alındı Olarak İşaretle</span>
                             <span className="sm:hidden">💰 Ödeme Alındı</span>
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
                               className="w-full py-2 md:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-xs md:text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                             >
                               <span className="hidden sm:inline">✅ Rezervasyonu Onayla & WhatsApp Gönder</span>
                               <span className="sm:hidden">✅ Onayla & WhatsApp</span>
                             </button>
                             <button
                               onClick={() => rejectReservation(reservation.id)}
                               className="w-full py-2 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold text-xs md:text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300"
                             >
                               <span className="hidden sm:inline">❌ Rezervasyonu Reddet</span>
                               <span className="sm:hidden">❌ Reddet</span>
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
                             className="w-full py-2 md:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-xs md:text-sm hover:from-green-600 hover:to-green-700 transition-all duration-300"
                           >
                             <span className="hidden sm:inline">💬 WhatsApp Mesajı Gönder</span>
                             <span className="sm:hidden">💬 WhatsApp</span>
                           </button>
                         )}

                         {/* Genel İletişim Butonları */}
                         <button
                           onClick={() => {
                             const guest = reservation.guestInfos[0];
                             window.open(`tel:${guest.phone}`, '_self');
                           }}
                           className="w-full py-2 md:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-xs md:text-sm transition-all duration-300"
                         >
                           📞 Ara
                         </button>

                         {/* Gelişmiş Düzenleme Butonu */}
                         <button
                           onClick={() => openEditModal(reservation)}
                           className="w-full py-2 md:py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold text-xs md:text-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                         >
                           <span className="hidden sm:inline">✏️ Gelişmiş Düzenle</span>
                           <span className="sm:hidden">✏️ Düzenle</span>
                         </button>

                         {/* Manuel İptal Butonu */}
                         {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                           <button
                             onClick={() => cancelReservation(reservation.id)}
                             className="w-full py-2 md:py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-xs md:text-sm transition-all duration-300"
                           >
                             <span className="hidden sm:inline">🗑️ Manuel İptal</span>
                             <span className="sm:hidden">🗑️ İptal</span>
                           </button>
                         )}

                         {/* Kalıcı Silme Butonu */}
                         <button
                           onClick={() => deleteReservation(reservation.id)}
                           className="w-full py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-xs md:text-sm hover:from-red-700 hover:to-red-800 transition-all duration-300 border-2 border-red-800"
                         >
                           <span className="hidden sm:inline">🗑️ KALICI SİL</span>
                           <span className="sm:hidden">🗑️ SİL</span>
                         </button>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </main>

      {/* Gelişmiş Düzenleme Modal'ı */}
      {showEditModal && editingFullReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-3 md:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <h3 className="text-lg md:text-xl font-bold truncate">✏️ Rezervasyon Düzenle</h3>
                  <p className="text-xs md:text-sm opacity-90 truncate">#{editingFullReservation.id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFullReservation(null);
                    setFullEditForm({});
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                >
                  <span className="text-white font-bold text-lg md:text-xl">×</span>
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
                        {availableTimes.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
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