'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, User, Mail, Phone, Calendar, Clock, Users, Ship, Compass, Copy, MessageCircle } from 'lucide-react';
import { addReservation, checkSeatsAvailable, ReservationFormData } from '@/lib/reservationHelpers';
import { Boat, getTimeSlotsForDate } from '@/lib/boatHelpers';
import { Tour } from '@/lib/tourHelpers';
import { isPhoneBlacklisted, getBlacklistInfo } from '@/lib/blacklistHelpers';
import { validatePromoCode, incrementPromoCodeUsage, PromoCode } from '@/lib/promoCodeHelpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import ReservationNewYearDecor from '@/components/seasonal/ReservationNewYearDecor';
import { useLanguage } from '@/context/LanguageContext';

export default function StepFourConfirmation() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [reservationNumber, setReservationNumber] = useState('');
  
  // Misafir bilgileri
  const [guestName, setGuestName] = useState('');
  const [guestSurname, setGuestSurname] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [error, setError] = useState('');
  
  // Üye telefon numarası
  const [memberPhone, setMemberPhone] = useState('');
  
  // WhatsApp Onayı
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  // Kampanya kodu
  const [promoInput, setPromoInput] = useState('');
  const [promoData, setPromoData] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);


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
        }
      }
    } catch (error) {
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoData(null);
    const result = await validatePromoCode(promoInput.trim());
    if (result.valid && result.promoCode) {
      setPromoData(result.promoCode);
    } else {
      setPromoError(result.error || 'Geçersiz kod');
    }
    setPromoLoading(false);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation - E-posta opsiyonel
    if (!guestName.trim() || !guestSurname.trim() || !guestPhone.trim()) {
      setError(t('confirm.requiredFields'));
      return;
    }

    await createReservation();
  };

  const handleMemberConfirm = async () => {
    if (!memberPhone.trim()) {
      setError(t('confirm.enterPhone'));
      return;
    }
    await createReservation();
  };

  const createReservation = async () => {
    if (!boat || !tourType || !reservationData) {
      setError(t('confirm.missingData'));
      return;
    }

    setLoading(true);

    try {
      // ⚠️ KARA LİSTE KONTROLÜ
      const phoneToCheck = user ? memberPhone : guestPhone;
      
      
      const isBlacklisted = await isPhoneBlacklisted(phoneToCheck);
      
      if (isBlacklisted) {
        const blacklistInfo = await getBlacklistInfo(phoneToCheck);
        
        setError(
          t('confirm.blacklisted') +
          (blacklistInfo?.reason || (language === 'en' ? 'Not specified' : 'Belirtilmemiş')) +
          t('confirm.blacklistedContact')
        );
        setLoading(false);
        return;
      }
      

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



      // Ekipman seçimini al
      const equipmentData = localStorage.getItem('equipmentSelection');
      const equipmentSelection = equipmentData ? JSON.parse(equipmentData) : null;

      // Seçili turun baitWarning ve mapsLink bilgisini al
      // Rezervasyon tarihine göre doğru saat dilimlerini al (scheduledTimeSlots varsa onları kullan)
      const activeTimeSlots = getTimeSlotsForDate(
        boat.scheduledTimeSlots,
        boat.timeSlots || [],
        reservationDate
      );
      
      const selectedTourId = reservationData.tour?.id.toString() || '0';
      const tourTitle = reservationData.tour?.title || '';
      
      // Saat dilimini bul - önce index bazlı dene (en güvenilir)
      let selectedTimeSlot: any = null;
      const slotIndex = parseInt(selectedTourId);
      
      if (activeTimeSlots && activeTimeSlots.length > 0) {
        // Yöntem 1: Index bazlı eşleştirme (tour.id = 0, 1, 2, 3 gibi index)
        if (!isNaN(slotIndex) && slotIndex < activeTimeSlots.length) {
          selectedTimeSlot = activeTimeSlots[slotIndex];
        }
        
        // Yöntem 2: Eğer index ile bulunamadıysa, displayName ile dene
        if (!selectedTimeSlot && tourTitle) {
          selectedTimeSlot = activeTimeSlots.find((ts: any) => 
            ts.displayName === tourTitle
          );
        }
      }
      
      const hasBaitWarning = selectedTimeSlot?.baitWarning === true;
      // Saat dilimine özel konum varsa onu kullan, yoksa tekne konumunu kullan
      const timeSlotMapsLink = selectedTimeSlot?.mapsLink || boat.mapsLink || '';
      


      // Kapalı tur kontrolü
      const isPrivateTour = tourType.category === 'private';
      
      // Fiyat hesaplama: Ekipman seçimi varsa onu kullan, yoksa tur fiyatı
      let calculatedPrice;
      if (equipmentSelection?.totalPrice) {
        calculatedPrice = equipmentSelection.totalPrice;
      } else if (isPrivateTour) {
        // Kapalı turda fiyat sabit (kişi sayısıyla çarpılmaz)
        calculatedPrice = tourType.price;
      } else {
        // Normal turda kişi başı fiyat
        calculatedPrice = tourType.price * (reservationData.seats?.length || 0);
      }

      const reservation: any = {
        reservationNumber,
        boatId: boat.id,
        boatName: boat.name,
        boatMapsLink: boat.mapsLink || '',
        timeSlotMapsLink: timeSlotMapsLink, // Saat dilimine özel konum (varsa)
        boatResponsibleName: boat.responsibleName || '',
        boatResponsiblePhone: boat.responsiblePhone || '',
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
        totalPrice: calculatedPrice,
        equipmentSelection: equipmentSelection || null,
        baitWarning: hasBaitWarning,
        status: 'pending',
        whatsappConsent: whatsappConsent,
        whatsappConsentDate: whatsappConsent ? new Date().toISOString() : null,
        promoCode: promoData ? {
          id: promoData.id,
          code: promoData.code,
          discountType: promoData.discountType,
          discountValue: promoData.discountValue,
          description: promoData.description,
        } : null,
      };


      // ⚠️ SERVER-SIDE KOLTUK KONTROLÜ — yazma öncesi son doğrulama
      const timeSlotStart  = selectedTimeSlot?.start  || '';
      const timeSlotEnd    = selectedTimeSlot?.end    || '';
      const timeSlotDisplay = reservation.timeSlotDisplay || '';
      const seatCheck = await checkSeatsAvailable(
        boat.id,
        reservationDate,
        reservation.timeSlotId,
        timeSlotStart,
        timeSlotEnd,
        timeSlotDisplay,
        reservationData.seats || []
      );

      if (!seatCheck.available) {
        setError(
          `${seatCheck.conflictingSeats.join(', ')} ${t('confirm.seatsTaken')}`
        );
        setLoading(false);
        return;
      }

      const result = await addReservation(reservation);
      

      if (result.success) {
        // Kampanya kodu kullanımını artır
        if (promoData?.id) {
          await incrementPromoCodeUsage(promoData.id);
        }
        setReservationComplete(true);
        setReservationNumber(result.reservationNumber || '');
        localStorage.removeItem('selectedBoat');
        localStorage.removeItem('selectedTourType');
        localStorage.removeItem('reservationData');
        localStorage.removeItem('equipmentSelection');
      } else {
        setError(result.error || t('confirm.generalError'));
      }
    } catch (err) {
      setError(t('confirm.generalError'));
    } finally {
      setLoading(false);
    }
  };

  // Başarılı rezervasyon sayfası
  if (reservationComplete) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
        <ReservationNewYearDecor />
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-8">
              {t('confirm.successTitle')}
            </h1>

            {/* Rezervasyon Numarası */}
            {reservationNumber && (
              <>
                <div className="bg-gradient-to-r from-[#00A9A5]/10 to-[#6B9BC3]/10 rounded-2xl border-2 border-[#00A9A5]/30 p-6 mb-6">
                  <p className="text-sm text-[#1B3A5C]/70 mb-2">{t('confirm.resNumber')}</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#00A9A5] tracking-wider">
                      {reservationNumber}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(reservationNumber);
                        alert(t('confirm.copied'));
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00A9A5] text-white rounded-lg hover:bg-[#008985] transition-colors text-sm font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      {t('confirm.copy')}
                    </button>
                  </div>
                  <p className="text-xs text-[#1B3A5C]/60 mt-3">
                    {t('confirm.resNumberInfo')}
                  </p>
                </div>
              </>
            )}

            {/* Reservation Details */}
            <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-5 mb-6 text-left">
              <h2 className="text-lg font-bold text-[#0D2847] mb-3">{t('confirm.resDetails')}</h2>
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-[#1B3A5C]/80 text-sm">
                  <Ship className="w-4 h-4 text-[#6B9BC3]" />
                  <span>{boat?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80 text-sm">
                  <Compass className="w-4 h-4 text-[#6B9BC3]" />
                  <span>{tourType?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80 text-sm">
                  <Calendar className="w-4 h-4 text-[#6B9BC3]" />
                  <span>{reservationData?.date ? new Date(reservationData.date).toLocaleDateString(language === 'en' ? 'en-GB' : 'tr-TR') : ''}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80 text-sm">
                  <Clock className="w-4 h-4 text-[#6B9BC3]" />
                  <span>{reservationData?.tour?.time}</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B3A5C]/80 text-sm">
                  <Users className="w-4 h-4 text-[#6B9BC3]" />
                  <span>{reservationData?.seats?.length} {t('confirm.persons')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl shadow-lg shadow-[#8B3A3A]/30 transition-all"
              >
                {t('confirm.homePage')}
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
        <ReservationNewYearDecor />
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-8 md:p-12 shadow-xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-3">
                {t('confirm.contactTitle')}
              </h1>
              <p className="text-[#1B3A5C]/70 text-lg">
                {t('confirm.contactDesc')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleGuestSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  {t('confirm.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={t('confirm.firstNamePlaceholder')}
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Surname */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  {t('confirm.lastName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="text"
                    value={guestSurname}
                    onChange={(e) => setGuestSurname(e.target.value)}
                    placeholder={t('confirm.lastNamePlaceholder')}
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  {t('confirm.phone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleaned = value.replace(/\D/g, '');
                      const formatted = cleaned && !cleaned.startsWith('0') ? '0' + cleaned : cleaned;
                      setGuestPhone(formatted.slice(0, 11));
                    }}
                    placeholder="05331234567"
                    maxLength={11}
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  {t('confirm.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="text"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder={t('confirm.emailPlaceholder')}
                    className="w-full bg-white border-2 border-[#6B9BC3]/30 rounded-xl pl-12 pr-4 py-3 text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Kampanya Kodu */}
              <PromoCodeSection
                promoInput={promoInput}
                setPromoInput={setPromoInput}
                promoData={promoData}
                setPromoData={setPromoData}
                promoError={promoError}
                setPromoError={setPromoError}
                promoLoading={promoLoading}
                onApply={handleApplyPromoCode}
                language={language}
              />

              {/* WhatsApp Onay Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl cursor-pointer hover:bg-green-500/20 transition-colors">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-[#003366]">
                      {t('confirm.whatsapp')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t('confirm.whatsappDesc')}
                    <span className="text-green-600 font-medium">{t('confirm.whatsappRecommended')}</span>
                  </p>
                </div>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#00A9A5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('confirm.creating')}
                  </>
                ) : (
                  t('confirm.completeReservation')
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
      <ReservationNewYearDecor />
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-[#6B9BC3]/30 p-8 md:p-12 shadow-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-3">
              {t('confirm.summaryTitle')}
            </h1>
            <p className="text-[#1B3A5C]/70 text-lg">
              {t('confirm.summaryDesc')}
            </p>
          </div>

          {/* Reservation Summary */}
          <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">{t('confirm.boat')}</span>
                <span className="text-[#0D2847] font-semibold">{boat?.name}</span>
              </div>
              {boat?.mapsLink && (
                <div className="flex items-center justify-between bg-[#6B9BC3]/10 rounded-lg p-3 -mx-2">
                  <span className="text-[#1B3A5C]/70 flex items-center gap-2">
                    {t('confirm.departure')}
                  </span>
                  <a
                    href={boat.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B9BC3] hover:text-[#5B8DB8] font-semibold underline flex items-center gap-1 transition-colors"
                  >
                    {t('confirm.viewMap')}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">{t('confirm.tourType')}</span>
                <span className="text-[#0D2847] font-semibold">{tourType?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">{t('confirm.date')}</span>
                <span className="text-[#0D2847] font-semibold">
                  {reservationData?.date ? new Date(reservationData.date).toLocaleDateString(language === 'en' ? 'en-GB' : 'tr-TR') : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">{t('confirm.time')}</span>
                <span className="text-[#0D2847] font-semibold">{reservationData?.tour?.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1B3A5C]/70">{t('confirm.guestCount')}</span>
                <span className="text-[#0D2847] font-semibold">{reservationData?.seats?.length}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#6B9BC3]/20">
                <span className="text-[#1B3A5C]/70 text-lg">{t('confirm.totalAmount')}</span>
                <span className="text-[#8B3A3A] font-bold text-2xl">
                  ₺{tourType && reservationData ? tourType.price * reservationData.seats.length : 0}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/80 rounded-2xl border-2 border-[#6B9BC3]/30 p-6 mb-8">
            <h3 className="text-[#0D2847] font-semibold mb-4">{t('confirm.contactInfo')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[#1B3A5C]/70 text-sm mb-1">{t('confirm.fullName')}</p>
                <p className="text-[#0D2847]">{user?.displayName || user?.email}</p>
              </div>
              <div>
                <p className="text-[#1B3A5C]/70 text-sm mb-1">{t('confirm.email')}</p>
                <p className="text-[#1B3A5C]/80 text-sm">{user?.email}</p>
              </div>
              <div>
                <label className="block text-[#1B3A5C]/80 text-sm font-medium mb-2">
                  {t('confirm.phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A5C]/40" />
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder={t('confirm.phonePlaceholder')}
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

          {/* Kampanya Kodu */}
          <PromoCodeSection
            promoInput={promoInput}
            setPromoInput={setPromoInput}
            promoData={promoData}
            setPromoData={setPromoData}
            promoError={promoError}
            setPromoError={setPromoError}
            promoLoading={promoLoading}
            onApply={handleApplyPromoCode}
            language={language}
          />

          {/* WhatsApp Onay Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl cursor-pointer hover:bg-green-500/20 transition-colors mb-6">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-[#003366]">
                  {t('confirm.whatsapp')}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('confirm.whatsappDesc')}
                <span className="text-green-600 font-medium">{t('confirm.whatsappRecommended')}</span>
              </p>
            </div>
          </label>

          {/* Confirm Button */}
          <button
            onClick={handleMemberConfirm}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#8B3A3A]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('confirm.creating')}
              </>
            ) : (
              t('confirm.confirmReservation')
            )}
          </button>
        </motion.div>
      </div>

    </main>
  );
}

function PromoCodeSection({
  promoInput, setPromoInput, promoData, setPromoData,
  promoError, setPromoError, promoLoading, onApply, language,
}: {
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoData: PromoCode | null;
  setPromoData: (v: PromoCode | null) => void;
  promoError: string;
  setPromoError: (v: string) => void;
  promoLoading: boolean;
  onApply: () => void;
  language: string;
}) {
  const isEn = language === 'en';

  return (
    <div className="border border-[#6B9BC3]/30 rounded-xl p-4 bg-[#6B9BC3]/5">
      <p className="text-sm font-medium text-[#0D2847] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#6B9BC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        {isEn ? 'Do you have a promo code?' : 'Kampanya kodunuz var mı?'}
      </p>

      {promoData ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-green-700 font-semibold text-sm">{promoData.code} — Kod Geçerli!</p>
            <p className="text-green-600 text-xs mt-0.5">
              {isEn ? 'Show this code on the boat: ' : 'Teknede bu kodu ibraz edin: '}
              <strong>
                {promoData.discountType === 'percent'
                  ? `%${promoData.discountValue} indirim`
                  : `₺${promoData.discountValue} indirim`}
              </strong>
            </p>
          </div>
          <button
            onClick={() => { setPromoData(null); setPromoInput(''); }}
            className="text-green-500 hover:text-green-700 text-xs underline"
          >
            {isEn ? 'Remove' : 'Kaldır'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
            placeholder={isEn ? 'PROMO CODE' : 'KAMPANYA KODU'}
            className="flex-1 bg-white border-2 border-[#6B9BC3]/30 rounded-xl px-4 py-2.5 text-[#0D2847] placeholder-[#1B3A5C]/30 focus:border-[#6B9BC3] focus:bg-white outline-none text-sm font-mono tracking-wider uppercase"
          />
          <button
            onClick={onApply}
            disabled={promoLoading || !promoInput.trim()}
            className="px-4 py-2.5 bg-[#6B9BC3] hover:bg-[#5B8DB8] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
          >
            {promoLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (isEn ? 'Apply' : 'Uygula')}
          </button>
        </div>
      )}

      {promoError && !promoData && (
        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {promoError}
        </p>
      )}
    </div>
  );
}
