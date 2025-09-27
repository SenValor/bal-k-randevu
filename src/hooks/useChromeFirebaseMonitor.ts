'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FirebaseStatus {
  isConnected: boolean;
  isChrome: boolean;
  connectionQuality: 'good' | 'slow' | 'poor' | 'offline';
  lastCheck: Date;
  errorCount: number;
}

export const useChromeFirebaseMonitor = () => {
  const [status, setStatus] = useState<FirebaseStatus>({
    isConnected: false,
    isChrome: false,
    connectionQuality: 'offline',
    lastCheck: new Date(),
    errorCount: 0
  });

  const checkConnection = async () => {
    const startTime = Date.now();
    
    try {
      // Basit bir Firebase test sorgusu
      const testDoc = await getDoc(doc(db, 'settings', 'general'));
      const responseTime = Date.now() - startTime;
      
      let quality: 'good' | 'slow' | 'poor' = 'good';
      if (responseTime > 3000) quality = 'poor';
      else if (responseTime > 1500) quality = 'slow';
      
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        connectionQuality: quality,
        lastCheck: new Date(),
        errorCount: 0
      }));
      
      console.log(`🟢 Firebase bağlantısı OK (${responseTime}ms)`);
      
    } catch (error: any) {
      console.error('🔴 Firebase bağlantı hatası:', error);
      
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        connectionQuality: 'offline',
        lastCheck: new Date(),
        errorCount: prev.errorCount + 1
      }));
      
      // Chrome'a özel hata analizi
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Chrome Firebase yetki sorunu tespit edildi');
      }
    }
  };

  const retryConnection = async () => {
    console.log('🔄 Firebase bağlantısı yeniden deneniyor...');
    await checkConnection();
  };

  useEffect(() => {
    // Chrome detection
    const isChrome = navigator.userAgent.includes('Chrome');
    setStatus(prev => ({ ...prev, isChrome }));
    
    // İlk bağlantı kontrolü
    checkConnection();
    
    // Periyodik kontrol (Chrome için daha sık)
    const interval = setInterval(checkConnection, isChrome ? 30000 : 60000);
    
    // Sayfa görünürlük değişiminde kontrol
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Online/offline event listeners
    const handleOnline = () => {
      console.log('🌐 İnternet bağlantısı geri geldi');
      setTimeout(checkConnection, 1000);
    };
    
    const handleOffline = () => {
      console.log('📵 İnternet bağlantısı kesildi');
      setStatus(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionQuality: 'offline' 
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    status,
    checkConnection,
    retryConnection,
    isHealthy: status.isConnected && status.connectionQuality !== 'poor'
  };
};
