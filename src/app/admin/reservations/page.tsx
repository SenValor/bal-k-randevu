'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Boat {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  location?: {
    name?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    googleMapsUrl?: string;
    directions?: string;
  };
}

// Koltuk seçimi için yardımcı komponent
interface SeatSelectionEditorProps {
  selectedSeats: string[];
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedBoat: string;
  onSeatChange: (seats: string[]) => void;
  reservations: Reservation[];
  editingReservationId?: string;
  boats: Boat[]; // Tekne bilgileri için eklendi
}

function SeatSelectionEditor({
  selectedSeats,
  guestCount,
  selectedDate,
  selectedTime,
  selectedBoat,
  onSeatChange,
  reservations,
  editingReservationId,
  boats
}: SeatSelectionEditorProps) {
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  
  // Tekne sırasını bul (randevu sayfasındaki getBoatOrder mantığı)
  const getBoatOrder = (boatId: string): string => {
    const sortedBoats = boats.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
    const index = sortedBoats.findIndex(boat => boat.id === boatId);
    return index >= 0 ? `T${index + 1}` : 'T1';
  };

  // Tekne bazlı koltuk düzeni oluştur
  const getSeatingLayout = () => {
    if (!selectedBoat) {
      return {
        iskele: ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'],
        sancak: ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6']
      };
    }
    
    const prefix = `${getBoatOrder(selectedBoat)}_`;
    return {
      iskele: [`${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`],
      sancak: [`${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`]
    };
  };

  const seatingLayout = getSeatingLayout();
  const iskeleSeat = seatingLayout.iskele;
  const sancakSeat = seatingLayout.sancak;
  
  // Seçilen tarih ve saatte dolu koltukları hesapla
  useEffect(() => {
    if (selectedDate && selectedTime && selectedBoat) {
      const occupied = reservations
        .filter(r => 
          r.selectedDate === selectedDate && 
          r.selectedTime === selectedTime && 
          r.selectedBoat === selectedBoat &&
          (r.status === 'confirmed' || r.status === 'pending') &&
          r.id !== editingReservationId // Düzenlenen rezervasyonu hariç tut
        )
        .flatMap(r => r.selectedSeats || [])
        .filter(seat => seat && seat.trim());
      
      setOccupiedSeats(occupied);
    } else {
      setOccupiedSeats([]);
    }
  }, [selectedDate, selectedTime, selectedBoat, reservations, editingReservationId]);
  
  const handleSeatClick = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    
    const currentSeats = [...selectedSeats];
    const seatIndex = currentSeats.indexOf(seatId);
    
    if (seatIndex > -1) {
      // Koltuk zaten seçili, çıkar
      currentSeats.splice(seatIndex, 1);
    } else {
      // Koltuk seçili değil, ekle (eğer sınır aşılmadıysa)
      if (currentSeats.length < guestCount) {
        currentSeats.push(seatId);
      } else {
        alert(`Maksimum ${guestCount} koltuk seçebilirsiniz.`);
        return;
      }
    }
    
    onSeatChange(currentSeats);
  };
  
  const getSeatStatus = (seatId: string): 'available' | 'occupied' | 'selected' => {
    if (occupiedSeats.includes(seatId)) return 'occupied';
    if (selectedSeats.includes(seatId)) return 'selected';
    return 'available';
  };
  
  const getSeatColor = (status: 'available' | 'occupied' | 'selected') => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 border-green-400';
      case 'occupied': return 'bg-red-500 border-red-400 cursor-not-allowed';
      case 'selected': return 'bg-blue-500 hover:bg-blue-600 border-blue-400';
    }
  };
  
  const renderSeat = (seatId: string) => {
    const status = getSeatStatus(seatId);
    
    return (
      <button
        key={seatId}
        onClick={() => handleSeatClick(seatId)}
        disabled={status === 'occupied'}
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-all duration-300 shadow-lg border-2 ${
          getSeatColor(status)
        }`}
        title={
          status === 'occupied' ? 'Bu koltuk dolu' :
          status === 'selected' ? 'Seçimi kaldırmak için tıklayın' :
          selectedSeats.length >= guestCount ? `Maksimum ${guestCount} koltuk seçebilirsiniz` :
          'Koltuğu seçmek için tıklayın'
        }
      >
        <div className="relative">
          <span className="relative z-10">{seatId.slice(-1)}</span>
          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-black/30 rounded-full"></div>
        </div>
      </button>
    );
  };
  
  if (!selectedDate || !selectedTime) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700 text-sm">📅 Önce tarih ve saat seçin</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Bilgi */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-700 text-sm font-medium mb-1">
          📅 {new Date(selectedDate).toLocaleDateString('tr-TR')} • {selectedTime}
        </p>
        <p className="text-blue-600 text-xs">
          👤 {guestCount} kişi için {selectedSeats.length}/{guestCount} koltuk seçildi
        </p>
      </div>
      
      {/* Koltuk Düzeni */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-2">⛵ Tekne Koltuk Düzeni</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p className="flex items-center justify-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              <span>Uygun</span>
              <span className="w-3 h-3 bg-blue-500 rounded ml-3"></span>
              <span>Seçili</span>
              <span className="w-3 h-3 bg-red-500 rounded ml-3"></span>
              <span>Dolu</span>
            </p>
          </div>
        </div>
        
        <div className="relative bg-white rounded-xl p-4 border-2 border-gray-300">
          {/* Tekne Şeması */}
          <div className="flex flex-col items-center space-y-6">
            {/* Tekne Başı */}
            <div className="text-xs text-gray-500 font-medium">🚢 Tekne Başı</div>
            
            {/* Koltuklar */}
            <div className="flex justify-between w-full max-w-xs">
              {/* İskele Tarafı (Sol) */}
              <div className="space-y-3">
                <div className="text-xs text-gray-600 font-medium text-center mb-2">İskele</div>
                {iskeleSeat.map(renderSeat)}
              </div>
              
              {/* Orta Koridor */}
              <div className="w-8 flex items-center justify-center">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              </div>
              
              {/* Sancak Tarafı (Sağ) */}
              <div className="space-y-3">
                <div className="text-xs text-gray-600 font-medium text-center mb-2">Sancak</div>
                {sancakSeat.map(renderSeat)}
              </div>
            </div>
            
            {/* Tekne Kuyruk */}
            <div className="text-xs text-gray-500 font-medium">Tekne Kuyruğu 🎣</div>
          </div>
        </div>
      </div>
      
      {/* Hızlı İşlemler */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSeatChange([])}
          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          🗑️ Tümünü Temizle
        </button>
        
        {guestCount <= 6 && (
          <button
            type="button"
            onClick={() => {
              const availableIskeleSeat = iskeleSeat.filter(seat => !occupiedSeats.includes(seat));
              const seatsToSelect = availableIskeleSeat.slice(0, guestCount);
              if (seatsToSelect.length === guestCount) {
                onSeatChange(seatsToSelect);
              } else {
                alert('Yeterli boş koltuk yok!');
              }
            }}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            📍 İskele Tarafı Otomatik
          </button>
        )}
        
        {guestCount <= 6 && (
          <button
            type="button"
            onClick={() => {
              const availableSancakSeat = sancakSeat.filter(seat => !occupiedSeats.includes(seat));
              const seatsToSelect = availableSancakSeat.slice(0, guestCount);
              if (seatsToSelect.length === guestCount) {
                onSeatChange(seatsToSelect);
              } else {
                alert('Yeterli boş koltuk yok!');
              }
            }}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
          >
            📍 Sancak Tarafı Otomatik
          </button>
        )}
      </div>
    </div>
  );
}

interface Reservation {
  id: string;
  reservationNumber: string;
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  isPrivateTour: boolean;
  tourType?: string; // Tur tipi bilgisi - custom tur ID'leri de dahil
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'completed' | 'all'>(
    (statusFilter as any) || 'pending'
  );
  const [previewMessage, setPreviewMessage] = useState<{phone: string, message: string} | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});
  const [customTours, setCustomTours] = useState<any[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoatFilter, setSelectedBoatFilter] = useState<string>(''); // '' = Tüm Tekneler
  // Tarih ve saat filtresi
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTime, setFilterTime] = useState<string>('');
  // Sayfalama
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  // Koltuk seçimi için yeni state'ler
  const [editSeatSelection, setEditSeatSelection] = useState<boolean>(false);
  const [occupiedSeatsForEdit, setOccupiedSeatsForEdit] = useState<string[]>([]);
  
  // Toplu seçim için state'ler
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);
  
  // Kara liste için state'ler
  const [blacklist, setBlacklist] = useState<Array<{id: string, name: string, phone: string, reason: string}>>([]);

  // Auth kontrol
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

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
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            location: data.location // Konum bilgisini ekle
          });
        });
        
        setBoats(boatList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
    );

    return () => unsubscribe();
  }, []);

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

  // Tekne sırası belirleme (T1, T2, T3...)
  const getBoatOrder = (boatId: string) => {
    const index = boats.findIndex(boat => boat.id === boatId);
    return index >= 0 ? `T${index + 1}` : 'T?';
  };

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

  // Kara listeyi dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSnapshot(
      collection(db, 'blacklist'),
      (snapshot) => {
        const blacklistData: Array<{id: string, name: string, phone: string, reason: string}> = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          blacklistData.push({
            id: doc.id,
            name: data.name,
            phone: data.phone,
            reason: data.reason
          });
        });
        setBlacklist(blacklistData);
      },
      (error) => {
        console.error('Kara liste yüklenirken hata:', error);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Kara liste kontrol fonksiyonu
  const checkBlacklist = (phone: string, name?: string) => {
    return blacklist.find(entry => 
      entry.phone === phone || 
      (name && entry.name.toLowerCase().includes(name.toLowerCase()))
    );
  };

  const getFilteredReservations = () => {
    let filtered = reservations;
    
    // Durum filtresi
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === activeTab);
    }
    
    // Tekne filtresi
    if (selectedBoatFilter) {
      if (selectedBoatFilter === 'unassigned') {
        // Tekne atanmamış rezervasyonları göster
        filtered = filtered.filter(r => !r.selectedBoat);
      } else {
        // Belirli tekneye ait rezervasyonları göster
        filtered = filtered.filter(r => r.selectedBoat === selectedBoatFilter);
      }
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

    // Sıralama: Rezervasyon yapılma tarihi (en yeni en üstte)
    return filtered.sort((a, b) => {
      // Önce rezervasyon yapılma tarihine göre sırala (en yeni en üstte)
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();
      if (createdA !== createdB) return createdB - createdA; // En yeni önce
      
      // Eğer aynı anda yapıldılarsa rezervasyon numarasına göre sırala
      return (b.reservationNumber || '').localeCompare(a.reservationNumber || '');
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

  // Toplu seçim fonksiyonları
  const toggleReservationSelection = (reservationId: string) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const selectAllReservations = () => {
    const allIds = pagedReservations.map(r => r.id);
    setSelectedReservations(allIds);
  };

  const clearSelection = () => {
    setSelectedReservations([]);
  };

  // Toplu onaylama
  const bulkApprove = async () => {
    if (selectedReservations.length === 0) {
      alert('Lütfen onaylamak istediğiniz rezervasyonları seçin.');
      return;
    }

    if (!confirm(`${selectedReservations.length} rezervasyonu onaylamak istediğinizden emin misiniz?`)) {
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const reservationId of selectedReservations) {
      try {
        await updateDoc(doc(db, 'reservations', reservationId), {
          status: 'confirmed'
        });
        successCount++;
      } catch (error) {
        console.error(`Rezervasyon ${reservationId} onaylanırken hata:`, error);
        errorCount++;
      }
    }

    setBulkActionLoading(false);
    setSelectedReservations([]);
    
    if (errorCount === 0) {
      alert(`✅ ${successCount} rezervasyon başarıyla onaylandı!`);
    } else {
      alert(`⚠️ ${successCount} rezervasyon onaylandı, ${errorCount} rezervasyonda hata oluştu.`);
    }
  };

  // Toplu tamamlama
  const bulkComplete = async () => {
    if (selectedReservations.length === 0) {
      alert('Lütfen tamamlamak istediğiniz rezervasyonları seçin.');
      return;
    }

    if (!confirm(`${selectedReservations.length} rezervasyonu tamamlamak istediğinizden emin misiniz?`)) {
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const reservationId of selectedReservations) {
      try {
        await updateDoc(doc(db, 'reservations', reservationId), {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        successCount++;
      } catch (error) {
        console.error(`Rezervasyon ${reservationId} tamamlanırken hata:`, error);
        errorCount++;
      }
    }

    setBulkActionLoading(false);
    setSelectedReservations([]);
    
    if (errorCount === 0) {
      alert(`✅ ${successCount} rezervasyon başarıyla tamamlandı!`);
    } else {
      alert(`⚠️ ${successCount} rezervasyon tamamlandı, ${errorCount} rezervasyonda hata oluştu.`);
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
    setEditSeatSelection(false); // Görsel seçimi başlangıçta kapalı yap
  };

  const saveEditedReservation = async () => {
    if (!editingReservation || !editForm) return;
    
    try {
      const selectedBoat = boats.find(b => b.id === editForm.selectedBoat);
      
      const updateData = {
        ...editForm,
        selectedDate: editForm.selectedDate, // Tarih formatını YYYY-MM-DD olarak koru
        boatName: selectedBoat?.name || '', // Tekne adını da güncelle
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
    setEditSeatSelection(false);
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
      // Önce displayName'i kontrol et (eğer selectedTime displayName ise)
      const selectedTime = reservation.selectedTime;
      const lowerTime = selectedTime?.toLowerCase() || '';
      
      // DisplayName tespit et
      let displayName = '';
      
      // Önce selectedTime'da displayName var mı kontrol et
      if (lowerTime.includes('çine') || lowerTime.includes('cine')) {
        displayName = 'ÇİNEKOP';
      } else if (lowerTime.includes('istavrit') || lowerTime.includes('stavrit')) {
        displayName = 'İSTAVRİT';
      } else if (lowerTime.includes('akşam') || lowerTime.includes('aksam')) {
        displayName = 'AKŞAM TURU';
      } else if (lowerTime.includes('sabah')) {
        displayName = 'SABAH TURU';
      } else if (lowerTime.includes('gece')) {
        displayName = 'GECE TURU';
      } else {
        // Saat aralığına göre displayName tahmin et
        if (selectedTime === '20:00-02:00' || selectedTime === '21:00-03:00' || selectedTime === '22:00-04:00') {
          displayName = 'ÇİNEKOP'; // Gece seansları genelde çinekop
        } else if (selectedTime === '07:00-13:00' || selectedTime === '08:00-14:00') {
          displayName = 'ÇİNEKOP'; // Sabah seansları da çinekop olabilir
        }
        // Diğer saat aralıkları için varsayılan displayName yok
      }
      
      // DisplayName varsa onu kullan, yoksa normal tur formatı
      if (displayName) {
        const equipmentText = reservation.priceOption === 'own-equipment' ? ' - Kendi Ekipmanı' : 
                             reservation.priceOption === 'with-equipment' ? ' - Ekipman Dahil' : '';
        
        // Gece seansı kontrolü
        const isNightSession = selectedTime && (() => {
          const [startStr, endStr] = selectedTime.split('-');
          return startStr && endStr && startStr > endStr; // 20:00-02:00 gibi
        })();
        
        const nightIndicator = isNightSession ? ' 🌙' : '';
        
        return displayName + equipmentText + nightIndicator;
      }
      
      // Normal tur için ekipman seçeneğini kontrol et
      // Gece seansı kontrolü (normal turlar için de)
      const isNightSession = selectedTime && (() => {
        const [startStr, endStr] = selectedTime.split('-');
        return startStr && endStr && startStr > endStr; // 20:00-02:00 gibi
      })();
      
      const nightIndicator = isNightSession ? ' 🌙' : '';
      
      if (reservation.priceOption === 'own-equipment') {
        return 'Normal Tur - Kendi Ekipmanı' + nightIndicator;
      } else if (reservation.priceOption === 'with-equipment') {
        return 'Normal Tur - Ekipman Dahil' + nightIndicator;
      } else {
        return 'Normal Tur' + nightIndicator;
      }
    } else {
      // Custom tur kontrolü
      const customTour = customTours.find(tour => tour.id === reservation.tourType);
      return customTour ? customTour.name : `Bilinmeyen Tur (${reservation.tourType})`;
    }
  };

  // Saat formatını kontrol et ve gerçek saati döndür
  const getDisplayTime = (selectedTime: string, reservation?: Reservation) => {
    // Eğer selectedTime zaten "HH:MM-HH:MM" formatındaysa, direkt döndür
    if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(selectedTime)) {
      return selectedTime;
    }
    
    // Eğer displayName ise, gerçek saati bulmaya çalış
    // Önce yaygın saat formatlarını kontrol et
    const commonTimeFormats = [
      '07:00-13:00',
      '14:00-20:00',
      '08:00-14:00',
      '15:00-21:00',
      '09:00-15:00',
      '16:00-22:00',
      '01:00-23:00',
      '06:00-12:00',
      '13:00-19:00',
      '20:00-02:00'
    ];
    
    // Eğer displayName "çine", "çinekop", "akşam" gibi kelimeler içeriyorsa
    // muhtemelen bir displayName'dir
    const lowerTime = selectedTime.toLowerCase();
    if (lowerTime.includes('çine') || lowerTime.includes('akşam') || lowerTime.includes('sabah') || 
        lowerTime.includes('öğle') || lowerTime.includes('gece') || lowerTime.includes('tur') ||
        lowerTime.includes('test')) {
      
      // Rezervasyon bilgisi varsa ve tekne bilgisi varsa, o teknenin saat dilimlerini kontrol edebiliriz
      // Şimdilik genel bir mesaj döndürelim
      return `${selectedTime} (Gerçek saat: Belirlenmedi)`;
    }
    
    // Diğer durumlarda olduğu gibi döndür
    return selectedTime;
  };

  const getWhatsAppMessages = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const date = new Date(reservation.selectedDate).toLocaleDateString('tr-TR');
    const time = reservation.selectedTime;
    
    // Tekne bilgisini bul
    const boat = boats.find(b => b.id === reservation.selectedBoat);
    
    // Tekne konum bilgisini al
    let locationInfo;
    
    if (boat?.location && boat.location.googleMapsUrl) {
      // Tekne için özel konum bilgisi varsa onu kullan
      locationInfo = {
        name: boat.location.name || boat.name + ' Kalkış Noktası',
        address: boat.location.address || 'Konum bilgisi mevcut',
        coordinates: boat.location.coordinates ? 
          `${boat.location.coordinates.latitude}, ${boat.location.coordinates.longitude}` : 
          'Koordinat bilgisi mevcut',
        googleMapsUrl: boat.location.googleMapsUrl,
        directions: boat.location.directions || 'Detaylı ulaşım bilgisi için bizimle iletişime geçebilirsiniz.'
      };
    } else {
      // Tekne için konum bilgisi yoksa varsayılan konum kullan
      locationInfo = {
        name: 'Kalkış Noktası',
        address: 'Konum bilgisi güncelleniyor',
        coordinates: 'Koordinat bilgisi güncelleniyor',
        googleMapsUrl: 'https://maps.app.goo.gl/fVPxCBB9JphkEMBH7', // Varsayılan konum
        directions: 'Konum bilgisi için bizimle iletişime geçebilirsiniz.'
      };
    }
    
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
💺 Koltuk No: ${reservation.selectedSeats.join(', ')}${reservation.boatName ? `\n⛵ Tekne: ${reservation.boatName}` : ''}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
${locationInfo.name}
${locationInfo.address}

🗺️ Konum: ${locationInfo.googleMapsUrl || (locationInfo.coordinates ? 'Koordinatlar: ' + locationInfo.coordinates : 'Konum bilgisi için bize ulaşın')}

🚗 Ulaşım: 
${locationInfo.directions || '- Detaylı ulaşım bilgisi için bize ulaşabilirsiniz'}

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
  💺 Koltuk No: ${reservation.selectedSeats.join(', ')}${reservation.boatName ? `\n  ⛵ Tekne: ${reservation.boatName}` : ''}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
${locationInfo.name}
${locationInfo.address}
🗺️ Konum: ${locationInfo.googleMapsUrl || (locationInfo.coordinates ? 'Koordinatlar: ' + locationInfo.coordinates : 'Konum bilgisi için bize ulaşın')}

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
    setSelectedReservations([]); // Filtre değişince seçimleri temizle
  }, [searchTerm, filterDate, filterTime, activeTab, selectedBoatFilter]); // selectedBoatFilter dependency eklendi

  // Sayfa değiştiğinde en üste kaydır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      (mainEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSelectedReservations([]); // Sayfa değişince seçimleri temizle
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
              
              {/* Tekne Filtresi */}
              <div className="flex items-center space-x-2 ml-6">
                <span className="text-sm font-medium text-gray-700">🚢</span>
                <select
                  value={selectedBoatFilter}
                  onChange={(e) => setSelectedBoatFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Tüm Tekneler</option>
                  {boats.map((boat) => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} ({getBoatOrder(boat.id)})
                    </option>
                  ))}
                  <option value="unassigned">Tekne Atanmamış</option>
                </select>
              </div>
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

        {/* Toplu İşlem Kontrolleri */}
        {pagedReservations.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              
              {/* Seçim Kontrolleri */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllReservations}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    ☑️ Tümünü Seç
                  </button>
                  <button
                    onClick={clearSelection}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    ❌ Seçimi Temizle
                  </button>
                </div>
                
                {selectedReservations.length > 0 && (
                  <div className="bg-white px-3 py-1 rounded-full border border-purple-300">
                    <span className="text-sm font-medium text-purple-700">
                      🎯 {selectedReservations.length} rezervasyon seçili
                    </span>
                  </div>
                )}
              </div>

              {/* Toplu İşlem Butonları */}
              {selectedReservations.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={bulkApprove}
                    disabled={bulkActionLoading}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {bulkActionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Toplu Onayla ({selectedReservations.length})</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={bulkComplete}
                    disabled={bulkActionLoading}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {bulkActionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <span>🎉</span>
                        <span>Toplu Tamamla ({selectedReservations.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reservation Cards */}
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
          <div className="space-y-4">
            {pagedReservations.map((reservation, index) => (
                <div key={`reservation-${reservation.id}`} className="bg-white rounded-lg shadow-lg p-6 relative">
                  {/* Seçim Checkbox'u */}
                  <div className="absolute top-4 left-4">
                    <input
                      type="checkbox"
                      checked={selectedReservations.includes(reservation.id)}
                      onChange={() => toggleReservationSelection(reservation.id)}
                      className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 ml-8">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ml-8">
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
                      
                      {/* Kara Liste Uyarısı */}
                      {(() => {
                        const guest = reservation.guestInfos[0];
                        const blacklistEntry = guest && checkBlacklist(guest.phone, `${guest.name} ${guest.surname}`);
                        return blacklistEntry ? (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-red-600 font-bold">🚫</span>
                              <span className="text-red-800 font-semibold text-sm">KARA LİSTEDE</span>
                            </div>
                            <p className="text-red-700 text-xs">
                              <strong>Sebep:</strong> {blacklistEntry.reason}
                            </p>
                            <p className="text-red-600 text-xs mt-1">
                              ⚠️ Bu müşteri daha önce olumsuz deneyim yaşatmış
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">📅 Randevu Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Rezervasyon Tarihi:</strong> 
                        <span className="text-blue-600 font-medium ml-1">
                          {new Date(reservation.createdAt).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                      <p><strong>Randevu Tarihi:</strong> {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Saat:</strong> {getDisplayTime(reservation.selectedTime, reservation)}</p>
                      <p><strong>Tur Tipi:</strong> {getReservationTourType(reservation)}</p>
                      <p><strong>Tekne:</strong> {
                        reservation.boatName ? 
                          `${reservation.boatName} (${getBoatOrder(reservation.selectedBoat || '')})` : 
                          reservation.selectedBoat ? 
                            `${boats.find(b => b.id === reservation.selectedBoat)?.name || 'Bilinmeyen'} (${getBoatOrder(reservation.selectedBoat)})` :
                            '❌ Tekne atanmamış'
                      }</p>
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
                <div className="space-y-3 pt-4 border-t ml-8">
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
              ))}
            </div>
        )}

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
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Koltuk Seçimi</label>
                    <button
                      type="button"
                      onClick={() => setEditSeatSelection(!editSeatSelection)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {editSeatSelection ? '📝 Manuel Giriş' : '🎯 Görsel Seçim'}
                    </button>
                  </div>
                  
                  {editSeatSelection ? (
                    <SeatSelectionEditor 
                      selectedSeats={editForm.selectedSeats || []}
                      guestCount={editForm.guestCount || 1}
                      selectedDate={editForm.selectedDate || ''}
                      selectedTime={editForm.selectedTime || ''}
                      selectedBoat={editForm.selectedBoat || ''}
                      onSeatChange={(seats) => setEditForm({ ...editForm, selectedSeats: seats })}
                      reservations={reservations}
                      editingReservationId={editingReservation?.id}
                      boats={boats}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editForm.selectedSeats?.join(', ') || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        selectedSeats: e.target.value.split(', ').filter(s => s.trim()) 
                      })}
                      placeholder="Örn: 1, 2, 3 veya IS1, SA2, IS3"
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  )}
                  
                  {editForm.selectedSeats && editForm.selectedSeats.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Seçili Koltuklar:</span> {editForm.selectedSeats.join(', ')}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tekne Seçimi</label>
                  <select
                    value={editForm.selectedBoat || ''}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      selectedBoat: e.target.value,
                      selectedSeats: [] // Tekne değiştiğinde koltukları temizle
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">Tekne seçin</option>
                    {boats.map(boat => (
                      <option key={boat.id} value={boat.id}>
                        {boat.name} ({getBoatOrder(boat.id)})
                      </option>
                    ))}
                  </select>
                  
                  {editForm.selectedBoat && (
                    <div className="mt-1 text-sm text-blue-600">
                      ✅ Seçilen: {boats.find(b => b.id === editForm.selectedBoat)?.name} ({getBoatOrder(editForm.selectedBoat)})
                    </div>
                  )}
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