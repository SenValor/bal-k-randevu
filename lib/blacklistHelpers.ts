import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseClient';

// Kesin yasak — Firestore'dan bağımsız, hiçbir koşulda rezervasyon alamazlar
const PERMANENT_BAN_PHONES = ['05394208108', '5394208108', '05423872269', '5423872269'];

function isPermanentlyBanned(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return PERMANENT_BAN_PHONES.includes(clean);
}

export async function isPhoneBlacklisted(phone: string): Promise<boolean> {
  if (isPermanentlyBanned(phone)) return true;

  try {
    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      return false;
    }


    // Hem 0'lı hem 0'sız versiyonları oluştur
    let phoneWithZero = cleanPhone;
    let phoneWithoutZero = cleanPhone;
    
    if (cleanPhone.startsWith('0')) {
      // 0555... geldi -> 555... versiyonunu da oluştur
      phoneWithoutZero = cleanPhone.substring(1);
    } else {
      // 555... geldi -> 0555... versiyonunu da oluştur
      phoneWithZero = '0' + cleanPhone;
    }


    // Her iki versiyonu da kontrol et
    const phoneVariants = [phoneWithZero, phoneWithoutZero];
    
    const q = query(
      collection(db, 'blacklist'),
      where('phone', 'in', phoneVariants)
    );

    const querySnapshot = await getDocs(q);
    
    const found = !querySnapshot.empty;
    
    if (found) {
    } else {
    }
    
    return found;
  } catch (error) {
    return false;
  }
}

/**
 * Kara listede olan telefon numarasının bilgilerini getirir
 * @param phone - Kontrol edilecek telefon numarası
 * @returns Kara liste bilgisi veya null
 */
export async function getBlacklistInfo(phone: string): Promise<{
  name: string;
  reason: string;
  addedAt: string;
} | null> {
  if (isPermanentlyBanned(phone)) {
    return {
      name: 'Yasaklı Kullanıcı',
      reason:
        'Geçmişteki olumsuz davranışlarınız nedeniyle sistemimizden kalıcı olarak engellendiniz. ' +
        'Tekrar rezervasyon yapma girişimleriniz kayıt altına alınmaktadır. ' +
        'İtiraz için lütfen bizimle yüz yüze iletişime geçin.',
      addedAt: '',
    };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      return null;
    }

    // Hem 0'lı hem 0'sız versiyonları oluştur
    let phoneWithZero = cleanPhone;
    let phoneWithoutZero = cleanPhone;
    
    if (cleanPhone.startsWith('0')) {
      phoneWithoutZero = cleanPhone.substring(1);
    } else {
      phoneWithZero = '0' + cleanPhone;
    }

    const phoneVariants = [phoneWithZero, phoneWithoutZero];
    
    const q = query(
      collection(db, 'blacklist'),
      where('phone', 'in', phoneVariants)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const data = querySnapshot.docs[0].data();
    return {
      name: data.name || 'Bilinmiyor',
      reason: data.reason || 'Belirtilmemiş',
      addedAt: data.addedAt || '',
    };
  } catch (error) {
    return null;
  }
}
