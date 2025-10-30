import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface Tour {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[]; // Dahil olan hizmetler
  excludes: string[]; // Dahil olmayan hizmetler
  highlights: string[]; // Öne çıkan özellikler
  category: 'normal-with-equipment' | 'normal-without-equipment' | 'private'; // Tur kategorisi
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TourFormData = Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Yeni tur ekler
 */
export async function addTour(
  tourData: TourFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await addDoc(collection(db, 'tours'), {
      ...tourData,
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Tur ekleme hatası:', error);
    return { success: false, error: 'Tur eklenirken bir hata oluştu' };
  }
}

/**
 * Tur günceller
 */
export async function updateTour(
  id: string,
  tourData: Partial<TourFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const tourRef = doc(db, 'tours', id);
    await updateDoc(tourRef, {
      ...tourData,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Tur güncelleme hatası:', error);
    return { success: false, error: 'Tur güncellenirken bir hata oluştu' };
  }
}

/**
 * Tur siler
 */
export async function deleteTour(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'tours', id));
    return { success: true };
  } catch (error: any) {
    console.error('Tur silme hatası:', error);
    return { success: false, error: 'Tur silinirken bir hata oluştu' };
  }
}

/**
 * Tur aktiflik durumunu günceller
 */
export async function toggleTourStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const tourRef = doc(db, 'tours', id);
    await updateDoc(tourRef, {
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
 * Turları gerçek zamanlı dinler
 */
export function subscribeToTours(
  callback: (tours: Tour[]) => void
): () => void {
  const q = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tours: Tour[] = [];
      snapshot.forEach((doc) => {
        tours.push({
          id: doc.id,
          ...doc.data(),
        } as Tour);
      });
      callback(tours);
    },
    (error) => {
      console.error('Turlar dinlenirken hata:', error);
    }
  );

  return unsubscribe;
}
