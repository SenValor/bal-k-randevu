import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

/**
 * Yeni kullanıcı kaydı oluşturur
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  phone: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Firebase Authentication ile kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kullanıcı profil adını güncelle
    await updateProfile(user, {
      displayName: name,
    });

    // Firestore'da kullanıcı bilgilerini kaydet
    const userData: UserData = {
      uid: user.uid,
      name,
      email,
      phone,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return { success: true, user };
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    
    // Türkçe hata mesajları
    let errorMessage = 'Kayıt sırasında bir hata oluştu';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Bu e-posta adresi zaten kullanılıyor';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Şifre en az 6 karakter olmalıdır';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Kullanıcı girişi yapar
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Giriş hatası:', error);
    
    let errorMessage = 'Giriş sırasında bir hata oluştu';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'E-posta veya şifre hatalı';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Kullanıcı çıkışı yapar
 */
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Çıkış hatası:', error);
    return { success: false, error: 'Çıkış sırasında bir hata oluştu' };
  }
}

/**
 * Firestore'dan kullanıcı bilgilerini getirir
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı bilgileri alınamadı:', error);
    return null;
  }
}

/**
 * Mevcut kullanıcıyı döndürür
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
