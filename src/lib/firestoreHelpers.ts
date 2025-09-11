import { onSnapshot, Unsubscribe, FirestoreError } from 'firebase/firestore';

/**
 * Firestore dinleyici için gelişmiş hata yakalama ve yeniden bağlanma
 */
export function createResilientListener(
  query: any,
  onNext: (data: any) => void,
  onError?: (error: FirestoreError) => void,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Unsubscribe {
  let retryCount = 0;
  let unsubscribe: Unsubscribe | null = null;
  let isActive = true;

  const createListener = () => {
    if (!isActive) return;

    unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        retryCount = 0; // Başarılı bağlantıda retry sayacını sıfırla
        onNext(snapshot);
      },
      (error: FirestoreError) => {
        console.error('Firestore listener hatası:', error);
        
        // Belirli hata türlerinde yeniden dene
        if (shouldRetry(error) && retryCount < maxRetries && isActive) {
          retryCount++;
          console.log(`Firestore bağlantısı yeniden denenecek (${retryCount}/${maxRetries})...`);
          
          // Mevcut dinleyiciyi kapat
          if (unsubscribe) {
            unsubscribe();
          }
          
          // Delay sonrası yeniden dene
          setTimeout(createListener, retryDelay * retryCount);
        } else {
          // Maksimum deneme sayısına ulaşıldı veya kritik hata
          if (onError) {
            onError(error);
          } else {
            console.error('Firestore bağlantısı başarısız, yeniden deneme durdu:', error);
          }
        }
      }
    );
  };

  // İlk bağlantıyı başlat
  createListener();

  // Cleanup function döndür
  return () => {
    isActive = false;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Hangi hatalarda yeniden deneme yapılacağını belirle
 */
function shouldRetry(error: FirestoreError): boolean {
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'aborted',
    'cancelled'
  ];
  
  return retryableCodes.includes(error.code);
}

/**
 * Ağ durumunu kontrol et
 */
export function checkNetworkStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Ağ durumu değişikliklerini dinle
 */
export function setupNetworkStatusListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    console.log('Ağ bağlantısı tekrar kuruldu');
    onOnline();
  };

  const handleOffline = () => {
    console.log('Ağ bağlantısı kesildi');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
