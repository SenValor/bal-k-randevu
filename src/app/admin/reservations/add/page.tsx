'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

interface NewReservation {
  tourType: 'normal' | 'private' | 'fishing-swimming';
  priceOption: 'own-equipment' | 'with-equipment';
  guestCount: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  guestInfo: {
    name: string;
    surname: string;
    phone: string;
    email: string;
  };
  status: 'pending' | 'confirmed';
  paymentStatus: 'waiting' | 'received' | 'confirmed';
}

export default function AddReservationPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [dateOccupancy, setDateOccupancy] = useState<{[key: string]: number}>({});
  
  const [newReservation, setNewReservation] = useState<NewReservation>({
    tourType: 'normal',
    priceOption: 'own-equipment',
    guestCount: 1,
    selectedDate: '',
    selectedTime: '',
    selectedSeats: [],
    guestInfo: {
      name: '',
      surname: '',
      phone: '',
      email: ''
    },
    status: 'confirmed',
    paymentStatus: 'waiting'
  });

  const availableTimes = ['07:00-13:00', '14:00-20:00'];
  const iskeleSeat = ['IS1', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6'];
  const sancakSeat = ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'];

  // Randevu numarası oluşturma
  const generateReservationNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `RV-${year}${month}${day}-${timestamp}`;
  };

  // Tarih doluluk hesaplama
  const calculateDateOccupancy = async () => {
    try {
      const reservationsRef = collection(db, 'reservations');
      const snapshot = await getDocs(reservationsRef);
      const occupancyData: {[key: string]: number} = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          const dateKey = `${data.selectedDate}-${data.selectedTime}`;
          occupancyData[dateKey] = (occupancyData[dateKey] || 0) + data.guestCount;
        }
      });
      
      setDateOccupancy(occupancyData);
    } catch (error: any) {
      console.error('Doluluk hesaplama hatası:', error);
    }
  };

  // Dolu koltukları getir
  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time) return;
    
    try {
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('selectedDate', '==', date),
        where('selectedTime', '==', time)
      );
      
      const snapshot = await getDocs(q);
      const occupied: string[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
          occupied.push(...data.selectedSeats);
        }
      });
      
      setOccupiedSeats(occupied);
    } catch (error: any) {
      console.error('Dolu koltuk getirme hatası:', error);
    }
  };

  // Tarih veya saat değiştiğinde dolu koltukları güncelle
  useEffect(() => {
    if (newReservation.selectedDate && newReservation.selectedTime) {
      fetchOccupiedSeats(newReservation.selectedDate, newReservation.selectedTime);
    }
  }, [newReservation.selectedDate, newReservation.selectedTime]);

  // Sayfa yüklendiğinde doluluk hesapla
  useEffect(() => {
    calculateDateOccupancy();
  }, []);

  // Koltuk durumu
  const getSeatStatus = (seat: string): 'available' | 'occupied' | 'selected' => {
    if (occupiedSeats.includes(seat)) return 'occupied';
    if (newReservation.selectedSeats.includes(seat)) return 'selected';
    return 'available';
  };

  // Koltuk rengi
  const getSeatColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 cursor-not-allowed';
      case 'selected': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Koltuk seçimi
  const handleSeatSelection = (seatId: string) => {
    const status = getSeatStatus(seatId);
    if (status === 'occupied') return;

    if (status === 'selected') {
      // Koltuk seçiliyse kaldır
      setNewReservation(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.filter(s => s !== seatId)
      }));
    } else {
      // Koltuk seçili değilse ekle (kişi sayısı kadar)
      if (newReservation.selectedSeats.length < newReservation.guestCount) {
        setNewReservation(prev => ({
          ...prev,
          selectedSeats: [...prev.selectedSeats, seatId]
        }));
      } else {
        alert('Kişi sayısından fazla koltuk seçemezsiniz!');
      }
    }
  };

  // Koltuk render
  const renderSeat = (seatId: string) => {
    const status = getSeatStatus(seatId);
    const color = getSeatColor(status);
    
    return (
      <button
        key={seatId}
        onClick={() => handleSeatSelection(seatId)}
        disabled={status === 'occupied'}
        className={`w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center text-sm font-medium transition-all ${color}`}
      >
        {seatId}
      </button>
    );
  };

  // Randevu ekleme
  const addNewReservation = async () => {
    // Validasyon
    if (!newReservation.selectedDate || !newReservation.selectedTime) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }
    
    if (newReservation.selectedSeats.length !== newReservation.guestCount) {
      alert('Lütfen kişi sayısı kadar koltuk seçin');
      return;
    }
    
    if (!newReservation.guestInfo.name || !newReservation.guestInfo.surname) {
      alert('Lütfen ad ve soyad girin');
      return;
    }
    
    if (!newReservation.guestInfo.phone) {
      alert('Lütfen telefon numarası girin');
      return;
    }

    setAdding(true);
    
    try {
      const reservationData = {
        reservationNumber: generateReservationNumber(),
        guestCount: newReservation.guestCount,
        selectedDate: newReservation.selectedDate,
        selectedTime: newReservation.selectedTime,
        selectedSeats: newReservation.selectedSeats,
        isPrivateTour: newReservation.tourType === 'private',
        tourType: newReservation.tourType,
        priceOption: newReservation.priceOption,
        guestInfos: [
          {
            name: newReservation.guestInfo.name,
            surname: newReservation.guestInfo.surname,
            phone: newReservation.guestInfo.phone,
            email: newReservation.guestInfo.email || '',
            gender: 'Erkek', // Varsayılan
            age: '30' // Varsayılan
          }
        ],
        status: newReservation.status,
        paymentStatus: newReservation.paymentStatus,
        createdAt: new Date(),
        adminCreated: true
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      
      alert('Randevu başarıyla eklendi!');
      router.push('/admin/reservations');
    } catch (error: any) {
      console.error('Randevu ekleme hatası:', error);
      alert('Randevu eklenirken hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/reservations" className="text-blue-600 hover:text-blue-800">
                ← Randevu Yönetimi
              </Link>
              <h1 className="text-xl font-bold text-gray-900">➕ Randevu Ekle</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* Tur Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tur Tipi
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'normal'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'normal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Normal Tur
                </button>
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'private'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'private'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Özel Tur
                </button>
                <button
                  onClick={() => setNewReservation(prev => ({...prev, tourType: 'fishing-swimming'}))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    newReservation.tourType === 'fishing-swimming'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Balık Tutma & Yüzme
                </button>
              </div>
            </div>

            {/* Malzeme Seçeneği */}
            {newReservation.tourType === 'normal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Malzeme Seçeneği
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewReservation(prev => ({...prev, priceOption: 'own-equipment'}))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      newReservation.priceOption === 'own-equipment'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Kendi Malzemesi
                  </button>
                  <button
                    onClick={() => setNewReservation(prev => ({...prev, priceOption: 'with-equipment'}))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      newReservation.priceOption === 'with-equipment'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Malzeme Dahil
                  </button>
                </div>
              </div>
            )}

            {/* Kişi Sayısı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kişi Sayısı
              </label>
                              <input
                  type="number"
                  min="1"
                  max="12"
                  value={newReservation.guestCount}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestCount: parseInt(e.target.value) || 1,
                    selectedSeats: [] // Kişi sayısı değiştiğinde seçilen koltukları temizle
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
            </div>

            {/* Tarih ve Saat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={newReservation.selectedDate}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    selectedDate: e.target.value,
                    selectedSeats: [] // Tarih değiştiğinde seçilen koltukları temizle
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saat
                </label>
                <select
                  value={newReservation.selectedTime}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    selectedTime: e.target.value,
                    selectedSeats: [] // Saat değiştiğinde seçilen koltukları temizle
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Saat seçin</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Koltuk Seçimi */}
            {newReservation.selectedDate && newReservation.selectedTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koltuk Seçimi ({newReservation.selectedSeats.length}/{newReservation.guestCount})
                </label>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-center space-x-8">
                    {/* İskele Tarafı */}
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 mb-2">İskele</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {iskeleSeat.map(seat => renderSeat(seat))}
                      </div>
                    </div>
                    
                    {/* Sancak Tarafı */}
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 mb-2">Sancak</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {sancakSeat.map(seat => renderSeat(seat))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                      <span>Müsait</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                      <span>Seçili</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                      <span>Dolu</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Müşteri Bilgileri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Bilgileri
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Ad"
                  value={newReservation.guestInfo.name}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, name: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="text"
                  placeholder="Soyad"
                  value={newReservation.guestInfo.surname}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, surname: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  value={newReservation.guestInfo.phone}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, phone: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="email"
                  placeholder="E-posta (opsiyonel)"
                  value={newReservation.guestInfo.email}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    guestInfo: {...prev.guestInfo, email: e.target.value}
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Durum Seçimi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rezervasyon Durumu
                </label>
                <select
                  value={newReservation.status}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    status: e.target.value as 'pending' | 'confirmed'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="confirmed">Onaylı</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Durumu
                </label>
                <select
                  value={newReservation.paymentStatus}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    paymentStatus: e.target.value as 'waiting' | 'received' | 'confirmed'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="waiting">Bekliyor</option>
                  <option value="received">Alındı</option>
                  <option value="confirmed">Onaylandı</option>
                </select>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/reservations"
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </Link>
              <button
                onClick={addNewReservation}
                disabled={adding}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {adding ? 'Ekleniyor...' : 'Randevu Ekle'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 