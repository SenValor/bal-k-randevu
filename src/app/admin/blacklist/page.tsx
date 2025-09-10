'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';

interface BlacklistEntry {
  id: string;
  name: string;
  phone: string;
  reason: string;
  addedAt: string;
  addedBy: string;
  reservationNumber?: string;
  notes?: string;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  guestInfos: Array<{
    name: string;
    surname: string;
    phone: string;
  }>;
  status: string;
}

export default function BlacklistPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEntry, setNewEntry] = useState({
    name: '',
    phone: '',
    reason: '',
    notes: '',
    reservationNumber: ''
  });

  // Auth kontrol
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Kara liste verilerini dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'blacklist'), orderBy('addedAt', 'desc')),
      (snapshot) => {
        const entries: BlacklistEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as BlacklistEntry);
        });
        setBlacklist(entries);
      },
      (error) => {
        console.error('Kara liste yüklenirken hata:', error);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Rezervasyonları dinle (hızlı ekleme için)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'reservations'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const reservationList: Reservation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          reservationList.push({
            id: doc.id,
            reservationNumber: data.reservationNumber,
            guestInfos: data.guestInfos || [],
            status: data.status
          });
        });
        setReservations(reservationList);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/admin');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const addToBlacklist = async () => {
    if (!newEntry.name.trim() || !newEntry.phone.trim() || !newEntry.reason.trim()) {
      alert('Lütfen gerekli alanları doldurun (İsim, Telefon, Sebep)');
      return;
    }

    try {
      await addDoc(collection(db, 'blacklist'), {
        name: newEntry.name.trim(),
        phone: newEntry.phone.trim(),
        reason: newEntry.reason.trim(),
        notes: newEntry.notes.trim(),
        reservationNumber: newEntry.reservationNumber.trim(),
        addedAt: new Date().toISOString(),
        addedBy: auth.currentUser?.email || 'Bilinmeyen'
      });

      setNewEntry({
        name: '',
        phone: '',
        reason: '',
        notes: '',
        reservationNumber: ''
      });
      setShowAddModal(false);
      alert('✅ Kara listeye eklendi!');
    } catch (error) {
      console.error('Kara listeye ekleme hatası:', error);
      alert('❌ Ekleme sırasında hata oluştu');
    }
  };

  const removeFromBlacklist = async (id: string, name: string) => {
    if (!confirm(`${name} kişisini kara listeden çıkarmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blacklist', id));
      alert('✅ Kara listeden çıkarıldı!');
    } catch (error) {
      console.error('Kara listeden çıkarma hatası:', error);
      alert('❌ Çıkarma sırasında hata oluştu');
    }
  };

  const quickAddFromReservation = (reservation: Reservation) => {
    const guest = reservation.guestInfos[0];
    if (guest) {
      setNewEntry({
        name: `${guest.name} ${guest.surname}`,
        phone: guest.phone,
        reason: 'Rezervasyona gelmedi',
        notes: '',
        reservationNumber: reservation.reservationNumber
      });
      setShowAddModal(true);
    }
  };

  const filteredBlacklist = blacklist.filter(entry =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.phone.includes(searchTerm) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">
                🚫 Kara Liste Yönetimi
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🏠 Ana Sayfa
              </Link>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🚪 Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="İsim, telefon veya sebebe göre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ Kara Listeye Ekle
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Toplam Kara Liste</p>
                <p className="text-3xl font-bold">{blacklist.length}</p>
              </div>
              <div className="text-4xl opacity-80">🚫</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Bu Ay Eklenen</p>
                <p className="text-3xl font-bold">
                  {blacklist.filter(entry => {
                    const entryDate = new Date(entry.addedAt);
                    const now = new Date();
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Arama Sonucu</p>
                <p className="text-3xl font-bold">{filteredBlacklist.length}</p>
              </div>
              <div className="text-4xl opacity-80">🔍</div>
            </div>
          </div>
        </div>

        {/* Blacklist Table */}
        {filteredBlacklist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">😇</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Kara liste boş'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Farklı bir arama terimi deneyin' : 'Henüz kara listeye kimse eklenmemiş'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                      Müşteri Bilgileri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                      Sebep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                      Rezervasyon No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                      Eklenme Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBlacklist.map((entry) => (
                    <tr key={entry.id} className="hover:bg-red-25">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            🚫 {entry.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            📞 {entry.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.reason}</div>
                        {entry.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            💭 {entry.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.reservationNumber || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(entry.addedAt).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(entry.addedAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeFromBlacklist(entry.id, entry.name)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          ✅ Çıkar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hızlı Ekleme - Son Rezervasyonlar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ Hızlı Ekleme - Son Rezervasyonlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.slice(0, 6).map((reservation) => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.guestInfos[0]?.name} {reservation.guestInfos[0]?.surname}
                    </div>
                    <div className="text-sm text-gray-500">
                      📞 {reservation.guestInfos[0]?.phone}
                    </div>
                    <div className="text-xs text-gray-400">
                      #{reservation.reservationNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => quickAddFromReservation(reservation)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    🚫 Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  🚫 Kara Listeye Ekle
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İsim Soyisim *
                  </label>
                  <input
                    type="text"
                    value={newEntry.name}
                    onChange={(e) => setNewEntry({...newEntry, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={newEntry.phone}
                    onChange={(e) => setNewEntry({...newEntry, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    placeholder="Örn: 0555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sebep *
                  </label>
                  <select
                    value={newEntry.reason}
                    onChange={(e) => setNewEntry({...newEntry, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                  >
                    <option value="">Sebep seçin</option>
                    <option value="Rezervasyona gelmedi">Rezervasyona gelmedi</option>
                    <option value="Son dakika iptali">Son dakika iptali</option>
                    <option value="Ödeme yapmadı">Ödeme yapmadı</option>
                    <option value="Kurallara uymadı">Kurallara uymadı</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rezervasyon No
                  </label>
                  <input
                    type="text"
                    value={newEntry.reservationNumber}
                    onChange={(e) => setNewEntry({...newEntry, reservationNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    placeholder="Örn: R001234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notlar
                  </label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    placeholder="Ek bilgiler..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={addToBlacklist}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  🚫 Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
