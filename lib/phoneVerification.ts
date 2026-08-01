import { db } from './firebaseClient';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';

/**
 * 6 haneli rastgele doğrulama kodu üret
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Telefon numarasını WhatsApp formatına çevir (+90...)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '90' + cleaned.substring(1);
  }
  if (cleaned.startsWith('90')) {
    return cleaned;
  }
  return '90' + cleaned;
}

/**
 * WhatsApp ile doğrulama kodu gönder
 */
export async function sendVerificationCode(
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Telefonu formatla
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    
    
    // Son 1 dakikada gönderilmiş kod var mı kontrol et (spam önleme)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentQuery = query(
      collection(db, 'verification_codes'),
      where('phone', '==', formattedPhone),
      where('createdAt', '>', Timestamp.fromDate(oneMinuteAgo))
    );
    const recentDocs = await getDocs(recentQuery);
    
    if (!recentDocs.empty) {
      return { 
        success: false, 
        error: 'Lütfen 1 dakika bekleyin' 
      };
    }
    
    // Yeni kod üret
    const code = generateVerificationCode();
    
    // Firestore'a kaydet
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 dakika
    await addDoc(collection(db, 'verification_codes'), {
      phone: formattedPhone,
      code: code,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false,
      attempts: 0,
    });
    
    
    // WhatsApp API'ye gönder
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        code: code,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: 'WhatsApp mesajı gönderilemedi' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Doğrulama kodunu kontrol et
 */
export async function verifyCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    
    
    // Kodu bul
    const q = query(
      collection(db, 'verification_codes'),
      where('phone', '==', formattedPhone),
      where('code', '==', code),
      where('verified', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Geçersiz kod' };
    }
    
    const docData = snapshot.docs[0].data();
    const docRef = doc(db, 'verification_codes', snapshot.docs[0].id);
    
    // Süre dolmuş mu?
    const now = new Date();
    const expiresAt = docData.expiresAt.toDate();
    
    if (now > expiresAt) {
      return { success: false, error: 'Kod süresi dolmuş. Lütfen yeni kod isteyin.' };
    }
    
    // Çok fazla deneme yapılmış mı?
    if (docData.attempts >= 3) {
      return { success: false, error: 'Çok fazla hatalı deneme. Lütfen yeni kod isteyin.' };
    }
    
    // Kodu doğrulandı olarak işaretle
    await updateDoc(docRef, {
      verified: true,
      usedAt: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Bir hata oluştu' };
  }
}

/**
 * Yanlış kod girişini kaydet
 */
export async function incrementAttempts(
  phoneNumber: string,
  code: string
): Promise<void> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    
    const q = query(
      collection(db, 'verification_codes'),
      where('phone', '==', formattedPhone),
      where('code', '==', code)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = doc(db, 'verification_codes', snapshot.docs[0].id);
      const currentAttempts = snapshot.docs[0].data().attempts || 0;
      
      await updateDoc(docRef, {
        attempts: currentAttempts + 1,
      });
      
    }
  } catch (error) {
  }
}
