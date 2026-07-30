import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface PromoCode {
  id?: string;
  code: string;
  description: string;
  discountType: 'percent' | 'amount';
  discountValue: number;
  maxUsage: number;
  currentUsage: number;
  validFrom: string;   // YYYY-MM-DD
  validUntil: string;  // YYYY-MM-DD
  isActive: boolean;
  createdAt?: any;
}

export interface ValidateResult {
  valid: boolean;
  promoCode?: PromoCode;
  error?: string;
}

export async function validatePromoCode(code: string): Promise<ValidateResult> {
  try {
    const q = query(
      collection(db, 'promoCodes'),
      where('code', '==', code.toUpperCase().trim())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { valid: false, error: 'Kampanya kodu bulunamadı' };
    }

    const docData = snap.docs[0];
    const promoCode: PromoCode = { id: docData.id, ...(docData.data() as Omit<PromoCode, 'id'>) };

    if (!promoCode.isActive) {
      return { valid: false, error: 'Bu kampanya kodu aktif değil' };
    }

    if (promoCode.currentUsage >= promoCode.maxUsage) {
      return { valid: false, error: 'Bu kodun kullanım limiti doldu' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (promoCode.validUntil < today) {
      return { valid: false, error: 'Bu kampanya kodunun süresi dolmuş' };
    }
    if (promoCode.validFrom > today) {
      return { valid: false, error: 'Bu kampanya kodu henüz aktif değil' };
    }

    return { valid: true, promoCode };
  } catch {
    return { valid: false, error: 'Kod kontrol edilirken hata oluştu' };
  }
}

export async function incrementPromoCodeUsage(promoCodeId: string): Promise<void> {
  const ref = doc(db, 'promoCodes', promoCodeId);
  await updateDoc(ref, { currentUsage: increment(1) });
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const snap = await getDocs(
    query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromoCode, 'id'>) }));
}

export async function createPromoCode(data: Omit<PromoCode, 'id' | 'currentUsage' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'promoCodes'), {
    ...data,
    code: data.code.toUpperCase().trim(),
    currentUsage: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePromoCode(id: string, data: Partial<PromoCode>): Promise<void> {
  const ref = doc(db, 'promoCodes', id);
  const update = { ...data };
  if (update.code) update.code = update.code.toUpperCase().trim();
  delete update.id;
  await updateDoc(ref, update);
}

export async function deletePromoCode(id: string): Promise<void> {
  await deleteDoc(doc(db, 'promoCodes', id));
}
