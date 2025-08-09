'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Reservation {
  id: string;
  reservationNumber: string;
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  isPrivateTour: boolean;
  tourType?: string; // Tur tipi bilgisi - custom tur ID'leri de dahil
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
  priceOption?: 'own-equipment' | 'with-equipment'; // Normal tur için ekipman seçeneği
  // Yaş grubu bilgileri (normal turlar için)
  ageGroups?: {
    adults: number;
    children: number;
    babies: number;
  };
  ageBasedPricing?: {
    adults: { 
      withEquipment: { count: number; unitPrice: number; totalPrice: number };
      ownEquipment: { count: number; unitPrice: number; totalPrice: number };
    };
    children: { 
      withEquipment: { count: number; unitPrice: number; totalPrice: number };
      ownEquipment: { count: number; unitPrice: number; totalPrice: number };
    };
    babies: { count: number; unitPrice: number; totalPrice: number };
  };
  // Esnek olta seçimi bilgileri
  equipmentChoices?: {
    adults: { withEquipment: number; ownEquipment: number };
    children: { withEquipment: number; ownEquipment: number };
    babies: { withEquipment: number; ownEquipment: number };
  };
}

function ReservationsContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'completed' | 'all'>(
    (statusFilter as any) || 'pending'
  );
  const [previewMessage, setPreviewMessage] = useState<{phone: string, message: string} | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});
  const [customTours, setCustomTours] = useState<any[]>([]);
  // Tarih ve saat filtresi
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTime, setFilterTime] = useState<string>('');
  // Sayfalama
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Custom turları çek
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'customTours'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.tours && Array.isArray(data.tours)) {
            // Tüm turları al (aktif/pasif fark etmez, admin görüntülemesi için)
            setCustomTours(data.tours);
          }
        } else {
          setCustomTours([]);
        }
      }
    );
    return () => unsubscribe();
  }, []);

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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getFilteredReservations = () => {
    let filtered = reservations;
    
    // Durum filtresi
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === activeTab);
    }
    
    // Arama filtresi
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const guest = r.guestInfos?.[0];
        return (
          guest?.name?.toLowerCase().includes(term) ||
          guest?.surname?.toLowerCase().includes(term) ||
          guest?.phone?.includes(term) ||
          guest?.email?.toLowerCase().includes(term) ||
          r.reservationNumber?.toLowerCase().includes(term) ||
          r.selectedDate?.includes(term)
        );
      });
    }

    // Tarih filtresi (YYYY-MM-DD)
    if (filterDate) {
      filtered = filtered.filter(r => (r.selectedDate || '').slice(0, 10) === filterDate);
    }

    // Saat filtresi (07:00-13:00 gibi tam eşleşme)
    if (filterTime) {
      filtered = filtered.filter(r => (r.selectedTime || '') === filterTime);
    }

    // Sıralama: Tarih (artan) → Saat başlangıcı (artan) → Rezervasyon No
    const getStartMinutes = (timeRange?: string) => {
      if (!timeRange) return Number.MAX_SAFE_INTEGER;
      const start = timeRange.split('-')[0]?.trim();
      const [h, m] = (start || '').split(':').map(Number);
      if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
      return Number.MAX_SAFE_INTEGER;
    };

    return filtered.sort((a, b) => {
      const da = (a.selectedDate || '').slice(0, 10);
      const db = (b.selectedDate || '').slice(0, 10);
      if (da !== db) return da.localeCompare(db);
      const ta = getStartMinutes(a.selectedTime);
      const tb = getStartMinutes(b.selectedTime);
      if (ta !== tb) return ta - tb;
      return (a.reservationNumber || '').localeCompare(b.reservationNumber || '');
    });
  };

  const approveReservation = async (reservationId: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'confirmed'
      });
      alert('Randevu onaylandı!');
    } catch (error: any) {
      console.error('Onay hatası:', error);
      alert('Randevu onaylanırken hata oluştu');
    }
  };

  const rejectReservation = async (reservationId: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'cancelled'
      });
      alert('Randevu iptal edildi!');
    } catch (error: any) {
      console.error('İptal hatası:', error);
      alert('Randevu iptal edilirken hata oluştu');
    }
  };

  const markPaymentReceived = async (reservationId: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        paymentStatus: 'received'
      });
      alert('Ödeme alındı olarak işaretlendi!');
    } catch (error: any) {
      console.error('Ödeme işaretleme hatası:', error);
      alert('Ödeme durumu güncellenirken hata oluştu');
    }
  };

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
      alert('Randevu silindi!');
    } catch (error: any) {
      console.error('Silme hatası:', error);
      alert('Randevu silinirken hata oluştu');
    }
  };

  const completeReservation = async (reservationId: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'completed'
      });
      alert('Randevu tamamlandı!');
    } catch (error: any) {
      console.error('Tamamlama hatası:', error);
      alert('Randevu tamamlanırken hata oluştu');
    }
  };

  const editReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditForm({
      ...reservation,
      selectedDate: reservation.selectedDate.split('T')[0], // Tarih formatını input için düzelt
    });
  };

  const saveEditedReservation = async () => {
    if (!editingReservation || !editForm) return;
    
    try {
      const updateData = {
        ...editForm,
        selectedDate: editForm.selectedDate + 'T00:00:00.000Z', // Tarih formatını Firebase için düzelt
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'reservations', editingReservation.id), updateData);
      
      setEditingReservation(null);
      setEditForm({});
      alert('Randevu başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Güncelleme hatası:', error);
      alert('Randevu güncellenirken hata oluştu');
    }
  };

  const cancelEdit = () => {
    setEditingReservation(null);
    setEditForm({});
  };

  // WhatsApp mesaj şablonları
  const sendWhatsAppMessage = (phone: string, message: string) => {
    // 1) Telefonu normalize et
    const digitsOnly = (phone || '').replace(/\D/g, '');
    let formattedPhone = digitsOnly;
    if (digitsOnly.startsWith('0')) {
      formattedPhone = '90' + digitsOnly.substring(1);
    }
    // Eğer 10 haneli (5xx...) gelirse ülke kodu ekle
    if (/^5\d{9}$/.test(digitsOnly)) {
      formattedPhone = '90' + digitsOnly;
    }

    // 2) Mesajı encode et (satır sonları dahil)
    const encodedMessage = encodeURIComponent(message || '').replace(/%20/g, '+');

    // 3) WhatsApp URL'leri (api -> wa fallback)
    const apiUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // 4) Yeni sekmede aç (bazı masaüstü kurulumlarda api.whatsapp daha stabil)
    const win = window.open(apiUrl, '_blank');
    // Fallback: yeni pencere blokluysa veya tarayıcı engellerse ikinci URL dene
    setTimeout(() => {
      if (!win || win.closed) {
        window.open(waUrl, '_blank');
      }
    }, 300);
  };

  // Rezervasyon tur tipini belirleme fonksiyonu
  const getReservationTourType = (reservation: Reservation) => {
    if (reservation.tourType === 'fishing-swimming') {
      return 'Balık + Yüzme Turu';
    } else if (reservation.tourType === 'private') {
      return 'Kapalı Tur (Özel)';
    } else if (reservation.tourType === 'normal') {
      // Normal tur için ekipman seçeneğini kontrol et
      if (reservation.priceOption === 'own-equipment') {
        return 'Normal Tur - Kendi Ekipmanı';
      } else if (reservation.priceOption === 'with-equipment') {
        return 'Normal Tur - Ekipman Dahil';
      } else {
        return 'Normal Tur';
      }
    } else {
      // Custom tur kontrolü
      const customTour = customTours.find(tour => tour.id === reservation.tourType);
      return customTour ? customTour.name : `Bilinmeyen Tur (${reservation.tourType})`;
    }
  };

  const getWhatsAppMessages = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const date = new Date(reservation.selectedDate).toLocaleDateString('tr-TR');
    const time = reservation.selectedTime;
    
    // Tur tipini doğru şekilde belirle
    const getTourTypeName = (reservation: Reservation) => {
      if (reservation.tourType === 'fishing-swimming') {
        return 'Balık + Yüzme Turu';
      } else if (reservation.tourType === 'private') {
        return 'Kapalı Tur (Özel)';
      } else if (reservation.tourType === 'normal') {
        // Normal tur için ekipman seçeneğini kontrol et
        if (reservation.priceOption === 'own-equipment') {
          return 'Normal Tur - Kendi Ekipmanı';
        } else if (reservation.priceOption === 'with-equipment') {
          return 'Normal Tur - Ekipman Dahil';
        } else {
          return 'Normal Tur';
        }
      } else {
        // Custom tur kontrolü
        const customTour = customTours.find(tour => tour.id === reservation.tourType);
        return customTour ? customTour.name : 'Normal Tur';
      }
    };
    
    const tourType = getTourTypeName(reservation);
    
    return {
      approved: `🎉 Merhaba ${guest?.name}! 

Tekne randevunuz onaylandı! ✅

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}
👥 Kişi Sayısı: ${reservation.guestCount}${reservation.ageGroups && (reservation.ageGroups.children > 0 || reservation.ageGroups.babies > 0) ? 
  `\n   ${reservation.ageGroups.adults > 0 ? `${reservation.ageGroups.adults} Yetişkin` : ''}${reservation.ageGroups.children > 0 ? `, ${reservation.ageGroups.children} Çocuk (3-6 yaş)` : ''}${reservation.ageGroups.babies > 0 ? `, ${reservation.ageGroups.babies} Bebek (0-3 yaş)` : ''}` : ''}${reservation.equipmentChoices ? 
  `\n🎣 Olta: ${reservation.equipmentChoices.adults.withEquipment > 0 ? `${reservation.equipmentChoices.adults.withEquipment} Yetişkin (Ekipman Dahil)` : ''}${reservation.equipmentChoices.adults.ownEquipment > 0 ? `${reservation.equipmentChoices.adults.withEquipment > 0 ? ', ' : ''}${reservation.equipmentChoices.adults.ownEquipment} Yetişkin (Kendi Ekipmanı)` : ''}${reservation.equipmentChoices.children.withEquipment > 0 ? `${(reservation.equipmentChoices.adults.withEquipment > 0 || reservation.equipmentChoices.adults.ownEquipment > 0) ? ', ' : ''}${reservation.equipmentChoices.children.withEquipment} Çocuk (Ekipman Dahil)` : ''}${reservation.equipmentChoices.children.ownEquipment > 0 ? `${(reservation.equipmentChoices.adults.withEquipment > 0 || reservation.equipmentChoices.adults.ownEquipment > 0 || reservation.equipmentChoices.children.withEquipment > 0) ? ', ' : ''}${reservation.equipmentChoices.children.ownEquipment} Çocuk (Kendi Ekipmanı)` : ''}` : ''}
💺 Koltuk No: ${reservation.selectedSeats.join(', ')}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
Eyüp Odabaşı Sporcular Parkı - İskele
Sarıyer/İstanbul

🗺️ Konum: https://maps.app.goo.gl/fVPxCBB9JphkEMBH7

🚗 Ulaşım: 
- Özel araç için park alanı mevcut
- Toplu taşıma ile ulaşım için detaylı bilgi almak üzere arayabilirsiniz

Randevu saatinden 15 dakika önce hazır olmanızı rica ederiz. 
Herhangi bir sorunuz varsa bize ulaşabilirsiniz.

Bizi tercih ettiğiniz için teşekkürler! 🙏`,

      reminder: `⏰ Randevu Hatırlatması

Merhaba ${guest?.name}!

Yarın tekne randevunuz var:

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}
  👥 Kişi Sayısı: ${reservation.guestCount}${reservation.ageGroups && (reservation.ageGroups.children > 0 || reservation.ageGroups.babies > 0) ? 
    `\n     ${reservation.ageGroups.adults > 0 ? `${reservation.ageGroups.adults} Yetişkin` : ''}${reservation.ageGroups.children > 0 ? `, ${reservation.ageGroups.children} Çocuk (3-6 yaş)` : ''}${reservation.ageGroups.babies > 0 ? `, ${reservation.ageGroups.babies} Bebek (0-3 yaş)` : ''}` : ''}
  💺 Koltuk No: ${reservation.selectedSeats.join(', ')}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
Eyüp Odabaşı Sporcular Parkı - İskele
🗺️ Konum: https://maps.app.goo.gl/fVPxCBB9JphkEMBH7

Lütfen randevu saatinden 15 dakika önce hazır olun.
Güzel bir deneyim için sabırsızlanıyoruz! 🌊⚓`,

      payment: `💳 Ödeme Hatırlatması

Merhaba ${guest?.name}!

Onaylanan randevunuz için ödeme bekliyoruz:

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}
👥 Kişi Sayısı: ${reservation.guestCount}
💰 Toplam Tutar: ${reservation.totalAmount || 'Belirlenmedi'}₺

Randevu No: ${reservation.reservationNumber}

Ödeme bilgileri için bizimle iletişime geçebilirsiniz.
Teşekkürler! 🙏`,

      completed: `✅ Randevu Tamamlandı

Merhaba ${guest?.name}!

Bugünkü tekne turumuza katıldığınız için teşekkürler! 🎉

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}

Umarım keyifli vakit geçirmişsinizdir! 🌊

Deneyiminiz hakkında görüş ve önerilerinizi paylaşırsanız çok memnun oluruz.
Bir sonraki randevunuzda görüşmek üzere! ⚓`,

      cancelled: `❌ Randevu İptali

Merhaba ${guest?.name}!

Üzgünüz, randevunuz iptal edilmiştir:

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}

Randevu No: ${reservation.reservationNumber}

İptal nedeni hakkında bilgi almak veya yeni randevu oluşturmak için bizimle iletişime geçebilirsiniz.

Anlayışınız için teşekkürler. 🙏`
    };
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Bekliyor';
      case 'received': return 'Alındı';
      case 'confirmed': return 'Onaylandı';
      default: return status;
    }
  };

  const filteredReservations = getFilteredReservations();
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredReservations.length);
  const pagedReservations = filteredReservations.slice(startIndex, endIndex);
  const stats = {
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    total: reservations.length
  };

  // Filtre değişince sayfayı başa al
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterTime, activeTab]);

  // Sayfa değiştiğinde en üste kaydır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      (mainEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, pageSize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Randevular yükleniyor...</p>
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
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">📋 Randevu Yönetimi</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                href="/admin/calendar"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Takvim Görünümü"
              >
                📅 Takvim
              </Link>
              <Link
                href="/admin/reservations/add"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ➕ Randevu Ekle
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⏳ Bekleyen ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'confirmed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ✅ Onaylı ({stats.confirmed})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📅 Tamamlanan ({stats.completed})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 Tümü ({stats.total})
            </button>
          </nav>
        </div>

        {/* Arama ve Filtreler */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Randevu ara (ad, soyad, telefon, email, randevu no, tarih...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ❌
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📅 Tarih</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🕐 Saat Dilimi</label>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Tümü</option>
                {Array.from(new Set(reservations.map(r => r.selectedTime).filter(Boolean))).sort().map((time) => (
                  <option key={time as string} value={time as string}>{time as string}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterDate(''); setFilterTime(''); }}
                className="w-full md:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                🔄 Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Results Info + Page Size */}
        {(searchTerm || filteredReservations.length > 0) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-blue-700">
                {searchTerm ? (
                  <><strong>"{searchTerm}"</strong> araması için {filteredReservations.length} sonuç bulundu</>
                ) : (
                  <><strong>{filteredReservations.length}</strong> randevu listelendi</>
                )}
                {filteredReservations.length > 0 && (
                  <> • <strong>{startIndex + 1}-{endIndex}</strong> arası gösteriliyor</>
                )}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700">Sayfa başına:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value) || 20)}
                  className="px-2 py-1 border border-blue-300 rounded text-sm text-gray-900 bg-white"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Cards (tarih ve saat bazında gruplanmış) */}
        <div className="space-y-6">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Arama sonucu bulunamadı' : 
                 activeTab === 'all' ? 'Henüz randevu yok' : `${getStatusText(activeTab)} randevu yok`}
              </h3>
              <p className="text-gray-700">
                {searchTerm && 'Farklı arama terimleri deneyin.'}
                {!searchTerm && activeTab === 'pending' && 'Yeni randevu bildirimleri burada görünecek.'}
                {!searchTerm && activeTab === 'confirmed' && 'Onaylanmış randevular burada görünecek.'}
                {!searchTerm && activeTab === 'completed' && 'Tamamlanan randevular burada görünecek.'}
                {!searchTerm && activeTab === 'all' && 'Randevular oluşturuldukça burada görünecek.'}
              </p>
            </div>
          ) : (
            (() => {
              const blocks: React.ReactNode[] = [];
              let lastDate = '';
              let lastTime = '';
              pagedReservations.forEach((reservation) => {
                const dateKey = (reservation.selectedDate || '').slice(0, 10);
                if (dateKey !== lastDate) {
                  lastDate = dateKey;
                  lastTime = '';
                  blocks.push(
                    <div key={`date-${dateKey}`} className="pt-2">
                      <div className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                        <span>📅</span>
                        <span>{new Date(dateKey + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  );
                }
                const timeKey = reservation.selectedTime || '';
                if (timeKey !== lastTime) {
                  lastTime = timeKey;
                  blocks.push(
                    <div key={`time-${dateKey}-${timeKey}`} className="mt-2">
                      <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                        <span>🕐</span><span>{timeKey || 'Saat belirtilmemiş'}</span>
                      </div>
                    </div>
                  );
                }
                blocks.push(
                  <div key={reservation.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(reservation.paymentStatus)}`}>
                      💳 {getPaymentStatusText(reservation.paymentStatus)}
                    </span>
                    {reservation.totalAmount && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        💰 {reservation.totalAmount.toLocaleString('tr-TR')} ₺
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {reservation.reservationNumber}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">👤 Müşteri Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Ad Soyad:</strong> {reservation.guestInfos[0]?.name} {reservation.guestInfos[0]?.surname}</p>
                      <p><strong>Telefon:</strong> {reservation.guestInfos[0]?.phone}</p>
                      <p><strong>Email:</strong> {reservation.guestInfos[0]?.email}</p>
                      <p><strong>Kişi Sayısı:</strong> {reservation.guestCount}</p>
                      {reservation.ageGroups && (reservation.ageGroups.children > 0 || reservation.ageGroups.babies > 0) && (
                        <div className="ml-4 text-xs space-y-1 text-gray-600">
                          {reservation.ageGroups.adults > 0 && <p>• {reservation.ageGroups.adults} Yetişkin</p>}
                          {reservation.ageGroups.children > 0 && <p>• {reservation.ageGroups.children} Çocuk (3-6 yaş, %50 indirimli)</p>}
                          {reservation.ageGroups.babies > 0 && <p>• {reservation.ageGroups.babies} Bebek (0-3 yaş, ücretsiz)</p>}
                        </div>
                      )}
                      {reservation.equipmentChoices && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">🎣 Olta Seçimi:</p>
                          <div className="ml-4 text-xs space-y-1 text-gray-600">
                            {reservation.equipmentChoices.adults.withEquipment > 0 && (
                              <p>• {reservation.equipmentChoices.adults.withEquipment} Yetişkin (Ekipman Dahil)</p>
                            )}
                            {reservation.equipmentChoices.adults.ownEquipment > 0 && (
                              <p>• {reservation.equipmentChoices.adults.ownEquipment} Yetişkin (Kendi Ekipmanı)</p>
                            )}
                            {reservation.equipmentChoices.children.withEquipment > 0 && (
                              <p>• {reservation.equipmentChoices.children.withEquipment} Çocuk (Ekipman Dahil)</p>
                            )}
                            {reservation.equipmentChoices.children.ownEquipment > 0 && (
                              <p>• {reservation.equipmentChoices.children.ownEquipment} Çocuk (Kendi Ekipmanı)</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">📅 Randevu Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Tarih:</strong> {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Saat:</strong> {reservation.selectedTime}</p>
                      <p><strong>Tur Tipi:</strong> {getReservationTourType(reservation)}</p>
                      <p><strong>Koltuklar:</strong> {reservation.selectedSeats.join(', ')}</p>
                    </div>
                  </div>

                  {/* Fiyat Bilgileri */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">💰 Fiyat Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      {reservation.totalAmount && (
                        <p><strong>Toplam Tutar:</strong> 
                          <span className="text-green-600 font-bold ml-2">
                            {reservation.totalAmount.toLocaleString('tr-TR')} ₺
                          </span>
                        </p>
                      )}
                      
                      {/* Esnek olta sistemi fiyat detayları */}
                      {reservation.ageBasedPricing && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">📊 Fiyat Detayları:</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            {/* Yetişkin Ekipman Dahil */}
                            {reservation.ageBasedPricing.adults?.withEquipment?.count > 0 && (
                              <div className="flex justify-between">
                                <span>{reservation.ageBasedPricing.adults.withEquipment.count} Yetişkin (Ekipman Dahil)</span>
                                <span className="font-medium">{reservation.ageBasedPricing.adults.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                              </div>
                            )}
                            {/* Yetişkin Kendi Ekipmanı */}
                            {reservation.ageBasedPricing.adults?.ownEquipment?.count > 0 && (
                              <div className="flex justify-between">
                                <span>{reservation.ageBasedPricing.adults.ownEquipment.count} Yetişkin (Kendi Ekipmanı)</span>
                                <span className="font-medium">{reservation.ageBasedPricing.adults.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                              </div>
                            )}
                            {/* Çocuk Ekipman Dahil */}
                            {reservation.ageBasedPricing.children?.withEquipment?.count > 0 && (
                              <div className="flex justify-between">
                                <span>{reservation.ageBasedPricing.children.withEquipment.count} Çocuk (Ekipman Dahil)</span>
                                <span className="font-medium">{reservation.ageBasedPricing.children.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                              </div>
                            )}
                            {/* Çocuk Kendi Ekipmanı */}
                            {reservation.ageBasedPricing.children?.ownEquipment?.count > 0 && (
                              <div className="flex justify-between">
                                <span>{reservation.ageBasedPricing.children.ownEquipment.count} Çocuk (Kendi Ekipmanı)</span>
                                <span className="font-medium">{reservation.ageBasedPricing.children.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                              </div>
                            )}
                            {/* Bebek */}
                            {reservation.ageBasedPricing.babies?.count > 0 && (
                              <div className="flex justify-between">
                                <span>{reservation.ageBasedPricing.babies.count} Bebek (Ücretsiz)</span>
                                <span className="font-medium">0 ₺</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      

                      
                      {/* Ödeme Durumu */}
                      <p><strong>Ödeme Durumu:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          reservation.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                          reservation.paymentStatus === 'received' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reservation.paymentStatus === 'confirmed' ? 'Onaylandı' :
                           reservation.paymentStatus === 'received' ? 'Alındı' : 'Bekliyor'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                  {/* İşlem Butonları */}
                  <div className="flex flex-wrap gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveReservation(reservation.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✅ Onayla
                        </button>
                        <button
                          onClick={() => rejectReservation(reservation.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ❌ Reddet
                        </button>
                      </>
                    )}
                    
                    {reservation.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => completeReservation(reservation.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✅ Tamamla
                        </button>
                        {reservation.paymentStatus === 'waiting' && (
                          <button
                            onClick={() => markPaymentReceived(reservation.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            💳 Ödeme Alındı
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => editReservation(reservation)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Düzenle
                    </button>
                    
                    <button
                      onClick={() => deleteReservation(reservation.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️ Sil
                    </button>
                  </div>

                  {/* WhatsApp Mesajları */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-green-800">📱 WhatsApp Mesajları</span>
                      <span className="text-xs text-green-600">→ {reservation.guestInfos[0]?.phone}</span>
                    </div>
                    <p className="text-xs text-green-700 mb-2">
                      💡 Mesajlar işletme WhatsApp numaranızdan müşteriye gönderilecek
                    </p>
                    <div className="flex flex-wrap gap-2">
                                             {reservation.status === 'pending' && (
                         <button
                           onClick={() => setPreviewMessage({phone: reservation.guestInfos[0]?.phone, message: getWhatsAppMessages(reservation).approved})}
                           className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                         >
                           ✅ Onay Mesajı
                         </button>
                       )}
                       
                       {reservation.status === 'confirmed' && (
                         <>
                           <button
                             onClick={() => setPreviewMessage({phone: reservation.guestInfos[0]?.phone, message: getWhatsAppMessages(reservation).reminder})}
                             className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                           >
                             ⏰ Hatırlatma
                           </button>
                           {reservation.paymentStatus === 'waiting' && (
                             <button
                               onClick={() => setPreviewMessage({phone: reservation.guestInfos[0]?.phone, message: getWhatsAppMessages(reservation).payment})}
                               className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                             >
                               💳 Ödeme
                             </button>
                           )}
                         </>
                       )}
                       
                       {reservation.status === 'completed' && (
                         <button
                           onClick={() => setPreviewMessage({phone: reservation.guestInfos[0]?.phone, message: getWhatsAppMessages(reservation).completed})}
                           className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                         >
                           🎉 Teşekkür
                         </button>
                       )}
                       
                       <button
                         onClick={() => setPreviewMessage({phone: reservation.guestInfos[0]?.phone, message: getWhatsAppMessages(reservation).cancelled})}
                         className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                       >
                         ❌ İptal
                       </button>
                    </div>
                  </div>
                </div>
                  </div>
                );
              });
              return blocks;
            })()
          )}
        </div>

        {/* Pagination */}
        {filteredReservations.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`px-3 py-1 rounded border ${safePage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              ← Önceki
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                // Basit: İlk 5 sayfa + son sayfa, araya '...'
                const pageNumbers: number[] = [];
                return null;
              })}
              {/* Basit sayfa göstergesi */}
              <span className="px-3 py-1 text-sm text-gray-700">Sayfa {safePage} / {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={`px-3 py-1 rounded border ${safePage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Sonraki →
            </button>
          </div>
        )}
      </main>

      {/* WhatsApp Mesaj Önizleme Modal */}
      {previewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📱 WhatsApp Mesaj Önizleme</h3>
              <button
                onClick={() => setPreviewMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ❌
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Gönderilecek Numara:</strong> {previewMessage.phone}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{previewMessage.message}</pre>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  sendWhatsAppMessage(previewMessage.phone, previewMessage.message);
                  setPreviewMessage(null);
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📱 WhatsApp'ta Gönder
              </button>
              <button
                onClick={() => setPreviewMessage(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ❌ İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Randevu Düzenleme Modal */}
      {editingReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                ✏️ Randevu Düzenle - {editingReservation.reservationNumber}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                ❌
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Müşteri Bilgileri */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-900">👤 Müşteri Bilgileri</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                                         <input
                       type="text"
                       value={editForm.guestInfos?.[0]?.name || ''}
                       onChange={(e) => setEditForm({
                         ...editForm,
                         guestInfos: [{
                           ...editForm.guestInfos?.[0],
                           name: e.target.value
                         }] as any
                       })}
                       className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                     />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                    <input
                      type="text"
                      value={editForm.guestInfos?.[0]?.surname || ''}
                                             onChange={(e) => setEditForm({
                         ...editForm,
                         guestInfos: [{
                           ...editForm.guestInfos?.[0],
                           surname: e.target.value
                         }] as any
                       })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.guestInfos?.[0]?.phone || ''}
                                         onChange={(e) => setEditForm({
                       ...editForm,
                       guestInfos: [{
                         ...editForm.guestInfos?.[0],
                         phone: e.target.value
                       }] as any
                     })}
                     className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                   <input
                     type="email"
                     value={editForm.guestInfos?.[0]?.email || ''}
                     onChange={(e) => setEditForm({
                       ...editForm,
                       guestInfos: [{
                         ...editForm.guestInfos?.[0],
                         email: e.target.value
                       }] as any
                     })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>
              
              {/* Randevu Bilgileri */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-900">📅 Randevu Bilgileri</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={editForm.selectedDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, selectedDate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                    <select
                      value={editForm.selectedTime || ''}
                      onChange={(e) => setEditForm({ ...editForm, selectedTime: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="">Saat seçin</option>
                      <option value="07:00-13:00">07:00-13:00</option>
                      <option value="14:00-20:00">14:00-20:00</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kişi Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={editForm.guestCount || ''}
                      onChange={(e) => setEditForm({ ...editForm, guestCount: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tur Tipi</label>
                    <select
                      value={editForm.isPrivateTour ? 'private' : 'normal'}
                      onChange={(e) => setEditForm({ ...editForm, isPrivateTour: e.target.value === 'private' })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="normal">Normal Tur</option>
                      <option value="private">Özel Tur</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Koltuk Numaraları</label>
                  <input
                    type="text"
                    value={editForm.selectedSeats?.join(', ') || ''}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      selectedSeats: e.target.value.split(', ').filter(s => s.trim()) 
                    })}
                    placeholder="Örn: 1, 2, 3"
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="pending">Beklemede</option>
                      <option value="confirmed">Onaylandı</option>
                      <option value="cancelled">İptal Edildi</option>
                      <option value="completed">Tamamlandı</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Durumu</label>
                    <select
                      value={editForm.paymentStatus || ''}
                      onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="waiting">Beklemede</option>
                      <option value="received">Alındı</option>
                      <option value="confirmed">Onaylandı</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ❌ İptal
              </button>
              <button
                onClick={saveEditedReservation}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ✅ Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReservationsContent />
    </Suspense>
  );
} 