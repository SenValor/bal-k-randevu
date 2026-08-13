import { db } from './firebaseClient';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export interface AdminInfo {
  name: string;
  active: boolean;
  createdAt?: string;
}

export type AdminAction =
  | 'reservation_approved'
  | 'reservation_cancelled'
  | 'reservation_deleted'
  | 'reservation_edited'
  | 'bulk_approved'
  | 'bulk_cancelled'
  | 'archive_deleted'
  | 'blacklist_added'
  | 'blacklist_removed'
  | 'announcement_added'
  | 'announcement_toggled'
  | 'announcement_deleted';

export async function getAdminInfo(email: string): Promise<AdminInfo | null> {
  try {
    const snap = await getDoc(doc(db, 'admins', email));
    if (!snap.exists()) return null;
    const data = snap.data() as AdminInfo;
    return data.active ? data : null;
  } catch {
    return null;
  }
}

export async function logAdminAction(
  adminEmail: string,
  adminName: string,
  action: AdminAction,
  details?: {
    targetId?: string;
    reservationNumber?: string;
    extra?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminEmail,
      adminName,
      action,
      targetId: details?.targetId ?? null,
      reservationNumber: details?.reservationNumber ?? null,
      details: details?.extra ?? null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Admin log yazılamadı:', error);
  }
}
