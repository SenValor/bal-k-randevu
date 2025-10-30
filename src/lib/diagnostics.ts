import { db } from './firebase';

/**
 * Firestore bağlantı durumunu kontrol eden diagnostic utility
 */
export async function checkFirestoreConnection(): Promise<{
  isConnected: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const startTime = Date.now();
    
    // Basit bir Firestore sorgusu yaparak bağlantıyı test et
    const { collection, getDocs, limit, query } = await import('firebase/firestore');
    
    const testQuery = query(collection(db, 'boats'), limit(1));
    await getDocs(testQuery);
    
    const latency = Date.now() - startTime;
    
    return {
      isConnected: true,
      latency
    };
  } catch (error: any) {
    return {
      isConnected: false,
      error: error.message || 'Bilinmeyen bağlantı hatası'
    };
  }
}

/**
 * Browser ve ağ bilgilerini toplayan diagnostic function
 */
export function getBrowserDiagnostics() {
  if (typeof window === 'undefined') {
    return { environment: 'server' };
  }

  return {
    environment: 'client',
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : null,
    localStorage: (() => {
      try {
        return typeof localStorage !== 'undefined';
      } catch {
        return false;
      }
    })(),
    indexedDB: (() => {
      try {
        return typeof indexedDB !== 'undefined';
      } catch {
        return false;
      }
    })(),
    websocket: typeof WebSocket !== 'undefined',
    fetch: typeof fetch !== 'undefined'
  };
}

/**
 * Firestore hatalarını human-readable formata çeviren function
 */
export function translateFirestoreError(error: any): string {
  const errorCode = error?.code || '';
  
  const errorMessages: Record<string, string> = {
    'permission-denied': 'Erişim izni yok. Lütfen giriş yapın.',
    'unavailable': 'Firestore hizmeti geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
    'deadline-exceeded': 'İstek zaman aşımına uğradı. Lütfen internetinizi kontrol edin.',
    'resource-exhausted': 'Kaynak limiti aşıldı. Lütfen daha sonra tekrar deneyin.',
    'cancelled': 'İstek iptal edildi.',
    'internal': 'İç sunucu hatası. Lütfen daha sonra tekrar deneyin.',
    'unauthenticated': 'Kimlik doğrulama gerekli. Lütfen giriş yapın.',
    'not-found': 'İstenen veri bulunamadı.',
    'already-exists': 'Bu veri zaten mevcut.',
    'failed-precondition': 'İşlem koşulları sağlanmadı.',
    'aborted': 'İşlem iptal edildi ve tekrar denenebilir.',
    'out-of-range': 'Geçersiz parametre aralığı.',
    'unimplemented': 'Bu özellik henüz desteklenmiyor.',
    'data-loss': 'Veri kaybı tespit edildi.'
  };

  return errorMessages[errorCode] || `Bilinmeyen hata: ${error?.message || 'Detay yok'}`;
}

/**
 * Sistem durumunu logla
 */
export function logSystemStatus() {
  console.group('🔍 Sistem Durumu');
  
  const browserInfo = getBrowserDiagnostics();
  console.log('📱 Browser:', browserInfo);
  
  checkFirestoreConnection().then(result => {
    if (result.isConnected) {
      console.log('✅ Firestore Bağlantısı: Başarılı', `(${result.latency}ms)`);
    } else {
      console.error('❌ Firestore Bağlantısı: Başarısız', result.error);
    }
  });
  
  console.groupEnd();
}
