'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Ship,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Reservation } from '@/lib/reservationHelpers';
import { useRouter } from 'next/navigation';

export default function PendingReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Toplu Onay
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, reservations]);

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      setReservations(data);
      setFilteredReservations(data);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    if (!searchTerm) {
      setFilteredReservations(reservations);
      return;
    }

    const filtered = reservations.filter(
      (res) =>
        (res.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.boatName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.userPhone || '').includes(searchTerm) ||
        (res.reservationNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredReservations(filtered);
  };

  const handleApprove = async (reservationId: string) => {
    if (!confirm('Bu rezervasyonu onaylamak istediğinize emin misiniz?')) return;

    try {
      setProcessingId(reservationId);
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      });

      // Listeyi güncelle
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      alert('✅ Rezervasyon onaylandı! WhatsApp mesajı gönderilecek.');
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('❌ Rezervasyon onaylanırken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reservationId: string) => {
    if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;

    try {
      setProcessingId(reservationId);
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });

      // Listeyi güncelle
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      alert('❌ Rezervasyon iptal edildi.');
    } catch (error) {
      console.error('İptal hatası:', error);
      alert('❌ Rezervasyon iptal edilirken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  // Toplu Onaylama
  const handleBulkApprove = async () => {
    if (selectedReservations.length === 0) {
      alert('⚠️ Lütfen en az bir rezervasyon seçin.');
      return;
    }

    if (!confirm(`${selectedReservations.length} rezervasyonu onaylamak istediğinize emin misiniz?`)) return;

    try {
      setBulkProcessing(true);
      
      const promises = selectedReservations.map(async (id) => {
        const reservationRef = doc(db, 'reservations', id);
        await updateDoc(reservationRef, {
          status: 'confirmed',
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(promises);

      setReservations((prev) => prev.filter((r) => !selectedReservations.includes(r.id)));
      setSelectedReservations([]);
      alert(`✅ ${selectedReservations.length} rezervasyon onaylandı! WhatsApp mesajları gönderilecek.`);
    } catch (error) {
      console.error('Toplu onaylama hatası:', error);
      alert('❌ Rezervasyonlar onaylanırken bir hata oluştu.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Toplu İptal
  const handleBulkReject = async () => {
    if (selectedReservations.length === 0) {
      alert('⚠️ Lütfen en az bir rezervasyon seçin.');
      return;
    }

    if (!confirm(`${selectedReservations.length} rezervasyonu iptal etmek istediğinize emin misiniz?`)) return;

    try {
      setBulkProcessing(true);
      
      const promises = selectedReservations.map(async (id) => {
        const reservationRef = doc(db, 'reservations', id);
        await updateDoc(reservationRef, {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(promises);

      setReservations((prev) => prev.filter((r) => !selectedReservations.includes(r.id)));
      setSelectedReservations([]);
      alert(`❌ ${selectedReservations.length} rezervasyon iptal edildi.`);
    } catch (error) {
      console.error('Toplu iptal hatası:', error);
      alert('❌ Rezervasyonlar iptal edilirken bir hata oluştu.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Tümünü Seç/Kaldır
  const handleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.map((r) => r.id));
    }
  };

  // Tekli Seçim
  const handleSelectReservation = (id: string) => {
    setSelectedReservations((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <button
            onClick={() => router.push('/admin-sefa3986')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Clock className="w-10 h-10 text-yellow-400" />
                Bekleyen Randevular
              </h1>
              <p className="text-white/60 text-lg">
                Onay bekleyen rezervasyonları görüntüleyin ve yönetin
              </p>
            </div>

            {/* Stats Badge */}
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-6 py-4">
              <p className="text-yellow-400/60 text-sm mb-1">Bekleyen</p>
              <p className="text-4xl font-bold text-yellow-400">{filteredReservations.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Bulk Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ad, email, telefon veya rezervasyon numarası ara..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:border-yellow-400 focus:bg-white/10 outline-none transition-all"
              />
            </div>

            {/* Bulk Actions */}
            {selectedReservations.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkProcessing}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>Onayla ({selectedReservations.length})</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkProcessing}
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white hover:text-red-400 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span>İptal ({selectedReservations.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-12 text-center"
          >
            <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Bekleyen Randevu Yok
            </h3>
            <p className="text-white/60">
              Şu anda onay bekleyen rezervasyon bulunmuyor.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedReservations.length === filteredReservations.length && filteredReservations.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-white font-medium">
                  {selectedReservations.length === filteredReservations.length && filteredReservations.length > 0
                    ? 'Tümünü Kaldır'
                    : 'Tümünü Seç'}
                  {selectedReservations.length > 0 && (
                    <span className="ml-2 text-yellow-400">({selectedReservations.length} seçili)</span>
                  )}
                </span>
              </label>
            </div>

            {filteredReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 border rounded-xl p-6 hover:bg-white/10 transition-all ${
                  selectedReservations.includes(reservation.id)
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-yellow-500/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Checkbox */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedReservations.includes(reservation.id)}
                      onChange={() => handleSelectReservation(reservation.id)}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                  {/* Info */}
                  <div className="space-y-4">
                    {/* Reservation Number & Date */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-3 py-1">
                        <p className="text-yellow-400 font-bold text-sm">
                          {reservation.reservationNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(reservation.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.timeSlotDisplay}</span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-white">
                        <User className="w-4 h-4 text-white/40" />
                        <span className="text-sm">{reservation.userName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Mail className="w-4 h-4 text-white/40" />
                        <span className="text-sm">{reservation.userEmail || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Phone className="w-4 h-4 text-white/40" />
                        <span className="text-sm">{reservation.userPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Ship className="w-4 h-4 text-white/40" />
                        <span className="text-sm">{reservation.boatName || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Tour & Price */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="bg-white/5 rounded-lg px-3 py-1">
                        <p className="text-white/60 text-xs">Tur</p>
                        <p className="text-white font-semibold text-sm">{reservation.tourName || 'N/A'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-1">
                        <p className="text-white/60 text-xs">Kişi</p>
                        <p className="text-white font-semibold text-sm">{reservation.totalPeople || 0}</p>
                      </div>
                      <div className="bg-green-500/20 border border-green-500/40 rounded-lg px-3 py-1">
                        <p className="text-green-400/60 text-xs">Toplam</p>
                        <p className="text-green-400 font-bold text-sm">₺{reservation.totalPrice?.toLocaleString('tr-TR') || 0}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col gap-3">
                    <button
                      onClick={() => handleApprove(reservation.id)}
                      disabled={processingId === reservation.id}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === reservation.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Onayla</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(reservation.id)}
                      disabled={processingId === reservation.id}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white hover:text-red-400 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === reservation.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          <span>İptal</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
