import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface Reservation {
  id: string;
  reservationNumber: string; // Misafir için benzersiz rezervasyon numarası (örn: BS-2024-001234)
  boatId: string;
  boatName: string;
  boatMapsLink?: string; // Teknenin Google Maps konumu
  timeSlotMapsLink?: string; // Saat dilimine özel Google Maps konumu
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string; // Telefon numarası (WhatsApp için)
  date: string; // YYYY-MM-DD formatında
  timeSlotId: string;
  timeSlotDisplay: string; // "09:00 - 12:00"
  tourId: string;
  tourName: string;
  selectedSeats: number[]; // Seçilen koltuk numaraları [1, 2, 5]
  adultCount: number;
  childCount: number;
  babyCount: number;
  totalPeople: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export type ReservationFormData = Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'reservationNumber'>;

/**
 * Benzersiz rezervasyon numarası oluşturur
 * Format: BS-YYYY-XXXXXX (örn: BS-2024-001234)
 */
export function generateReservationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000; // 6 haneli rastgele sayı
  return `BS-${year}-${random}`;
}

/**
 * Yeni rezervasyon ekler (rezervasyon numarası otomatik oluşturulur)
 */
export async function addReservation(
  reservationData: ReservationFormData
): Promise<{ success: boolean; id?: string; reservationNumber?: string; error?: string }> {
  try {
    const reservationNumber = generateReservationNumber();
    
    const docRef = await addDoc(collection(db, 'reservations'), {
      ...reservationData,
      reservationNumber,
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: docRef.id, reservationNumber };
  } catch (error: any) {
    console.error('Rezervasyon ekleme hatası:', error);
    return { success: false, error: 'Rezervasyon eklenirken bir hata oluştu' };
  }
}

/**
 * Belirli bir tekne, tarih ve saat için rezervasyonları getirir
 * timeSlotId: index numarası (geriye uyumluluk için)
 * timeSlotStart ve timeSlotEnd: saat aralığı
 * timeSlotDisplayName: tur adı (Sabah Turu, Öğle Turu vb.) - saat değişse bile eşleştirme için
 */
export async function getReservationsByBoatDateSlot(
  boatId: string,
  date: string,
  timeSlotId: string,
  timeSlotStart?: string,
  timeSlotEnd?: string,
  timeSlotDisplayName?: string
): Promise<Reservation[]> {
  try {
    console.log('🔍 Rezervasyonlar çekiliyor:', { 
      boatId, 
      date, 
      timeSlotId,
      timeSlotStart,
      timeSlotEnd,
      timeSlotIdType: typeof timeSlotId
    });

    // Yeni format için query - sadece boatId'ye göre çek, filtrelemeyi sonra yap
    // Çünkü timeSlotId değişebilir, ama timeSlotDisplay içindeki saat aralığı sabit kalır
    const q = query(
      collection(db, 'reservations'),
      where('boatId', '==', boatId),
      where('status', 'in', ['pending', 'confirmed'])
    );

    // Eski format için query (selectedBoat, selectedDate)
    const qOld = query(
      collection(db, 'reservations'),
      where('selectedBoat', '==', boatId),
      where('selectedDate', '==', date),
      where('status', 'in', ['pending', 'confirmed', 'waiting'])
    );

    const [snapshot, snapshotOld] = await Promise.all([
      getDocs(q),
      getDocs(qOld)
    ]);

    const reservations: Reservation[] = [];

    console.log(`✅ Yeni format rezervasyon: ${snapshot.size}`);
    console.log(`✅ Eski format rezervasyon: ${snapshotOld.size}`);

    // Saat aralığı eşleştirme için yardımcı fonksiyon
    const extractTimeRange = (timeSlotDisplay: string): string | null => {
      if (!timeSlotDisplay) return null;
      // "Sabah Turu (07:00 - 13:00)" -> "07:00-13:00"
      const match = timeSlotDisplay.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (match) {
        return `${match[1]}-${match[2]}`;
      }
      return null;
    };

    // Tur adı çıkarma fonksiyonu
    const extractTourName = (timeSlotDisplay: string): string | null => {
      if (!timeSlotDisplay) return null;
      // "Sabah Turu (07:00 - 13:00)" -> "Sabah Turu"
      const match = timeSlotDisplay.match(/^([^(]+)/);
      if (match) {
        return match[1].trim().toLowerCase();
      }
      return timeSlotDisplay.toLowerCase().trim();
    };

    // Aranan saat aralığı ve tur adı
    const targetTimeRange = timeSlotStart && timeSlotEnd 
      ? `${timeSlotStart}-${timeSlotEnd}` 
      : null;
    const targetTourName = timeSlotDisplayName 
      ? timeSlotDisplayName.toLowerCase().trim()
      : null;

    // Yeni format rezervasyonlar - tarih ve saat filtresi uygula
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Tarih kontrolü - hem "2025-10-09" hem "2025-10-09T21:00:00.000Z" formatını destekle
      let reservationDate = data.date;
      if (reservationDate) {
        // ISO timestamp ise sadece tarih kısmını al
        if (typeof reservationDate === 'string' && reservationDate.includes('T')) {
          reservationDate = reservationDate.split('T')[0];
        }
        
        // Tarih eşleşiyor mu kontrol et
        if (reservationDate === date) {
          // Saat/tur eşleştirme kontrolü - birden fazla yöntem dene
          let timeMatches = false;
          
          const reservationTimeRange = extractTimeRange(data.timeSlotDisplay);
          const reservationTourName = extractTourName(data.timeSlotDisplay);
          
          // Yöntem 1: Tur adı bazlı eşleştirme (saat değişse bile çalışır)
          if (targetTourName && reservationTourName) {
            timeMatches = reservationTourName === targetTourName;
            console.log('🏷️ Tur adı eşleştirme:', {
              targetTourName,
              reservationTourName,
              matches: timeMatches
            });
          }
          
          // Yöntem 2: Saat aralığı bazlı eşleştirme (tur adı eşleşmezse)
          if (!timeMatches && targetTimeRange && reservationTimeRange) {
            timeMatches = reservationTimeRange === targetTimeRange;
            console.log('🕐 Saat eşleştirme:', {
              target: targetTimeRange,
              reservation: reservationTimeRange,
              matches: timeMatches
            });
          }
          
          // Yöntem 3: timeSlotId bazlı eşleştirme (diğerleri eşleşmezse)
          if (!timeMatches) {
            timeMatches = data.timeSlotId === timeSlotId;
            console.log('🔢 TimeSlotId eşleştirme:', {
              target: timeSlotId,
              reservation: data.timeSlotId,
              matches: timeMatches
            });
          }
          
          if (timeMatches) {
            console.log('📋 Yeni rezervasyon bulundu:', {
              id: doc.id,
              boatId: data.boatId,
              date: data.date,
              normalizedDate: reservationDate,
              timeSlotId: data.timeSlotId,
              timeSlotDisplay: data.timeSlotDisplay,
              tourName: reservationTourName,
              seats: data.selectedSeats,
              status: data.status
            });
            
            reservations.push({
              id: doc.id,
              ...data,
            } as Reservation);
          }
        }
      }
    });

    // Eski format rezervasyonlar - koltuk numaralarını çıkar
    snapshotOld.forEach((doc) => {
      const data = doc.data();
      
      // Koltuk kodlarından numaraları çıkar (T1_IS4 -> 4)
      let seatNumbers: number[] = [];
      if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
        seatNumbers = data.selectedSeats.map((seat: string) => {
          if (typeof seat === 'string') {
            // T1_IS4 -> 4, T1_SA2 -> 8 (SA için 6 ekle)
            const parts = seat.split('_');
            if (parts.length === 2) {
              const side = parts[1].substring(0, 2); // IS veya SA
              const num = parseInt(parts[1].substring(2)); // 4
              return side === 'SA' ? num + 6 : num;
            }
          }
          return typeof seat === 'number' ? seat : 0;
        }).filter(n => n > 0);
      }

      console.log('📋 Eski rezervasyon:', {
        id: doc.id,
        selectedBoat: data.selectedBoat,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        selectedSeats: data.selectedSeats,
        convertedSeats: seatNumbers,
        status: data.status
      });

      // Eski formatı yeni formata dönüştür
      reservations.push({
        id: doc.id,
        boatId: data.selectedBoat || data.boatId,
        boatName: data.boatName,
        userId: data.userId || 'guest',
        userName: data.guestInfos?.[0]?.name || 'Misafir',
        userEmail: data.guestInfos?.[0]?.email || '',
        date: data.selectedDate || data.date,
        timeSlotId: timeSlotId, // Eski sistemde yok, parametreyi kullan
        timeSlotDisplay: data.selectedTime || '',
        tourId: data.tourType || '',
        tourName: data.priceDetails || '',
        selectedSeats: seatNumbers,
        adultCount: data.ageGroups?.adults || 0,
        childCount: data.ageGroups?.children || 0,
        babyCount: data.ageGroups?.babies || 0,
        totalPeople: data.guestCount || seatNumbers.length,
        totalPrice: data.totalAmount || 0,
        status: data.status === 'waiting' ? 'pending' : data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Reservation);
    });

    if (reservations.length === 0) {
      console.warn('⚠️ Hiç rezervasyon bulunamadı! Query parametreleri:', {
        boatId,
        date,
        timeSlotId
      });
    } else {
      console.log(`✅ Toplam ${reservations.length} rezervasyon bulundu`);
    }

    return reservations;
  } catch (error) {
    console.error('❌ Rezervasyonlar getirilirken hata:', error);
    return [];
  }
}

