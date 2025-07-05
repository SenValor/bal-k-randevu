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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Açılır-kapanır rezervasyon kartları için state
  const [expandedReservations, setExpandedReservations] = useState<Set<string>>(new Set());

  // Fiyat yönetimi için state'ler
  const [prices, setPrices] = useState({
    normalOwn: 850,
    normalWithEquipment: 1000,
    privateTour: 12000,
    fishingSwimming: 15000
  });
  const [editingPrices, setEditingPrices] = useState(false);

  // Rezervasyon detaylarını açma/kapama
  const toggleReservationExpanded = (reservationId: string) => {
    const newExpanded = new Set(expandedReservations);
    if (newExpanded.has(reservationId)) {
      newExpanded.delete(reservationId);
    } else {
      newExpanded.add(reservationId);
    }
    setExpandedReservations(newExpanded);
  };

  // Fiyat yönetimi fonksiyonları
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

  const savePrices = async () => {
    try {
      await setDoc(doc(db, 'settings', 'prices'), prices);
      setEditingPrices(false);
      alert('Fiyatlar başarıyla güncellendi!');
    } catch (error) {
      console.error('Fiyatlar kaydedilemedi:', error);
      alert('Fiyatlar kaydedilemedi!');
    }
  };

  // Auth state listener
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
      });

      // Fiyatları da çek
      fetchPrices();

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
      await signInWithEmailAndPassword(auth, adminEmail.toLowerCase(), adminPassword);
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setAdminEmail('');
      setAdminPassword('');
    } catch (error: any) {
      alert('Giriş sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveReservation = async (reservationId: string) => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'confirmed'
      });

      if (reservation && reservation.guestInfos[0]) {
        sendConfirmationMessage(reservation);
      }
    } catch (error) {
      alert('Rezervasyon onaylanamadı!');
    }
  };

  // WhatsApp mesaj şablonları
  const sendConfirmationMessage = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const phone = guest.phone.replace(/\s/g, '').replace(/^0/, '90');
    const tourDate = new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    const message = `🎉 *REZERVASYON ONAYINDI* 🎉

Merhaba ${guest.name} ${guest.surname}!

Balık Sefası rezervasyonunuz onaylanmıştır.

📋 *REZERVASYON DETAYLARI*
📅 Tarih: ${tourDate}
🕐 Saat: ${reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}
👥 Kişi Sayısı: ${reservation.guestCount}
${reservation.isPrivateTour ? '⭐ Özel Tur - Tüm Tekne Sizin' : '🪑 Koltuk Numaraları: ' + reservation.selectedSeats.join(', ')}

📍 *BULUŞMA YERİ*
Eyüp Odabaşı Sporcular Parkı
📍 Adres: Eyüp Odabaşı Mh, Eyüp/İstanbul
🗺️ Google Maps: https://maps.app.goo.gl/eyup-odabasi-park
📞 Yol tarifi için bizi arayın

⚠️ *ULAŞIM İPUÇLARI*
• Eyüp İskelesi'nden yürüyerek 5 dakika
• Araçla gelenler için park alanı mevcut
• Toplu taşıma: Eyüp durağından yürüyerek

⏰ *ÖNEMLİ NOTLAR*
• Lütfen belirtilen saatte hazır olun
• Yanınızda kimlik getirmeyi unutmayın
• Hava durumu uygun değilse size haber vereceğiz
• Teknemizde can yeleği bulunmaktadır

💰 *ÖDEME*
Ödeme teknede nakit olarak alınacaktır.

📞 *İLETİŞİM*
Herhangi bir sorunuz varsa bizi arayabilirsiniz.

⚓ İyi eğlenceler dileriz!
*Balık Sefası Ekibi*`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendReminderMessage = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const phone = guest.phone.replace(/\s/g, '').replace(/^0/, '90');
    const tourDate = new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    });
    
    const message = `🔔 *REZERVASYON HATIRLATMASI* 🔔

Merhaba ${guest.name} ${guest.surname}!

Balık Sefası rezervasyonunuz yaklaşıyor!

📅 Tarih: ${tourDate}
🕐 Saat: ${reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}
📍 Yer: Eyüp Odabaşı Sporcular Parkı
🗺️ Konum: https://maps.app.goo.gl/eyup-odabasi-park

⚠️ *HATIRLATMA*
• Lütfen 15 dakika öncesinde buluşma yerinde olun
• Yanınızda kimlik getirmeyi unutmayın
• Rahat kıyafetler giymenizi öneririz
• Hava durumu kontrol edilecek, problem varsa haber vereceğiz

🌤️ *HAVA DURUMU*
Son hava durumu kontrol edilerek size bilgi verilecektir.

Görüşmek üzere! 🎣
*Balık Sefası Ekibi*`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendCustomMessage = (reservation: Reservation, messageType: 'info' | 'weather' | 'change') => {
    const guest = reservation.guestInfos[0];
    const phone = guest.phone.replace(/\s/g, '').replace(/^0/, '90');
    
    let message = '';
    
    switch (messageType) {
      case 'info':
        message = `Merhaba ${guest.name}!

Balık Sefası rezervasyonunuz ile ilgili bilgilendirme:

📋 Rezervasyon detaylarınızı kontrol etmek veya herhangi bir sorunuz varsa bizi arayabilirsiniz.

Teşekkürler! 🎣
*Balık Sefası Ekibi*`;
        break;
        
      case 'weather':
        message = `🌦️ *HAVA DURUMU BİLGİSİ* 🌦️

Merhaba ${guest.name}!

Rezervasyon tarihiniz için hava durumu kontrol ediliyor. Herhangi bir problem olursa size haber vereceğiz.

Şu an için rezervasyonunuz devam ediyor.

*Balık Sefası Ekibi*`;
        break;
        
      case 'change':
        message = `📝 *REZERVASYON DEĞİŞİKLİĞİ* 📝

Merhaba ${guest.name}!

Rezervasyonunuzda bir değişiklik yapılması gerekiyor. Lütfen bizi arayarak detayları konuşalım.

📞 Size en kısa sürede dönüş yapacağız.

*Balık Sefası Ekibi*`;
        break;
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const rejectReservation = async (reservationId: string) => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'cancelled'
      });

      if (reservation && reservation.guestInfos[0]) {
        sendCancellationMessage(reservation);
      }
    } catch (error) {
      alert('Rezervasyon reddedilemedi!');
    }
  };

  const sendCancellationMessage = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const phone = guest.phone.replace(/\s/g, '').replace(/^0/, '90');
    const tourDate = new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    const message = `😔 *REZERVASYON İPTAL BİLDİRİMİ* 😔

Merhaba ${guest.name} ${guest.surname}!

Üzgünüz, aşağıdaki rezervasyonunuz iptal edilmiştir:

📅 Tarih: ${tourDate}
🕐 Saat: ${reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}
👥 Kişi Sayısı: ${reservation.guestCount}

❓ *İPTAL SEBEBİ*
• Hava koşulları uygun değil
• Teknik sorunlar
• Kapasite doldu
• Diğer operasyonel sebepler

📞 *ALTERNATIF ÇÖZÜM*
Başka bir tarih için rezervasyon yapmak isterseniz bizi arayabilirsiniz. Size en uygun tarihi bulalım.

🙏 Anlayışınız için teşekkür ederiz.
*Balık Sefası Ekibi*`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const markPaymentReceived = async (reservationId: string) => {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        paymentStatus: 'received'
      });
    } catch (error) {
      alert('Ödeme durumu güncellenemedi!');
    }
  };

  const deleteReservation = async (reservationId: string) => {
    if (confirm('Bu rezervasyonu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'reservations', reservationId));
      } catch (error) {
        alert('Rezervasyon silinemedi!');
      }
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    switch (activeTab) {
      case 'pending':
        return reservation.status === 'pending';
      case 'confirmed':
        return reservation.status === 'confirmed';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  if (authLoading) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Girişi</h1>
            <p className="text-gray-600">Rezervasyon yönetimi için giriş yapın</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
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
              <span className="text-sm text-gray-500">Admin Panel</span>
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

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'pending', label: 'Bekleyen', count: reservations.filter(r => r.status === 'pending').length },
              { key: 'confirmed', label: 'Onaylanan', count: reservations.filter(r => r.status === 'confirmed').length },
              { key: 'all', label: 'Tümü', count: reservations.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Fiyat Yönetimi Bölümü */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">💰 Fiyat Yönetimi</h2>
            <button
              onClick={() => setEditingPrices(!editingPrices)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                editingPrices 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {editingPrices ? '❌ İptal Et' : '✏️ Fiyatları Düzenle'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Normal Tur - Kendi Ekipman */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🎣</span>
                <h3 className="font-bold text-green-800">Normal Tur</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">Kendi ekipmanı olan</p>
              {editingPrices ? (
                <input
                  type="number"
                  value={prices.normalOwn}
                  onChange={(e) => setPrices({...prices, normalOwn: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg text-green-800 font-bold"
                />
              ) : (
                <div className="text-2xl font-bold text-green-600">{prices.normalOwn} TL</div>
              )}
            </div>

            {/* Normal Tur - Ekipman Dahil */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🐟</span>
                <h3 className="font-bold text-blue-800">Normal Tur</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">Ekipman dahil</p>
              {editingPrices ? (
                <input
                  type="number"
                  value={prices.normalWithEquipment}
                  onChange={(e) => setPrices({...prices, normalWithEquipment: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-blue-800 font-bold"
                />
              ) : (
                <div className="text-2xl font-bold text-blue-600">{prices.normalWithEquipment} TL</div>
              )}
            </div>

            {/* Özel Tur */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">⭐</span>
                <h3 className="font-bold text-purple-800">Kapalı Tur</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">Özel tur (grup fiyatı)</p>
              {editingPrices ? (
                <input
                  type="number"
                  value={prices.privateTour}
                  onChange={(e) => setPrices({...prices, privateTour: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-purple-800 font-bold"
                />
              ) : (
                <div className="text-2xl font-bold text-purple-600">{prices.privateTour} TL</div>
              )}
            </div>

            {/* Balık + Yüzme Turu */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🏊‍♂️</span>
                <h3 className="font-bold text-cyan-800">Balık + Yüzme</h3>
              </div>
              <p className="text-sm text-cyan-700 mb-3">6 saat özel tur</p>
              {editingPrices ? (
                <input
                  type="number"
                  value={prices.fishingSwimming}
                  onChange={(e) => setPrices({...prices, fishingSwimming: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-cyan-300 rounded-lg text-cyan-800 font-bold"
                />
              ) : (
                <div className="text-2xl font-bold text-cyan-600">{prices.fishingSwimming} TL</div>
              )}
            </div>
          </div>

          {editingPrices && (
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingPrices(false);
                  fetchPrices(); // Reset to original values
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                İptal Et
              </button>
              <button
                onClick={savePrices}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                💾 Fiyatları Kaydet
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              ⚠️ Ağustos 15'ten sonra fiyatlara zam yapılması planlandığı için fiyatları buradan güncelleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Rezervasyonlar yükleniyor...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-bold text-gray-600 mb-2">Rezervasyon Bulunamadı</h3>
                <p className="text-gray-500">Bu kategoride henüz rezervasyon bulunmuyor.</p>
              </div>
            ) : (
              filteredReservations.map((reservation) => {
                const isExpanded = expandedReservations.has(reservation.id);
                
                return (
                  <div key={reservation.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Header - Her zaman görünür */}
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
                            <h3 className="font-bold text-lg">
                              {reservation.isPrivateTour ? 'Özel Tur' : 'Normal Rezervasyon'}
                            </h3>
                            <p className="text-sm opacity-90">
                              #{reservation.id.slice(0, 8)}... • {reservation.guestCount} kişi
                            </p>
                            <p className="text-sm opacity-80">
                              📅 {new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} • 
                              🕐 {reservation.isPrivateTour ? 'Gün Boyu' : reservation.selectedTime} • 
                              👤 {reservation.guestInfos[0]?.name} {reservation.guestInfos[0]?.surname}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            reservation.status === 'pending' 
                              ? 'bg-orange-100 text-orange-800' 
                              : reservation.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reservation.status === 'pending' ? '⏳ Bekliyor' : 
                             reservation.status === 'confirmed' ? '✅ Onaylı' : '❌ İptal'}
                          </div>
                          
                          <button
                            onClick={() => toggleReservationExpanded(reservation.id)}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                            title={isExpanded ? 'Detayları Gizle' : 'Detayları Göster'}
                          >
                            <span className={`text-white font-bold transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detaylar - Açılır-kapanır */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Sol: Rezervasyon Detayları */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-800">📅 Rezervasyon Detayları</h4>
                            <div className="space-y-2 text-sm text-slate-700">
                              <p><strong>Tarih:</strong> {new Date(reservation.selectedDate).toLocaleDateString('tr-TR', { 
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                              })}</p>
                              <p><strong>Saat:</strong> {reservation.isPrivateTour ? 'Gün Boyu (07:00-20:00)' : reservation.selectedTime}</p>
                              <p><strong>Koltuklar:</strong> {reservation.isPrivateTour ? 'Tüm tekne' : reservation.selectedSeats.join(', ')}</p>
                              <p><strong>Oluşturma:</strong> {new Date(reservation.createdAt).toLocaleString('tr-TR')}</p>
                            </div>
                            
                            <div className={`p-3 rounded-xl border ${
                              reservation.paymentStatus === 'waiting' 
                                ? 'bg-yellow-50 border-yellow-200' 
                                : reservation.paymentStatus === 'received'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-green-50 border-green-200'
                            }`}>
                              <p className="font-bold text-sm text-slate-800">💳 Ödeme Durumu</p>
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
                            <h4 className="font-bold text-slate-800 mb-3">👥 Misafir Bilgileri</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {reservation.guestInfos.map((guest, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="font-medium text-slate-800">
                                    {guest.name} {guest.surname}
                                  </p>
                                  <div className="text-xs text-slate-600 space-y-1 mt-1">
                                    <p>📞 {guest.phone}</p>
                                    <p>👤 {guest.gender} • 🎂 {guest.age} yaş</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sağ: İşlemler */}
                          <div>
                            <h4 className="font-bold text-slate-800 mb-3">⚡ İşlemler</h4>
                            <div className="space-y-2">
                              {reservation.status === 'pending' && reservation.paymentStatus === 'waiting' && (
                                <button
                                  onClick={() => markPaymentReceived(reservation.id)}
                                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
                                >
                                  💰 Ödeme Alındı
                                </button>
                              )}

                                                             {reservation.status === 'pending' && reservation.paymentStatus === 'received' && (
                                 <div className="space-y-2">
                                   <button
                                     onClick={() => approveReservation(reservation.id)}
                                     className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors"
                                   >
                                     ✅ Onayla & WhatsApp Gönder
                                   </button>
                                   <button
                                     onClick={() => rejectReservation(reservation.id)}
                                     className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors"
                                   >
                                     ❌ Reddet
                                   </button>
                                 </div>
                               )}

                               {/* WhatsApp Mesaj Butonları */}
                               <div className="space-y-2">
                                 <div className="text-xs font-bold text-gray-600 mb-1">💬 WhatsApp Mesajları</div>
                                 
                                 {reservation.status === 'confirmed' && (
                                   <>
                                     <button
                                       onClick={() => sendConfirmationMessage(reservation)}
                                       className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors"
                                     >
                                       ✅ Onay Mesajı (Tekrar)
                                     </button>
                                     <button
                                       onClick={() => sendReminderMessage(reservation)}
                                       className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
                                     >
                                       🔔 Hatırlatma Mesajı
                                     </button>
                                   </>
                                 )}

                                 {reservation.status === 'cancelled' && (
                                   <button
                                     onClick={() => sendCancellationMessage(reservation)}
                                     className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors"
                                   >
                                     ❌ İptal Mesajı (Tekrar)
                                   </button>
                                 )}
                                 
                                 <button
                                   onClick={() => sendCustomMessage(reservation, 'info')}
                                   className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                                 >
                                   ℹ️ Bilgi Mesajı
                                 </button>
                                 
                                 <button
                                   onClick={() => sendCustomMessage(reservation, 'weather')}
                                   className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium text-sm transition-colors"
                                 >
                                   🌤️ Hava Durumu
                                 </button>
                                 
                                 <button
                                   onClick={() => sendCustomMessage(reservation, 'change')}
                                   className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors"
                                 >
                                   📝 Değişiklik Bildirimi
                                 </button>
                               </div>

                               <button
                                 onClick={() => {
                                   const guest = reservation.guestInfos[0];
                                   window.open(`tel:${guest.phone}`, '_self');
                                 }}
                                 className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                               >
                                 📞 Ara
                               </button>

                              <button
                                onClick={() => deleteReservation(reservation.id)}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
                              >
                                🗑️ Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
} 