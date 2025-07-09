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
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const sendWhatsAppMessage = (phone: string, message: string, fromBusinessNumber: boolean = true) => {
    let targetPhone = phone;
    
    if (fromBusinessNumber) {
      // İşletme numarasını kullan (ayarlarda tanımlı WhatsApp numarası)
      // Bu durumda işletme numarasından müşteriye mesaj gönderilir
      targetPhone = phone;
    }
    
    const cleanPhone = targetPhone.replace(/\D/g, ''); // Sadece rakamları al
    const formattedPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.substring(1) : cleanPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getWhatsAppMessages = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    const date = new Date(reservation.selectedDate).toLocaleDateString('tr-TR');
    const time = reservation.selectedTime;
    const tourType = reservation.isPrivateTour ? 'Özel Tur' : 'Normal Tur';
    
    return {
      approved: `🎉 Merhaba ${guest?.name}! 

Tekne randevunuz onaylandı! ✅

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}
👥 Kişi Sayısı: ${reservation.guestCount}
💺 Koltuk No: ${reservation.selectedSeats.join(', ')}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
Eyüp Odabaşı Sporcular Parkı - İskele
Sarıyer/İstanbul

🗺️ Konum: https://maps.google.com/?q=41.1063,29.0587

🚗 Ulaşım: 
- Sarıyer-Eyüp minibüsü ile "Odabaşı" durağı
- Özel araç için park alanı mevcut

Randevu saatinden 15 dakika önce hazır olmanızı rica ederiz. 
Herhangi bir sorunuz varsa bize ulaşabilirsiniz.

Bizi tercih ettiğiniz için teşekkürler! 🙏`,

      reminder: `⏰ Randevu Hatırlatması

Merhaba ${guest?.name}!

Yarın tekne randevunuz var:

📅 Tarih: ${date}
⏰ Saat: ${time}
🚢 Tur Tipi: ${tourType}
👥 Kişi Sayısı: ${reservation.guestCount}
💺 Koltuk No: ${reservation.selectedSeats.join(', ')}

Randevu No: ${reservation.reservationNumber}

📍 BULUŞMA YERİ:
Eyüp Odabaşı Sporcular Parkı - İskele
🗺️ Konum: https://maps.google.com/?q=41.1063,29.0587

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
  const stats = {
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    total: reservations.length
  };

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
            
            <Link
              href="/admin/reservations/add"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Randevu Ekle
            </Link>
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

        {/* Search Bar */}
        <div className="mb-6">
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
        </div>

        {/* Results Info */}
        {(searchTerm || filteredReservations.length > 0) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {searchTerm ? (
                <><strong>"{searchTerm}"</strong> araması için {filteredReservations.length} sonuç bulundu</>
              ) : (
                <><strong>{filteredReservations.length}</strong> randevu gösteriliyor</>
              )}
            </p>
          </div>
        )}

        {/* Reservation Cards */}
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
            filteredReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(reservation.paymentStatus)}`}>
                      💳 {getPaymentStatusText(reservation.paymentStatus)}
                    </span>
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
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">📅 Randevu Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Tarih:</strong> {new Date(reservation.selectedDate).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Saat:</strong> {reservation.selectedTime}</p>
                      <p><strong>Tur Tipi:</strong> {reservation.isPrivateTour ? 'Özel Tur' : 'Normal Tur'}</p>
                      <p><strong>Koltuklar:</strong> {reservation.selectedSeats.join(', ')}</p>
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
            ))
          )}
        </div>
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