'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Calendar, Clock, Ship, Compass, Users, MapPin, CheckCircle, XCircle, AlertCircle, Phone, X } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Reservation, cancelReservationByNumber } from '@/lib/reservationHelpers';

export default function MyReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Rezervasyonlar çekiliyor, userId:', user.uid);

        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', user.uid)
        );

        const snapshot = await getDocs(q);
        const reservationsList: Reservation[] = [];

        console.log('Bulunan rezervasyon sayısı:', snapshot.size);

        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Rezervasyon:', doc.id, data);
          reservationsList.push({
            id: doc.id,
            ...data,
          } as Reservation);
        });

        // Tarihe göre sırala (client-side)
        reservationsList.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setReservations(reservationsList);
      } catch (error) {
        console.error('Rezervasyonlar alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 border-green-500/50 text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/50 text-red-400';
      default:
        return 'bg-white/10 border-white/50 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const handleCancelReservation = async () => {
    const reservation = reservations.find(r => r.id === cancellingId);
    if (!reservation) return;

    if (!phoneNumber.trim()) {
      setCancelError('Lütfen telefon numaranızı girin');
      return;
    }

    setCancelLoading(true);
    setCancelError('');

    try {
      const result = await cancelReservationByNumber(reservation.reservationNumber, phoneNumber);

      if (result.success) {
        // Listeyi güncelle
        setReservations(prev =>
          prev.map(r =>
            r.id === cancellingId ? { ...r, status: 'cancelled' as const } : r
          )
        );
        // Modal'ı kapat
        setCancellingId(null);
        setPhoneNumber('');
        alert('Rezervasyonunuz başarıyla iptal edildi');
      } else {
        setCancelError(result.error || 'İptal işlemi başarısız oldu');
      }
    } catch (error) {
      setCancelError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Giriş yapmamış
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#C5D9E8] via-[#B5C9D8] to-[#D5E9F0] pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/40 p-12 shadow-2xl"
          >
            <Calendar className="w-16 h-16 text-[#6B9BC3] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#0D2847] mb-3">
              Randevularınızı Görüntüleyin
            </h1>
            <p className="text-[#1B3A5C]/70 mb-6">
              Randevularınızı görmek için giriş yapmanız gerekmektedir.
            </p>
            <button
              onClick={() => window.location.href = '/profile'}
              className="px-8 py-3 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl transition-colors"
            >
              Giriş Yap
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#C5D9E8] via-[#B5C9D8] to-[#D5E9F0] pt-24 pb-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D2847] mb-3">
            Randevularım 📅
          </h1>
          <p className="text-[#1B3A5C]/70 text-lg">
            Tüm rezervasyonlarınızı buradan takip edebilirsiniz
          </p>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#6B9BC3] animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-12 text-center shadow-xl"
          >
            <Calendar className="w-16 h-16 text-[#6B9BC3] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0D2847] mb-3">
              Henüz Randevunuz Yok
            </h2>
            <p className="text-[#1B3A5C]/70 mb-6">
              Hemen bir rezervasyon yaparak deniz keyfinize başlayın!
            </p>
            <button
              onClick={() => window.location.href = '/rezervasyon'}
              className="px-8 py-3 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl transition-colors"
            >
              Rezervasyon Yap
            </button>
          </motion.div>
        ) : (
          /* Reservations List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 backdrop-blur-2xl rounded-2xl border-2 border-[#6B9BC3]/50 p-6 hover:bg-white/80 hover:border-[#6B9BC3]/70 hover:shadow-2xl transition-all shadow-xl"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                    {getStatusIcon(reservation.status)}
                    <span className="text-sm font-medium">{getStatusText(reservation.status)}</span>
                  </div>
                  <span className="text-[#1B3A5C]/60 text-sm">
                    {new Date(reservation.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                {/* Boat & Tour Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Ship className="w-5 h-5 text-[#6B9BC3]" />
                    <div>
                      <p className="text-[#0D2847] font-semibold">{reservation.boatName}</p>
                      <p className="text-[#1B3A5C]/70 text-sm">{reservation.tourName}</p>
                    </div>
                  </div>

                  {reservation.boatMapsLink && (
                    <div className="bg-[#6B9BC3]/10 rounded-lg p-3 -mx-2">
                      <a
                        href={reservation.boatMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#6B9BC3] hover:text-[#5B8DB8] font-medium transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">Kalkış Noktasını Haritada Gör</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[#1B3A5C]">
                    <Calendar className="w-5 h-5 text-[#6B9BC3]" />
                    <span>{new Date(reservation.date).toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[#1B3A5C]">
                    <Clock className="w-5 h-5 text-[#6B9BC3]" />
                    <span>{reservation.timeSlotDisplay}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[#1B3A5C]">
                    <Users className="w-5 h-5 text-[#6B9BC3]" />
                    <span>{reservation.totalPeople} Kişi</span>
                  </div>

                  {/* Seat Codes */}
                  {reservation.selectedSeats && reservation.selectedSeats.length > 0 && (
                    <div className="flex items-start gap-3 text-white/80">
                      <MapPin className="w-5 h-5 text-[#6B9BC3] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#1B3A5C]/70 mb-1">Koltuk Numaraları:</p>
                        <div className="flex flex-wrap gap-2">
                          {reservation.selectedSeats.map((seat) => (
                            <span
                              key={seat}
                              className="px-2 py-1 bg-[#6B9BC3]/20 border border-[#6B9BC3]/50 text-[#6B9BC3] rounded text-xs font-mono"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="pt-4 border-t border-[#6B9BC3]/20 flex items-center justify-between">
                  <span className="text-[#1B3A5C]/70">Toplam Tutar:</span>
                  <span className="text-[#8B3A3A] font-bold text-xl">₺{reservation.totalPrice}</span>
                </div>

                {/* Cancel Button */}
                {reservation.status !== 'cancelled' && (
                  <button
                    onClick={() => setCancellingId(reservation.id)}
                    className="w-full mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-600 rounded-lg font-medium transition-all"
                  >
                    Rezervasyonu İptal Et
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancellingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setCancellingId(null);
              setPhoneNumber('');
              setCancelError('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0D2847]">
                  Rezervasyonu İptal Et
                </h3>
                <button
                  onClick={() => {
                    setCancellingId(null);
                    setPhoneNumber('');
                    setCancelError('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  ⚠️ Bu işlem geri alınamaz. Rezervasyonunuzu iptal etmek istediğinizden emin misiniz?
                </p>
              </div>

              {/* Phone Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numaranız
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Doğrulama için kayıtlı telefon numaranızı girin
                </p>
              </div>

              {/* Error */}
              {cancelError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{cancelError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCancellingId(null);
                    setPhoneNumber('');
                    setCancelError('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCancelReservation}
                  disabled={cancelLoading || !phoneNumber.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      İptal Ediliyor...
                    </>
                  ) : (
                    'İptal Et'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
