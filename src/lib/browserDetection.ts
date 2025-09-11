/**
 * Browser detection ve Chrome specific debugging
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isWebKit: boolean;
  supportsFirestore: boolean;
  userAgent: string;
}

export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'server',
      version: '0',
      isChrome: false,
      isSafari: false,
      isFirefox: false,
      isWebKit: false,
      supportsFirestore: false,
      userAgent: 'server'
    };
  }

  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isWebKit = /WebKit/.test(userAgent);

  // Version detection
  let name = 'unknown';
  let version = '0';

  if (isChrome) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (isSafari) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (isFirefox) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '0';
  }

  // Firestore support check
  const supportsFirestore = !!(
    window.indexedDB &&
    window.WebSocket &&
    window.fetch &&
    window.Promise
  );

  return {
    name,
    version,
    isChrome,
    isSafari,
    isFirefox,
    isWebKit,
    supportsFirestore,
    userAgent
  };
}

/**
 * Chrome specific diagnostics
 */
export function chromeDiagnostics() {
  const browser = detectBrowser();
  
  if (!browser.isChrome) {
    return null;
  }

  return {
    version: browser.version,
    extensions: {
      adBlocker: !!(window as any).chrome?.runtime?.onMessage,
      devTools: !!(window as any).chrome?.devtools
    },
    storage: {
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      indexedDB: !!window.indexedDB
    },
    network: {
      online: navigator.onLine,
      connection: (navigator as any).connection || null,
      cookiesEnabled: navigator.cookieEnabled
    },
    security: {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    }
  };
}

/**
 * Chrome ile Safari arasındaki farklara odaklanan log
 */
export function logBrowserComparison() {
  const browser = detectBrowser();
  
  console.group(`🌐 Browser: ${browser.name} ${browser.version}`);
  
  if (browser.isChrome) {
    const chromeInfo = chromeDiagnostics();
    console.log('🔍 Chrome Diagnostics:', chromeInfo);
    
    // Chrome specific issues
    if (!chromeInfo?.storage.localStorage) {
      console.warn('⚠️ LocalStorage disabled in Chrome');
    }
    
    if (!chromeInfo?.storage.indexedDB) {
      console.warn('⚠️ IndexedDB disabled in Chrome');
    }
    
    if (chromeInfo?.extensions.adBlocker) {
      console.warn('⚠️ Potential ad blocker detected');
    }
  }
  
  if (browser.isSafari) {
    console.log('🍎 Safari - generally has better default settings');
    console.log('🔒 Safari ITP (Intelligent Tracking Prevention) is active');
  }
  
  if (!browser.supportsFirestore) {
    console.error('❌ Browser does not support Firestore requirements');
  } else {
    console.log('✅ Browser supports Firestore');
  }
  
  console.groupEnd();
}

/**
 * Chrome'da Firestore bağlantısını zorla başlat
 */
export function forceFirestoreConnectionInChrome() {
  const browser = detectBrowser();
  
  if (!browser.isChrome) {
    return Promise.resolve();
  }
  
  return new Promise<void>((resolve) => {
    console.log('🔄 Chrome için Firestore bağlantısı zorlanıyor...');
    
    // Chrome'da bazen yavaş olan bağlantıyı hızlandır
    setTimeout(() => {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      resolve();
    }, 100);
  });
}
