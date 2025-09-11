// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqf2A1Imd_9IqCSNp2zyedYQBKyYNPNTc",
  authDomain: "balik-sefasi.firebaseapp.com",
  projectId: "balik-sefasi",
  storageBucket: "balik-sefasi.firebasestorage.app",
  messagingSenderId: "903043505535",
  appId: "1:903043505535:web:583c2e8886c718f6a10e4a",
  measurementId: "G-0WE5C1CJHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Firestore'u optimize edilmiş ayarlarla başlat
export const db = getFirestore(app);

// Firestore ayarları (sadece client-side'da)
if (typeof window !== 'undefined') {
  // Cache boyutunu artır (40MB)
  try {
    const { enableNetwork, disableNetwork } = require('firebase/firestore');
    
    // Ağ durumu kontrolleri
    let isOnline = navigator.onLine;
    
    const handleOnline = () => {
      isOnline = true;
      enableNetwork(db).catch(console.error);
    };
    
    const handleOffline = () => {
      isOnline = false;
      disableNetwork(db).catch(console.error);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Sayfa yüklendiğinde ağ durumunu kontrol et
    if (!isOnline) {
      disableNetwork(db).catch(console.error);
    }
  } catch (error) {
    console.warn('Firestore ağ kontrolü kurulamadı:', error);
  }
}

export const storage = getStorage(app);

// Firestore ayarları
if (typeof window !== 'undefined') {
  // Browser ortamında bağlantı ayarları
  const { connectFirestoreEmulator } = require('firebase/firestore');
  
  // Sadece development ortamında emulator kullan
  if (process.env.NODE_ENV === 'development') {
    // Prodüksiyon için bu satırı yoruma al
    // connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

// Initialize Analytics only in client-side and if supported
export const analytics = typeof window !== 'undefined' ? 
  isSupported().then(yes => yes ? getAnalytics(app) : null) : 
  null;

export default app; 