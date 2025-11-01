// 🔄 Cache Temizleme Script'i
// Bu script kullanıcıların eski cache'lerini temizler

(function() {
  'use strict';
  
  console.log('🔄 Cache temizleme script\'i çalışıyor...');
  
  // Service Worker'ları temizle
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister().then(function(success) {
          if (success) {
            console.log('✅ Service Worker temizlendi:', registration.scope);
          }
        });
      }
    });
  }
  
  // Cache Storage'ı temizle
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name).then(function(success) {
          if (success) {
            console.log('✅ Cache temizlendi:', name);
          }
        });
      });
    });
  }
  
  // localStorage'dan eski version bilgilerini temizle
  try {
    const oldKeys = ['tourTypes', 'priceVersion', 'lastPriceUpdate'];
    oldKeys.forEach(function(key) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log('✅ localStorage temizlendi:', key);
      }
    });
  } catch (e) {
    console.warn('⚠️ localStorage temizlenemedi:', e);
  }
  
  console.log('✅ Cache temizleme tamamlandı!');
})();
