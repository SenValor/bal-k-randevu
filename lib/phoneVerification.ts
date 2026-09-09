import { db } from './firebaseClient';
import {
  collection,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { isPhoneBlacklisted } from './blacklistHelpers';

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '90' + cleaned.substring(1);
  if (cleaned.startsWith('90')) return cleaned;
  return '90' + cleaned;
}

export async function sendVerificationCode(
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const blacklisted = await isPhoneBlacklisted(phoneNumber);
    if (blacklisted) {
      return {
        success: false,
        error: '⛔ Bu numara sistemimizden kalıcı olarak engellenmiştir. Rezervasyon yapamazsınız.',
      };
    }

    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    const code = generateVerificationCode();

    // Kodu Firestore'a kaydet
    const expiresAt = new Date(Date.now() + 5 * 60000);
    await addDoc(collection(db, 'verification_codes'), {
      phone: formattedPhone,
      code: code,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false,
      attempts: 0,
    });

    // WhatsApp API — spam kontrolü ve gönderim server-side yapılıyor
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, code }),
    });

    if (response.status === 429) {
      return { success: false, error: 'Lütfen 1 dakika bekleyin' };
    }

    if (!response.ok) {
      return { success: false, error: 'WhatsApp mesajı gönderilemedi' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Bir hata oluştu' };
  }
}

// Kod doğrulama artık server-side /api/verify-code üzerinden yapılıyor
export async function verifyCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

    const response = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, code }),
    });

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch {
    return { success: false, error: 'Bir hata oluştu' };
  }
}

// incrementAttempts artık /api/verify-code içinde otomatik yapılıyor
export async function incrementAttempts(
  phoneNumber: string,
  code: string
): Promise<void> {
  // server-side handle ediliyor
}
