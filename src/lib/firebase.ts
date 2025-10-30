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

// Chrome ve performans optimizasyonları (sadece client-side'da)
if (typeof window !== 'undefined') {
  try {
    const { enableNetwork, disableNetwork, enableMultiTabIndexedDbPersistence, connectFirestoreEmulator } = require('firebase/firestore');
    
    // Chrome için özel cache ve persistence ayarları
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Birden fazla sekme açık');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Tarayıcı desteklemiyor');
      }
    });
    
    // Ağ durumu kontrolleri
    let isOnline = navigator.onLine;
    let networkRetryCount = 0;
    const MAX_RETRY = 3;
    
    const handleOnline = async () => {
      isOnline = true;
      networkRetryCount = 0;
      try {
        await enableNetwork(db);
        console.log('🟢 Firebase bağlantısı yeniden kuruldu');
      } catch (error) {
        console.error('Firebase ağ etkinleştirme hatası:', error);
      }
    };
    
    const handleOffline = async () => {
      isOnline = false;
      try {
        await disableNetwork(db);
        console.log('🔴 Firebase bağlantısı kapatıldı (offline)');
      } catch (error) {
        console.error('Firebase ağ kapatma hatası:', error);
      }
    };
    
    // Chrome'da connection retry mekanizması
    const retryConnection = async () => {
      if (!isOnline && networkRetryCount < MAX_RETRY) {
        networkRetryCount++;
        console.log(`🔄 Firebase bağlantısı yeniden deneniyor (${networkRetryCount}/${MAX_RETRY})`);
        
        setTimeout(async () => {
          try {
            await enableNetwork(db);
            isOnline = true;
            networkRetryCount = 0;
            console.log('✅ Firebase bağlantısı başarıyla kuruldu');
          } catch (error) {
            console.error('Firebase retry hatası:', error);
            if (networkRetryCount < MAX_RETRY) {
              retryConnection();
            }
          }
        }, 2000 * networkRetryCount); // Exponential backoff
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Chrome için visibility change eventi
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !isOnline) {
        retryConnection();
      }
    });
    
    // Sayfa yüklendiğinde ağ durumunu kontrol et
    if (!isOnline) {
      disableNetwork(db).catch(console.error);
    }
    
    // Chrome için özel timeout ayarları
    (window as any).firebaseTimeout = 15000; // 15 saniye timeout
    
    // Chrome Firebase hata yakalama
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.code === 'permission-denied' || 
          event.reason?.message?.includes('Missing or insufficient permissions')) {
        console.warn('🔴 Chrome Firebase unhandled rejection:', event.reason);
        
        // Kullanıcıya bilgi ver
        setTimeout(() => {
          const shouldReload = confirm(
            '🔄 Bağlantı Sorunu\n\n' +
            'Chrome tarayıcısında geçici bir sorun oluştu.\n' +
            'Sayfayı yenilemek ister misiniz?'
          );
          if (shouldReload) {
            window.location.reload();
          }
        }, 2000);
        
        event.preventDefault(); // Console'da hata göstermesini engelle
      }
    });
    
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