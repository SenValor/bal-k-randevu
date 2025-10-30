'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Calendar, Clock, Ship, Users, Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getReservationByNumber, cancelReservationByNumber, Reservation } from '@/lib/reservationHelpers';

export default function ReservationQueryPage() {
  const [reservationNumber, setReservationNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Rezervasyon sorgula
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setReservation(null);

    if (!reservationNumber.trim()) {
      setError('Lütfen rezervasyon numaranızı girin');
      return;
    }

    setLoading(true);

    try {
      const result = await getReservationByNumber(reservationNumber.trim());

      if (result.success && result.reservation) {
        setReservation(result.reservation);
      } else {
        setError(result.error || 'Rezervasyon bulunamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Rezervasyon iptal et
  const handleCancel = async () => {
    if (!reservation || !phone.trim()) {
      setError('Lütfen telefon numaranızı girin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await cancelReservationByNumber(reservation.reservationNumber, phone);

      if (result.success) {
        setSuccess('Rezervasyonunuz başarıyla iptal edildi');
        setReservation({ ...reservation, status: 'cancelled' });
        setShowCancelConfirm(false);
        setPhone('');
      } else {
        setError(result.error || 'İptal işlemi başarısız oldu');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Formu temizle
  const handleReset = () => {
    setReservationNumber('');
    setPhone('');
    setReservation(null);
    setError('');
    setSuccess('');
    setShowCancelConfirm(false);
  };

  // Status badge rengi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#003366] mb-4">
            Rezervasyon Sorgula
          </h1>
          <p className="text-gray-600">
            Rezervasyon numaranız ile rezervasyonunuzu sorgulayabilir ve iptal edebilirsiniz
          </p>
        </motion.div>

        {/* Search Form */}
        {!reservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rezervasyon Numarası
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reservationNumber}
                    onChange={(e) => setReservationNumber(e.target.value.toUpperCase())}
                    placeholder="BS-2024-001234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent"
                  />
                  <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rezervasyon numaranız WhatsApp mesajınızda veya e-postanızda bulunmaktadır
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00A9A5] text-white py-3 rounded-lg font-semibold hover:bg-[#008985] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sorgulanıyor...' : 'Rezervasyon Sorgula'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </motion.div>
        )}

        {/* Reservation Details */}
        {reservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            {/* Header with Status */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-[#003366] mb-2">
                  Rezervasyon Detayları
                </h2>
                <p className="text-gray-600">#{reservation.reservationNumber}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(reservation.status)}`}>
                {getStatusText(reservation.status)}
              </span>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Ship className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Tekne</p>
                  <p className="font-semibold text-gray-900">{reservation.boatName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Tarih</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(reservation.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Saat</p>
                  <p className="font-semibold text-gray-900">{reservation.timeSlotDisplay}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Kişi Sayısı</p>
                  <p className="font-semibold text-gray-900">
                    {reservation.totalPeople} kişi
                    {reservation.adultCount > 0 && ` (${reservation.adultCount} yetişkin`}
                    {reservation.childCount > 0 && `, ${reservation.childCount} çocuk`}
                    {reservation.babyCount > 0 && `, ${reservation.babyCount} bebek`}
                    {reservation.adultCount > 0 && ')'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">İsim</p>
                  <p className="font-semibold text-gray-900">{reservation.userName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#00A9A5] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <p className="font-semibold text-gray-900">{reservation.userPhone}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Toplam Tutar</span>
                  <span className="text-2xl font-bold text-[#003366]">
                    ₺{reservation.totalPrice.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t space-y-3">
              {reservation.status !== 'cancelled' && !showCancelConfirm && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  Rezervasyonu İptal Et
                </button>
              )}

              {showCancelConfirm && reservation.status !== 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                  <p className="text-red-800 font-medium">
                    Rezervasyonunuzu iptal etmek istediğinizden emin misiniz?
                  </p>
                  <p className="text-sm text-red-700">
                    İptal işlemini onaylamak için telefon numaranızı girin:
                  </p>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={loading || !phone.trim()}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'İptal Ediliyor...' : 'Onayla'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelConfirm(false);
                        setPhone('');
                        setError('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Yeni Sorgulama Yap
              </button>
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Bilgilendirme
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Rezervasyon numaranız WhatsApp mesajınızda veya e-postanızda bulunur</li>
            <li>• İptal işlemi için kayıtlı telefon numaranızı girmeniz gerekmektedir</li>
            <li>• İptal edilen rezervasyonlar geri alınamaz</li>
            <li>• Sorularınız için: 0555 123 45 67</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
