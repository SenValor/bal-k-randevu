'use client';

import { useState, useEffect } from 'react';
import { detectBrowser, chromeDiagnostics } from '@/lib/browserDetection';
import { detectChromePrivacySettings, clearChromeFirestoreCache } from '@/lib/chromeFixes';
import { checkFirestoreConnection } from '@/lib/diagnostics';

export default function ChromeDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [firestoreStatus, setFirestoreStatus] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const browser = detectBrowser();
    if (!browser.isChrome) return;

    // Chrome diagnostics topla
    const chromeInfo = chromeDiagnostics();
    const privacySettings = detectChromePrivacySettings();
    
    setDebugInfo({
      browser,
      chrome: chromeInfo,
      privacy: privacySettings
    });

    // Firestore bağlantı durumunu kontrol et
    checkFirestoreConnection().then(result => {
      setFirestoreStatus(result);
    });
  }, []);

  const browser = detectBrowser();
  
  // Sadece Chrome'da göster
  if (!browser.isChrome) return null;

  // Development ortamında veya debug modunda göster
  const shouldShow = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && window.location.search.includes('debug=true'));
  
  if (!shouldShow) return null;

  const testFirestoreConnection = async () => {
    const result = await checkFirestoreConnection();
    setFirestoreStatus(result);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Chrome Debug Panel"
        >
          🔧
        </button>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Chrome Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            {debugInfo && (
              <>
                <div>
                  <strong>Browser:</strong> {debugInfo.browser.name} {debugInfo.browser.version}
                </div>
                
                <div>
                  <strong>Storage:</strong>
                  <div className="ml-2 text-xs">
                    LocalStorage: {debugInfo.chrome?.storage?.localStorage ? '✅' : '❌'}<br/>
                    IndexedDB: {debugInfo.chrome?.storage?.indexedDB ? '✅' : '❌'}<br/>
                    Cookies: {debugInfo.chrome?.network?.cookiesEnabled ? '✅' : '❌'}
                  </div>
                </div>
                
                <div>
                  <strong>Privacy:</strong>
                  <div className="ml-2 text-xs">
                    3rd Party Cookies: {debugInfo.privacy?.thirdPartyCookiesBlocked ? '🚫' : '✅'}<br/>
                    Ad Blocker: {debugInfo.privacy?.adBlockerDetected ? '🛡️' : '❌'}<br/>
                    Tracking Protection: {debugInfo.privacy?.trackingProtectionEnabled ? '🔒' : '❌'}
                  </div>
                </div>
                
                <div>
                  <strong>Network:</strong>
                  <div className="ml-2 text-xs">
                    Online: {debugInfo.chrome?.network?.online ? '✅' : '❌'}<br/>
                    Connection: {debugInfo.chrome?.network?.connection?.effectiveType || 'Unknown'}
                  </div>
                </div>
              </>
            )}
            
            <div>
              <strong>Firestore:</strong>
              <div className="ml-2 text-xs">
                {firestoreStatus ? (
                  <>
                    Status: {firestoreStatus.isConnected ? '✅' : '❌'}<br/>
                    {firestoreStatus.latency && `Latency: ${firestoreStatus.latency}ms`}<br/>
                    {firestoreStatus.error && `Error: ${firestoreStatus.error}`}
                  </>
                ) : (
                  'Testing...'
                )}
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={testFirestoreConnection}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Test Connection
                </button>
                <button
                  onClick={() => {
                    clearChromeFirestoreCache();
                    window.location.reload();
                  }}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  Clear Cache & Reload
                </button>
              </div>
            </div>
            
            <div className="border-t pt-2">
              <strong>Chrome Sorun Giderme:</strong>
              <div className="ml-2 text-xs space-y-1">
                <div>1. Extensions'ları devre dışı bırakın</div>
                <div>2. Incognito mode'da test edin</div>
                <div>3. Site verilerini temizleyin</div>
                <div>4. chrome://flags adresinden experimental features'ı kontrol edin</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
