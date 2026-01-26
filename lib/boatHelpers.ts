import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface TimeSlot {
  start: string;
  end: string;
  displayName: string;
  baitWarning?: boolean; // Yem uyarısı aktif mi?
}

// Tarih bazlı saat dilimi planlaması
export interface ScheduledTimeSlots {
  effectiveDate: string; // YYYY-MM-DD formatında - bu tarihten itibaren geçerli
  timeSlots: TimeSlot[];
}

/**
 * Belirli bir tarih için geçerli saat dilimlerini döndürür
 * En son geçerli olan schedule'ı bulur
 */
export function getTimeSlotsForDate(
  scheduledTimeSlots: ScheduledTimeSlots[] | undefined,
  fallbackTimeSlots: TimeSlot[],
  targetDate: string
): TimeSlot[] {
  if (!scheduledTimeSlots || scheduledTimeSlots.length === 0) {
    return fallbackTimeSlots;
  }

  // Tarihe göre sırala (en yeni önce)
  const sortedSchedules = [...scheduledTimeSlots].sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );

  // targetDate için geçerli olan en son schedule'ı bul
  for (const schedule of sortedSchedules) {
    if (schedule.effectiveDate <= targetDate) {
      return schedule.timeSlots;
    }
  }

  // Hiçbir schedule geçerli değilse fallback kullan
  return fallbackTimeSlots;
}

export interface Boat {
  id: string;
  name: string;
  code: string; // Tekne kodu (T1, T2, T3, vb.)
  capacity: number;
  imageUrl: string;
  description: string;
  mapsLink?: string; // Google Maps konumu
  startDate: string; // YYYY-MM-DD formatında
  endDate: string;   // YYYY-MM-DD formatında
  seatLayout: 'single' | 'double';
  tourTypes: {
    normal: boolean;
    private: boolean;
    fishingSwimming: boolean;
  };
  timeSlots: TimeSlot[]; // Varsayılan saat dilimleri (geriye uyumluluk için)
  scheduledTimeSlots?: ScheduledTimeSlots[]; // Tarih bazlı saat dilimleri
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  ribbonText?: string;
  isRibbonActive?: boolean;
  ribbonColor?: string; // 'red' | 'blue' | 'green' | 'yellow'
}

export type BoatFormData = Omit<Boat, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Yeni tekne ekler
 */
export async function addBoat(
  boatData: BoatFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await addDoc(collection(db, 'boats'), {
      ...boatData,
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Tekne ekleme hatası:', error);
    return { success: false, error: 'Tekne eklenirken bir hata oluştu' };
  }
}

/**
 * Tekne günceller
 */
export async function updateBoat(
  id: string,
  boatData: Partial<BoatFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const boatRef = doc(db, 'boats', id);
    await updateDoc(boatRef, {
      ...boatData,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Tekne güncelleme hatası:', error);
    return { success: false, error: 'Tekne güncellenirken bir hata oluştu' };
  }
}

/**
 * Tekne siler
 */
export async function deleteBoat(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'boats', id));
    return { success: true };
  } catch (error: any) {
    console.error('Tekne silme hatası:', error);
    return { success: false, error: 'Tekne silinirken bir hata oluştu' };
  }
}

/**
 * Tekne aktiflik durumunu günceller
 */
export async function toggleBoatStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const boatRef = doc(db, 'boats', id);
    await updateDoc(boatRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Durum güncelleme hatası:', error);
    return { success: false, error: 'Durum güncellenirken bir hata oluştu' };
  }
}

/**
 * Tekneleri gerçek zamanlı dinler
 */
export function subscribeToBoats(
  callback: (boats: Boat[]) => void
): () => void {
  const q = query(collection(db, 'boats'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const boats: Boat[] = [];
      snapshot.forEach((doc) => {
        boats.push({
          id: doc.id,
          ...doc.data(),
        } as Boat);
      });
      callback(boats);
    },
    (error) => {
      console.error('Tekneler dinlenirken hata:', error);
    }
  );

  return unsubscribe;
}