/**
 * Belirli bir tekne ve tarih için tüm rezervasyonları getirir
 */
export async function getReservationsByBoatDate(
  boatId: string,
  date: string
): Promise<Reservation[]> {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('boatId', '==', boatId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const snapshot = await getDocs(q);
    const reservations: Reservation[] = [];

    snapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
      } as Reservation);
    });

    return reservations;
  } catch (error) {
    console.error('Rezervasyonlar getirilirken hata:', error);
    return [];
  }
}

/**
 * Belirli bir tekne için tarih aralığındaki rezervasyonları getirir
 */
export async function getReservationsByBoatDateRange(
  boatId: string,
  startDate: string,
  endDate: string
): Promise<Reservation[]> {
  try {
    const today = new Date();
  console.log('📅 Tarih aralığında rezervasyon çekiliyor:', { 
    boatId, 
    startDate, 
    endDate,
    bugün: today.toISOString().split('T')[0],
    localDate: today.toLocaleDateString('tr-TR')
  });

    // Yeni format için query
    const q = query(
      collection(db, 'reservations'),
      where('boatId', '==', boatId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('status', 'in', ['pending', 'confirmed'])
    );

    // Eski format için query - sadece boatId'ye göre çek, tarih filtresini sonra yap
    const qOld = query(
      collection(db, 'reservations'),
      where('selectedBoat', '==', boatId),
      where('status', 'in', ['pending', 'confirmed', 'waiting'])
    );

    const [snapshot, snapshotOld] = await Promise.all([
      getDocs(q),
      getDocs(qOld)
    ]);

    const reservations: Reservation[] = [];

    console.log(`✅ Yeni format (range): ${snapshot.size}`);
    console.log(`✅ Eski format (all): ${snapshotOld.size}`);

    // Yeni format rezervasyonlar
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📋 Rezervasyon (range):', {
        id: doc.id,
        date: data.date,
        dateType: typeof data.date,
        timeSlotId: data.timeSlotId,
        selectedSeats: data.selectedSeats
      });
      reservations.push({
        id: doc.id,
        ...data,
      } as Reservation);
    });

    // Eski format rezervasyonlar - tarih filtresi uygula
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    snapshotOld.forEach((doc) => {
      const data = doc.data();
      
      // selectedDate'i kontrol et
      let reservationDate: Date | null = null;
      if (data.selectedDate) {
        if (typeof data.selectedDate === 'string') {
          reservationDate = new Date(data.selectedDate);
        } else if (data.selectedDate.toDate) {
          // Firestore Timestamp
          reservationDate = data.selectedDate.toDate();
        }
      }

      // Tarih aralığında mı kontrol et
      if (reservationDate && reservationDate >= startDateObj && reservationDate <= endDateObj) {
        // Koltuk kodlarından numaraları çıkar
        let seatNumbers: number[] = [];
        if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
          seatNumbers = data.selectedSeats.map((seat: string) => {
            if (typeof seat === 'string') {
              const parts = seat.split('_');
              if (parts.length === 2) {
                const side = parts[1].substring(0, 2);
                const num = parseInt(parts[1].substring(2));
                return side === 'SA' ? num + 6 : num;
              }
            }
            return typeof seat === 'number' ? seat : 0;
          }).filter(n => n > 0);
        }

        const dateStr = reservationDate.toISOString().split('T')[0];

        console.log('📋 Eski rezervasyon (range):', {
          id: doc.id,
          selectedDate: data.selectedDate,
          convertedDate: dateStr,
          seats: seatNumbers
        });

        reservations.push({
          id: doc.id,
          boatId: data.selectedBoat || data.boatId,
          boatName: data.boatName,
          userId: data.userId || 'guest',
          userName: data.guestInfos?.[0]?.name || 'Misafir',
          userEmail: data.guestInfos?.[0]?.email || '',
          date: dateStr,
          timeSlotId: '0', // Eski sistemde yok
          timeSlotDisplay: data.selectedTime || '',
          tourId: data.tourType || '',
          tourName: data.priceDetails || '',
          selectedSeats: seatNumbers,
          adultCount: data.ageGroups?.adults || 0,
          childCount: data.ageGroups?.children || 0,
          babyCount: data.ageGroups?.babies || 0,
          totalPeople: data.guestCount || seatNumbers.length,
          totalPrice: data.totalAmount || 0,
          status: data.status === 'waiting' ? 'pending' : data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Reservation);
      }
    });

    console.log(`✅ Toplam ${reservations.length} rezervasyon bulundu (range)`);

    return reservations;
  } catch (error) {
    console.error('❌ Rezervasyonlar getirilirken hata:', error);
    return [];
  }
}

