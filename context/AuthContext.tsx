  'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData;
        console.log('📋 Firestore\'dan kullanıcı verisi:', data);
        setUserData(data);
      } else {
        // Firestore'da kullanıcı yoksa oluştur
        console.log('⚠️ Kullanıcı Firestore\'da bulunamadı, oluşturuluyor...');
        const newUserData: UserData = {
          uid: currentUser.uid,
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Kullanıcı verisi alınamadı:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      throw new Error(error.message || 'Giriş yapılamadı');
    }
  };

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Firestore'da kullanıcı oluştur
      const newUserData: UserData = {
        uid: userCredential.user.uid,
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      };
      console.log('✅ Yeni kullanıcı Firestore\'a kaydediliyor:', newUserData);
      await setDoc(doc(db, 'users', userCredential.user.uid), newUserData);
      
      // userData state'ini hemen güncelle
      setUserData(newUserData);
      console.log('✅ Kullanıcı kaydı tamamlandı!');
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      throw new Error(error.message || 'Kayıt olunamadı');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    login,
    signup,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
