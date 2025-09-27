// Chrome Firebase bağlantı sorunları için hızlı çözüm

export const handleChromeFirebaseError = (error: any) => {
  console.error('🔴 Chrome Firebase Error:', error);
  
  if (error?.code === 'permission-denied' || 
      error?.message?.includes('Missing or insufficient permissions')) {
    
    // Kullanıcıya basit uyarı göster
    if (typeof window !== 'undefined' && typeof alert !== 'undefined') {
      setTimeout(() => {
        const userConfirm = confirm(
          '🔄 Chrome Bağlantı Sorunu\n\n' +
          'Firebase verileri yüklenirken sorun oluştu.\n' +
          'Sayfayı yenilemek ister misiniz?\n\n' +
          '(Bu sorun Chrome tarayıcısında geçici olarak görülebilir)'
        );
        
        if (userConfirm) {
          window.location.reload();
        }
      }, 1000);
    }
    
    return true; // Hata işlendi
  }
  
  return false; // Hata işlenmedi
};

export const chromeFirebaseRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Chrome Firebase işlemi (deneme ${attempt}/${maxRetries})`);
      return await operation();
    } catch (error: any) {
      console.warn(`❌ Chrome Firebase hatası (deneme ${attempt}):`, error.code || error.message);
      
      if (attempt === maxRetries) {
        handleChromeFirebaseError(error);
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ ${delay}ms bekleyip tekrar denenecek...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