/**
 * Dolu koltukları hesaplar
 */
export function getOccupiedSeats(reservations: Reservation[]): number[] {
  const occupiedSeats: number[] = [];
  
  reservations.forEach((reservation) => {
    if (reservation.selectedSeats && Array.isArray(reservation.selectedSeats)) {
      occupiedSeats.push(...reservation.selectedSeats);
    }
  });

  return [...new Set(occupiedSeats)]; // Tekrarları kaldır
}

/**
 * Doluluk oranını hesaplar (0-1 arası)
 */
export function calculateFullness(
  reservations: Reservation[],
  boatCapacity: number
): number {
  const occupiedSeats = getOccupiedSeats(reservations);
  return occupiedSeats.length / boatCapacity;
}

/**
 * Belirli bir saat dilimi için doluluk hesaplar
 * timeSlotDisplayName ile tur adı bazlı eşleştirme yapılır (saat değişse bile çalışır)
 */
export async function getTimeSlotFullness(
  boatId: string,
  date: string,
  timeSlotId: string,
  boatCapacity: number,
  timeSlotStart?: string,
  timeSlotEnd?: string,
  timeSlotDisplayName?: string
): Promise<number> {
  const reservations = await getReservationsByBoatDateSlot(
    boatId, 
    date, 
    timeSlotId, 
    timeSlotStart, 
    timeSlotEnd,
    timeSlotDisplayName
  );
  const fullness = calculateFullness(reservations, boatCapacity);
  
  console.log(`Saat doluluk - ${date} ${timeSlotDisplayName || timeSlotStart || timeSlotId}:`, {
    rezervasyonSayisi: reservations.length,
    doluKoltuklar: getOccupiedSeats(reservations),
    kapasite: boatCapacity,
    doluluk: fullness
  });
  
  return fullness;
}

