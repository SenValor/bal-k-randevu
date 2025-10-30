'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, User, Mail, Phone, Calendar, Clock, Users, Ship, Compass } from 'lucide-react';
import { addReservation, ReservationFormData } from '@/lib/reservationHelpers';
import { Boat } from '@/lib/boatHelpers';
import { Tour } from '@/lib/tourHelpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default function StepFourConfirmation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  
  // Misafir bilgileri
  const [guestName, setGuestName] = useState('');
  const [guestSurname, setGuestSurname] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [error, setError] = useState('');
  
  // Üye telefon numarası
  const [memberPhone, setMemberPhone] = useState('');

  // Rezervasyon verileri
  const [boat, setBoat] = useState<Boat | null>(null);
  const [tourType, setTourType] = useState<Tour | null>(null);
  const [reservationData, setReservationData] = useState<any>(null);

  useEffect(() => {
    // localStorage'dan tüm verileri al
    const boatData = localStorage.getItem('selectedBoat');
    const tourData = localStorage.getItem('selectedTourType');
    const resData = localStorage.getItem('reservationData');

    if (boatData) setBoat(JSON.parse(boatData));
    if (tourData) setTourType(JSON.parse(tourData));
    if (resData) {
      const data = JSON.parse(resData);
      setReservationData(data);
      console.log('📦 Rezervasyon verileri yüklendi:', data);
    }

    // Üye değilse misafir formu göster
    if (!user) {
      setShowGuestForm(true);
    } else {
      // Üye ise Firestore'dan telefon numarasını çek
      fetchUserPhone();
    }
  }, [user]);

  const fetchUserPhone = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.phone) {
          setMemberPhone(userData.phone);
          console.log('📞 Telefon numarası yüklendi:', userData.phone);
        }
      }
    } catch (error) {
      console.error('Telefon numarası alınamadı:', error);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!guestName.trim() || !guestSurname.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (!guestEmail.includes('@')) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    await createReservation();
  };

  const handleMemberConfirm = async () => {
    if (!memberPhone.trim()) {
      setError('Lütfen telefon numaranızı girin');
      return;
    }
    await createReservation();
  };

  const createReservation = async () => {
    if (!boat || !tourType || !reservationData) {
      setError('Rezervasyon bilgileri eksik');
      return;
    }

    setLoading(true);

    try {
      // Tarihi düzgün formata çevir - SADECE "YYYY-MM-DD" formatında
      let reservationDate = '';
      if (reservationData.date) {
        if (typeof reservationData.date === 'string') {
          // String ise, eğer ISO format ise sadece tarih kısmını al
          if (reservationData.date.includes('T')) {
            reservationDate = reservationData.date.split('T')[0];
          } else {
            reservationDate = reservationData.date;
          }
        } else if (reservationData.date instanceof Date) {
          // Date objesi ise, sadece tarih kısmını al
          const year = reservationData.date.getFullYear();
          const month = String(reservationData.date.getMonth() + 1).padStart(2, '0');
          const day = String(reservationData.date.getDate()).padStart(2, '0');
          reservationDate = `${year}-${month}-${day}`;
        }
      }

      // Rezervasyon numarası oluştur: RV-YYYYMMDD-XXXX
      const now = new Date();
      const dateForNumber = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999 arası
      const reservationNumber = `RV-${dateForNumber}-${randomNum}`;

      console.log('📅 Tarih dönüşümü:', {
        original: reservationData.date,
        originalType: typeof reservationData.date,
        originalISO: reservationData.date instanceof Date ? reservationData.date.toISOString() : 'N/A',
        converted: reservationDate,
        year: reservationData.date instanceof Date ? reservationData.date.getFullYear() : 'N/A',
        month: reservationData.date instanceof Date ? reservationData.date.getMonth() + 1 : 'N/A',
        day: reservationData.date instanceof Date ? reservationData.date.getDate() : 'N/A'
      });

      console.log('🔍 Rezervasyon oluşturuluyor:', {
        reservationNumber,
        boatId: boat.id,
        boatName: boat.name,
        date: reservationDate,
        timeSlotId: reservationData.tour?.id.toString(),
        timeSlotDisplay: `${reservationData.tour?.title || ''} (${reservationData.tour?.time || ''})`,
        seats: reservationData.seats,
        userId: user?.uid || 'guest',
        tourId: tourType.id,
        tourName: tourType.name,
      });

      // Ekipman seçimini al
      const equipmentData = localStorage.getItem('equipmentSelection');
      const equipmentSelection = equipmentData ? JSON.parse(equipmentData) : null;

      console.log('📦 Raw reservationData:', reservationData);
      console.log('🚢 Boat data:', boat);
      console.log('🎫 Tour type:', tourType);
      console.log('🎣 Equipment data:', equipmentSelection);

      const reservation: any = {
        reservationNumber,
        boatId: boat.id,
        boatName: boat.name,
        boatMapsLink: boat.mapsLink || '',
        userId: user?.uid || 'guest',
        userName: user ? user.displayName || user.email || 'Üye' : `${guestName} ${guestSurname}`,
        userEmail: user ? user.email || '' : guestEmail,
        userPhone: user ? memberPhone || (user as any).phoneNumber || '' : guestPhone,
        date: reservationDate,
        timeSlotId: reservationData.tour?.id.toString() || '0',
        timeSlotDisplay: `${reservationData.tour?.title || ''} (${reservationData.tour?.time || ''})`,
        tourId: tourType.id,
        tourName: tourType.name,
        selectedSeats: reservationData.seats || [],
        adultCount: reservationData.adultCount || 0,
        childCount: reservationData.childCount || 0,
        babyCount: reservationData.babyCount || 0,
        totalPeople: reservationData.totalPeople || reservationData.seats?.length || 0,
        totalPrice: equipmentSelection?.totalPrice || (tourType.price * (reservationData.seats?.length || 0)),
        equipmentSelection: equipmentSelection || null,
        status: 'pending',
      };

      console.log('Firestore\'a kaydedilecek rezervasyon:', reservation);

      const result = await addReservation(reservation);
      
      console.log('Rezervasyon sonucu:', result);

      if (result.success) {
        setReservationComplete(true);
        // localStorage'ı temizle
        localStorage.removeItem('selectedBoat');
        localStorage.removeItem('selectedTourType');
        localStorage.removeItem('reservationData');
        localStorage.removeItem('equipmentSelection');
      } else {
        setError(result.error || 'Rezervasyon oluşturulamadı');
      }
    } catch (err) {
      console.error('Rezervasyon hatası:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Başarılı rezervasyon sayfası
  if (reservationComplete) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-8 md:p-12 text-center shadow-xl"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <CheckCircle className="w-24 h-24 text-[#6B9BC3] mx-auto" />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-4">
              Rezervasyonunuz Başarıyla Oluşturuldu! 🎉
            </h1>
            <p className="text-[#1B3A5C]/70 text-lg mb-8">
              Rezervasyon detaylarınız e-posta adresinize gönderildi.
            </p>

            {/* Reservation Details */}
            <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-6 mb-8 text-left">
              <h2 className="text-xl font-bold text-[#0D2847] mb-4">Rezervasyon Detayları</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#1B3A5C]/80">
                  <Ship className="w-5 h-5 text-[#6B9BC3]" />
                  <span>{boat?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80">
                  <Compass className="w-5 h-5 text-[#6B9BC3]" />
                  <span>{tourType?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80">
                  <Calendar className="w-5 h-5 text-[#6B9BC3]" />
                  <span>{reservationData?.date ? new Date(reservationData.date).toLocaleDateString('tr-TR') : ''}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80">
                  <Clock className="w-5 h-5 text-[#6B9BC3]" />
                  <span>{reservationData?.tour?.time}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80">
                  <Users className="w-5 h-5 text-[#6B9BC3]" />
                  <span>{reservationData?.seats?.length} Kişi</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/profile'}
                className="px-8 py-3 bg-[#8B3A3A] hover:bg-[#A04848] text-white font-semibold rounded-xl transition-colors"
              >
                Rezervasyonlarım
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-[#6B9BC3]/10 hover:bg-[#6B9BC3]/20 text-[#1B3A5C] border-2 border-[#6B9BC3]/30 font-semibold rounded-xl transition-colors"
              >
                Ana Sayfa
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Misafir formu
  if (showGuestForm && !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-8 md:p-12 shadow-xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-3">
                İletişim Bilgileriniz
              </h1>
              <p className="text-[#1B3A5C]/70 text-lg">
                Rezervasyonunuzu tamamlamak için bilgilerinizi girin
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleGuestSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  Ad *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Adınız"
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Surname */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  Soyad *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="text"
                    value={guestSurname}
                    onChange={(e) => setGuestSurname(e.target.value)}
                    placeholder="Soyadınız"
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  Telefon *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="0555 555 55 55"
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  E-posta *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#00A9A5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Rezervasyon Oluşturuluyor...
                  </>
                ) : (
                  'Rezervasyonu Tamamla'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    );
  }

  // Üye onay sayfası
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-8 md:p-12 shadow-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-3">
              Rezervasyon Özeti
            </h1>
            <p className="text-[#1B3A5C]/70 text-lg">
              Bilgilerinizi kontrol edin ve onaylayın
            </p>
          </div>

          {/* Reservation Summary */}
          <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">Tekne:</span>
                <span className="text-[#0D2847] font-semibold">{boat?.name}</span>
              </div>
              {boat?.mapsLink && (
                <div className="flex items-center justify-between bg-[#6B9BC3]/10 rounded-lg p-3 -mx-2">
                  <span className="text-[#1B3A5C]/70 flex items-center gap-2">
                    📍 Kalkış Noktası:
                  </span>
                  <a
                    href={boat.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B9BC3] hover:text-[#5B8DB8] font-semibold underline flex items-center gap-1 transition-colors"
                  >
                    Haritada Gör
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">Tur Tipi:</span>
                <span className="text-[#0D2847] font-semibold">{tourType?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">Tarih:</span>
                <span className="text-[#0D2847] font-semibold">
                  {reservationData?.date ? new Date(reservationData.date).toLocaleDateString('tr-TR') : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">Saat:</span>
                <span className="text-[#0D2847] font-semibold">{reservationData?.tour?.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">Kişi Sayısı:</span>
                <span className="text-[#0D2847] font-semibold">{reservationData?.seats?.length}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#6B9BC3]/20">
                <span className="text-[#1B3A5C]/70 text-lg">Toplam Tutar:</span>
                <span className="text-[#8B3A3A] font-bold text-2xl">
                  ₺{tourType && reservationData ? tourType.price * reservationData.seats.length : 0}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-6 mb-8">
            <h3 className="text-[#0D2847] font-semibold mb-4">İletişim Bilgileri</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[#1B3A5C]/70 text-sm mb-1">Ad Soyad</p>
                <p className="text-[#0D2847]">{user?.displayName || user?.email}</p>
              </div>
              <div>
                <p className="text-[#1B3A5C]/70 text-sm mb-1">Email</p>
                <p className="text-[#1B3A5C]/80 text-sm">{user?.email}</p>
              </div>
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  Telefon Numarası *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder="0555 555 55 55"
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleMemberConfirm}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#8B3A3A]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rezervasyon Oluşturuluyor...
              </>
            ) : (
              'Rezervasyonu Onayla'
            )}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
