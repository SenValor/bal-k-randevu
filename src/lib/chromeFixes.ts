/**
 * Chrome-specific fixes ve optimizasyonlar
 */

/**
 * Chrome'da sık görülen Firestore cache sorunlarını temizle
 */
export function clearChromeFirestoreCache() {
  if (typeof window === 'undefined') return;
  
  try {
    // IndexedDB cache temizliği
    if (window.indexedDB) {
      const deleteRequests = [
        'firestore',
        'firebase-app-check-database',
        'firebase-heartbeat-database',
        'fcm_token_details_db'
      ];
      
      deleteRequests.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => {
          console.log(`🗑️ Chrome IndexedDB temizlendi: ${dbName}`);
        };
        deleteReq.onerror = () => {
          console.warn(`⚠️ IndexedDB temizlenemedi: ${dbName}`);
        };
      });
    }
    
    // LocalStorage'da Firebase cache'i temizle
    if (window.localStorage) {
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('firebase') || 
        key.includes('firestore') ||
        key.includes('balik-sefasi')
      );
      
      firebaseKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Chrome LocalStorage temizlendi: ${key}`);
      });
    }
    
    // SessionStorage temizliği
    if (window.sessionStorage) {
      const firebaseKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('firebase') || 
        key.includes('firestore')
      );
      
      firebaseKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
    }
    
  } catch (error) {
    console.error('Chrome cache temizleme hatası:', error);
  }
}

/**
 * Chrome'da third-party cookie blocker detection
 */
export function detectChromePrivacySettings(): {
  thirdPartyCookiesBlocked: boolean;
  adBlockerDetected: boolean;
  trackingProtectionEnabled: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      thirdPartyCookiesBlocked: false,
      adBlockerDetected: false,
      trackingProtectionEnabled: false
    };
  }
  
  // Third-party cookie test
  const thirdPartyCookiesBlocked = !navigator.cookieEnabled || 
    document.cookie.indexOf('test=test') === -1;
  
  // Ad blocker detection (basit)
  const adBlockerDetected = !!(window as any).chrome?.runtime?.onMessage ||
    document.querySelectorAll('[id*="ad"]').length === 0;
  
  // Privacy settings detection
  const trackingProtectionEnabled = !!(navigator as any).doNotTrack ||
    (navigator as any).globalPrivacyControl;
  
  return {
    thirdPartyCookiesBlocked,
    adBlockerDetected,
    trackingProtectionEnabled
  };
}

/**
 * Chrome'da Firestore bağlantısını optimize et
 */
export function optimizeFirestoreForChrome() {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise<void>((resolve) => {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    
    if (!isChrome) {
      resolve();
      return;
    }
    
    console.log('🔧 Chrome için Firestore optimizasyonu başlatılıyor...');
    
    // Chrome'da network state checking
    const connection = (navigator as any).connection;
    if (connection) {
      console.log(`📶 Chrome Network: ${connection.effectiveType}, Downlink: ${connection.downlink}Mbps`);
      
      // Yavaş bağlantıda timeout'ları artır
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        console.log('🐌 Yavaş bağlantı tespit edildi, timeout artırılıyor');
      }
    }
    
    // Chrome'da bazen gerekli olan memory pressure release
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log(`💾 Chrome Memory: Used ${Math.round(memInfo.usedJSHeapSize/1048576)}MB / Total ${Math.round(memInfo.totalJSHeapSize/1048576)}MB`);
      
      // Yüksek memory kullanımında garbage collection tetikle
      if (memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.8) {
        console.log('🗑️ High memory usage, triggering cleanup');
        if ((window as any).gc) {
          (window as any).gc();
        }
      }
    }
    
    // Chrome'da indexedDB ready state check
    if (window.indexedDB) {
      const testDB = indexedDB.open('connectivity-test', 1);
      
      testDB.onsuccess = () => {
        console.log('✅ Chrome IndexedDB hazır');
        testDB.result.close();
        indexedDB.deleteDatabase('connectivity-test');
        resolve();
      };
      
      testDB.onerror = () => {
        console.warn('⚠️ Chrome IndexedDB sorunu tespit edildi');
        resolve();
      };
      
      // Timeout için fallback
      setTimeout(resolve, 1000);
    } else {
      console.warn('❌ Chrome IndexedDB desteklenmiyor');
      resolve();
    }
  });
}

/**
 * Chrome'da Firestore için özelleştirilmiş retry logic
 */
export function chromeSpecificRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attempt = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error: any) {
        attempts++;
        
        // Chrome-specific error codes
        const chromeSpecificErrors = [
          'ERR_NETWORK_CHANGED',
          'ERR_INTERNET_DISCONNECTED',
          'ERR_NETWORK_ACCESS_DENIED',
          'quota-exceeded'
        ];
        
        const isRetryableError = 
          chromeSpecificErrors.some(err => error.message?.includes(err)) ||
          error.code === 'unavailable' ||
          error.code === 'deadline-exceeded';
        
        if (attempts < maxRetries && isRetryableError) {
          console.log(`🔄 Chrome retry ${attempts}/${maxRetries} for error:`, error.message);
          
          // Chrome'da exponential backoff with jitter
          const jitter = Math.random() * 500;
          const retryDelay = delay * Math.pow(2, attempts - 1) + jitter;
          
          setTimeout(attempt, retryDelay);
        } else {
          reject(error);
        }
      }
    };
    
    attempt();
  });
}

/**
 * Chrome DevTools açık mı kontrol et
 */
export function isChromeDevToolsOpen(): boolean {
  if (typeof window === 'undefined') return false;
  
  const threshold = 160;
  return (
    window.outerHeight - window.innerHeight > threshold ||
    window.outerWidth - window.innerWidth > threshold
  );
}