/**
 * Bir tarih için tüm saat dilimlerinin doluluk oranlarını hesaplar
 * TimeSlot objesi ile tur adı bazlı eşleştirme yapılır (saat değişse bile çalışır)
 */
export async function getAllTimeSlotsFullness(
  boatId: string,
  date: string,
  timeSlots: { id: string; start?: string; end?: string; displayName?: string }[],
  boatCapacity: number
): Promise<Map<string, number>> {
  const fullnessMap = new Map<string, number>();

  for (const slot of timeSlots) {
    const fullness = await getTimeSlotFullness(
      boatId, 
      date, 
      slot.id, 
      boatCapacity,
      slot.start,
      slot.end,
      slot.displayName
    );
    fullnessMap.set(slot.id, fullness);
  }

  return fullnessMap;
}

/**
 * Takvim için günlük doluluk hesaplar
 */
export async function getCalendarFullness(
  boatId: string,
  startDate: string,
  endDate: string,
  boatCapacity: number,
  timeSlotCount: number
): Promise<Map<string, number>> {
  const reservations = await getReservationsByBoatDateRange(boatId, startDate, endDate);
  const fullnessMap = new Map<string, number>();

  console.log('📅 Takvim doluluk hesaplanıyor:', {
    boatId,
    startDate,
    endDate,
    boatCapacity,
    timeSlotCount,
    rezervasyonSayisi: reservations.length
  });
  
  if (reservations.length === 0) {
    console.warn('⚠️ HİÇ REZERVASYON BULUNAMADI! Tüm günler yeşil olacak.');
    return fullnessMap;
  }
  
  console.log('🔍 İlk 3 rezervasyon:', reservations.slice(0, 3).map(r => ({
    date: r.date,
    timeSlotId: r.timeSlotId,
    timeSlotDisplay: r.timeSlotDisplay,
    selectedSeats: r.selectedSeats,
    boatId: r.boatId,
    status: r.status
  })));

  // Rezervasyonları tarihe göre grupla
  const reservationsByDate = new Map<string, Reservation[]>();
  reservations.forEach((res) => {
    // Tarih normalizasyonu - ISO timestamp ise sadece tarih kısmını al
    let dateKey = res.date;
    if (typeof dateKey === 'string' && dateKey.includes('T')) {
      dateKey = dateKey.split('T')[0];
    }
    
    if (!reservationsByDate.has(dateKey)) {
      reservationsByDate.set(dateKey, []);
    }
    reservationsByDate.get(dateKey)!.push(res);
  });

  // Her gün için doluluk durumunu hesapla
  reservationsByDate.forEach((dayReservations, date) => {
    // Rezervasyonları saat dilimine göre grupla
    const reservationsByTimeSlot = new Map<string, Reservation[]>();
    dayReservations.forEach((res) => {
      const timeSlotId = res.timeSlotId || 'unknown';
      if (!reservationsByTimeSlot.has(timeSlotId)) {
        reservationsByTimeSlot.set(timeSlotId, []);
      }
      reservationsByTimeSlot.get(timeSlotId)!.push(res);
    });

    // Her saat diliminin doluluk durumunu kontrol et
    let fullSlotCount = 0; // Tamamen dolu saat sayısı
    let hasAnyReservation = false; // Herhangi bir rezervasyon var mı?
    
    reservationsByTimeSlot.forEach((slotReservations, timeSlotId) => {
      const occupiedSeats = getOccupiedSeats(slotReservations).length;
      const slotFullness = occupiedSeats / boatCapacity;
      
      if (occupiedSeats > 0) {
        hasAnyReservation = true;
      }
      
      if (slotFullness >= 1) {
        fullSlotCount++;
      }
      
      console.log(`  ${date} ${timeSlotId}: ${occupiedSeats}/${boatCapacity} = ${slotFullness.toFixed(2)}`);
    });

    // Takvim renk mantığı:
    // 0 = Tüm saatler boş (YEŞİL)
    // 0.5 = En az 1 saat dolu ama hepsi dolu değil (SARI)
    // 1 = Tüm saatler tamamen dolu (KIRMIZI - seçilemez)
    let dayFullness = 0;
    if (fullSlotCount === timeSlotCount) {
      // Tüm saatler tamamen dolu
      dayFullness = 1;
      console.log(`📊 ${date}: TÜM SAATLER DOLU (${fullSlotCount}/${timeSlotCount}) → KIRMIZI`);
    } else if (hasAnyReservation) {
      // En az 1 rezervasyon var ama tüm saatler dolu değil
      dayFullness = 0.5;
      console.log(`📊 ${date}: REZERVASYON VAR (${fullSlotCount}/${timeSlotCount} dolu) → SARI`);
    } else {
      // Hiç rezervasyon yok
      dayFullness = 0;
      console.log(`📊 ${date}: TÜM SAATLER BOŞ → YEŞİL`);
    }

    fullnessMap.set(date, dayFullness);
  });

  return fullnessMap;
}

