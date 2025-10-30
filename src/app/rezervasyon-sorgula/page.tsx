'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Reservation {
  id: string;
  reservationNumber: string;
  guestCount: number;
  adults: number;
  children: number;
  babies: number;
  selectedDate: string;
  selectedTime: string;
  selectedSeats: string[];
  isPrivateTour: boolean;
  tourType?: 'normal' | 'private' | 'fishing-swimming';
  equipmentChoices?: Array<{
    personIndex: number;
    hasEquipment: boolean;
  }>;
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
  createdAt: any; // Firestore Timestamp veya string olabilir
  totalAmount?: number;
}

export default function ReservationSearchPage() {
  const [searchForm, setSearchForm] = useState({
    name: '',
    phone: ''
  });
  const [searching, setSearching] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchForm.name.trim() || !searchForm.phone.trim()) {
      alert('Lütfen isim ve telefon numarasını giriniz');
      return;
    }

    setSearching(true);
    try {
      const reservationsRef = collection(db, 'reservations');
      
      // Tüm rezervasyonları çek (Firebase Rules sağlayarak güvenli)
      const snapshot = await getDocs(reservationsRef);
      const reservationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];

      // Client-side'da isim ve telefon ile filtreleme
      const normalizeText = (val: string) =>
        (val || '')
          .toLocaleLowerCase('tr-TR')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      const digitsOnly = (val: string) => (val || '').replace(/\D/g, '');
      const last10 = (val: string) => {
        const d = digitsOnly(val);
        return d.length >= 10 ? d.slice(-10) : d; // 10 haneli TR numaranın son 10'u
      };

      const searchName = normalizeText(searchForm.name);
      const searchPhone10 = last10(searchForm.phone);

      const filteredReservations = reservationList.filter(reservation =>
        Array.isArray(reservation.guestInfos) && reservation.guestInfos.some(guest => {
          const guestName = normalizeText(guest.name);
          const guestSurname = normalizeText(guest.surname);
          const fullName = `${guestName} ${guestSurname}`.trim();
          const guestPhone10 = last10(guest.phone);

          const nameMatch =
            guestName.includes(searchName) ||
            guestSurname.includes(searchName) ||
            fullName.includes(searchName);

          const phoneMatch = guestPhone10 !== '' && searchPhone10 !== ''
            ? guestPhone10 === searchPhone10
            : digitsOnly(guest.phone).includes(digitsOnly(searchForm.phone));

          return nameMatch && phoneMatch;
        })
      );

      setReservations(filteredReservations);
      setSearched(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      alert('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: 'Beklemede', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      confirmed: { text: 'Onaylandı', color: 'bg-green-100 text-green-800', icon: '✅' },
      cancelled: { text: 'İptal', color: 'bg-red-100 text-red-800', icon: '❌' },
      completed: { text: 'Tamamlandı', color: 'bg-blue-100 text-blue-800', icon: '🎯' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        <span>{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const paymentMap = {
      waiting: { text: 'Ödeme Bekleniyor', color: 'bg-orange-100 text-orange-800', icon: '💳' },
      received: { text: 'Ödeme Alındı', color: 'bg-blue-100 text-blue-800', icon: '💰' },
      confirmed: { text: 'Ödeme Onaylandı', color: 'bg-green-100 text-green-800', icon: '✅' }
    };
    
    const paymentInfo = paymentMap[paymentStatus as keyof typeof paymentMap] || paymentMap.waiting;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${paymentInfo.color}`}>
        <span>{paymentInfo.icon}</span>
        <span>{paymentInfo.text}</span>
      </span>
    );
  };

  const getTourTypeName = (tourType?: string, isPrivateTour?: boolean) => {
    if (isPrivateTour) return 'Özel Tur';
    
    switch (tourType) {
      case 'fishing-swimming': return 'Balık Avı + Yüzme';
      case 'private': return 'Özel Tur';
      default: return 'Normal Tur';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Rezervasyon Sorgula</h1>
            <p className="text-gray-600">
              İsim ve telefon numaranızla rezervasyonunuzu sorgulayabilirsiniz
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Arama Formu */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  📝 İsim Soyisim
                </label>
                <input
                  type="text"
                  id="name"
                  value={searchForm.name}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Örn: Ahmet Yılmaz"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  📞 Telefon Numarası
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={searchForm.phone}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Örn: 0532 123 45 67"
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={searching}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Aranıyor...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Rezervasyon Ara</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sonuçlar */}
        {searched && (
          <div className="space-y-6">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">😕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Rezervasyon Bulunamadı</h3>
                <p className="text-gray-600 mb-6">
                  Girdiğiniz bilgilerle eşleşen bir rezervasyon bulunamadı.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Kontrol Edilecekler:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• İsim soyisim doğru yazıldı mı?</li>
                    <li>• Telefon numarası rezervasyon sırasında verilen ile aynı mı?</li>
                    <li>• Rezervasyon başka bir isimle yapılmış olabilir mi?</li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/randevu"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    🎣 Yeni Rezervasyon Yap
                  </Link>
                  <Link
                    href="/iletisim"
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    📞 İletişime Geç
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  🎯 {reservations.length} Rezervasyon Bulundu
                </h3>
                
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="bg-white rounded-xl shadow-lg p-6 text-gray-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          Rezervasyon #{reservation.reservationNumber}
                        </h4>
                        <p className="text-gray-600">
                          {(() => {
                            try {
                              // Firestore Timestamp kontrolü
                              if (reservation.createdAt && typeof reservation.createdAt === 'object' && reservation.createdAt.toDate) {
                                return reservation.createdAt.toDate().toLocaleDateString('tr-TR');
                              }
                              // String tarih kontrolü
                              if (reservation.createdAt) {
                                return new Date(reservation.createdAt).toLocaleDateString('tr-TR');
                              }
                              return '';
                            } catch (error) {
                              return '';
                            }
                          })()} {reservation.createdAt ? 'tarihinde oluşturuldu' : 'Tarih bilgisi yok'}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-3 lg:mt-0">
                        {getStatusBadge(reservation.status)}
                        {getPaymentBadge(reservation.paymentStatus)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">📅</span>
                        <span className="font-medium">
                          {new Date(reservation.selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">🕐</span>
                        <span className="font-medium">{reservation.selectedTime}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">👥</span>
                        <span className="font-medium">
                          {reservation.adults || reservation.guestCount} kişi
                          {reservation.children && reservation.children > 0 && `, ${reservation.children} çocuk`}
                          {reservation.babies && reservation.babies > 0 && `, ${reservation.babies} bebek`}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">🎣</span>
                        <span className="font-medium">{getTourTypeName(reservation.tourType, reservation.isPrivateTour)}</span>
                      </div>
                      
                      {reservation.totalAmount && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">💰</span>
                          <span className="font-medium">{reservation.totalAmount}₺</span>
                        </div>
                      )}
                      
                      {reservation.selectedSeats && reservation.selectedSeats.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">🪑</span>
                          <span className="font-medium">Koltuk: {reservation.selectedSeats.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Misafir Bilgileri */}
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 mb-2">👤 Misafir Bilgileri:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {reservation.guestInfos.map((guest, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {guest.name} {guest.surname} ({guest.age} yaş)
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Durum Açıklaması */}
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">
                          {reservation.status === 'pending' && '⏳ Rezervasyonunuz işleme alındı, onay bekliyor.'}
                          {reservation.status === 'confirmed' && '✅ Rezervasyonunuz onaylandı! Belirtilen tarihte limana gelmeniz yeterli.'}
                          {reservation.status === 'completed' && '🎯 Rezervasyonunuz başarıyla tamamlandı. Teşekkür ederiz!'}
                          {reservation.status === 'cancelled' && '❌ Rezervasyonunuz iptal edilmiştir.'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Yardım Bölümü */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-blue-900 mb-3">🆘 Yardıma İhtiyacınız mı Var?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">📞 İletişim:</h4>
              <p>Rezervasyonunuzla ilgili sorularınız için bize ulaşabilirsiniz.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📧 Destek:</h4>
              <p>E-posta ile detaylı bilgi alabilir, rezervasyon durumunuzu sorgulayabilirsiniz.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/iletisim"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
            >
              📞 İletişime Geç
            </Link>
            <Link
              href="/randevu"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
            >
              🎣 Yeni Rezervasyon Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 