/**
 * Rezervasyon numarası ile rezervasyon sorgular
 * @param reservationNumber - Rezervasyon numarası (örn: BS-2024-001234)
 * @returns Rezervasyon bilgileri veya null
 */
export async function getReservationByNumber(
  reservationNumber: string
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('reservationNumber', '==', reservationNumber.toUpperCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Rezervasyon bulunamadı' };
    }

    const docData = snapshot.docs[0];
    const reservation = { id: docData.id, ...docData.data() } as Reservation;

    return { success: true, reservation };
  } catch (error: any) {
    console.error('Rezervasyon sorgulama hatası:', error);
    return { success: false, error: 'Rezervasyon sorgulanırken bir hata oluştu' };
  }
}

/**
 * Telefon numarası ile rezervasyonları sorgular
 * @param phone - Telefon numarası
 * @returns Rezervasyon listesi
 */
export async function getReservationsByPhone(
  phone: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }> {
  try {
    // Telefon numarasını temizle
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: 'Geçerli bir telefon numarası girin' };
    }

    console.log('🔍 Telefon ile rezervasyon aranıyor:', cleanPhone);

    // Hem 0'lı hem 0'sız versiyonları oluştur
    let phoneWithZero = cleanPhone;
    let phoneWithoutZero = cleanPhone;
    
    if (cleanPhone.startsWith('0')) {
      phoneWithoutZero = cleanPhone.substring(1);
    } else {
      phoneWithZero = '0' + cleanPhone;
    }

    console.log('🔍 Aranacak telefon versiyonları:', {
      withZero: phoneWithZero,
      withoutZero: phoneWithoutZero
    });

    // Her iki versiyonu da ara
    const q = query(
      collection(db, 'reservations'),
      where('userPhone', 'in', [phoneWithZero, phoneWithoutZero])
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('❌ Rezervasyon bulunamadı');
      return { success: false, error: 'Bu telefon numarası ile kayıtlı rezervasyon bulunamadı' };
    }

    const reservations: Reservation[] = [];
    snapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });

    // Tarihe göre sırala (en yeni önce)
    reservations.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log('✅ Bulunan rezervasyon sayısı:', reservations.length);

    return { success: true, reservations };
  } catch (error: any) {
    console.error('Telefon ile rezervasyon sorgulama hatası:', error);
    return { success: false, error: 'Rezervasyon sorgulanırken bir hata oluştu' };
  }
}

/**
 * Rezervasyon numarası ve telefon ile rezervasyon iptal eder
 * @param reservationNumber - Rezervasyon numarası
 * @param phone - Telefon numarası (doğrulama için)
 * @returns Başarı durumu
 */
export async function cancelReservationByNumber(
  reservationNumber: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Önce rezervasyonu bul
    const result = await getReservationByNumber(reservationNumber);
    
    if (!result.success || !result.reservation) {
      return { success: false, error: result.error || 'Rezervasyon bulunamadı' };
    }

    const reservation = result.reservation;

    // Telefon numarasını doğrula (sadece rakamları karşılaştır)
    const cleanInputPhone = phone.replace(/\D/g, '');
    const cleanReservationPhone = reservation.userPhone.replace(/\D/g, '');

    if (!cleanReservationPhone.includes(cleanInputPhone) && !cleanInputPhone.includes(cleanReservationPhone)) {
      return { success: false, error: 'Telefon numarası eşleşmiyor' };
    }

    // Rezervasyon zaten iptal edilmiş mi?
    if (reservation.status === 'cancelled') {
      return { success: false, error: 'Bu rezervasyon zaten iptal edilmiş' };
    }

    // Rezervasyonu iptal et
    const docRef = doc(db, 'reservations', reservation.id);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      cancelledAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Rezervasyon iptal hatası:', error);
    return { success: false, error: 'Rezervasyon iptal edilirken bir hata oluştu' };
  }
}
