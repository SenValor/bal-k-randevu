// Chrome için özel bildirim sistemi

export const showChromeNotification = (type: 'error' | 'warning' | 'success' | 'info', message: string, details?: string) => {
  if (typeof window === 'undefined') return;

  const colors = {
    error: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
    warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    success: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
    info: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }
  };

  const icons = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️'
  };

  const color = colors[type];
  const icon = icons[type];

  // Mevcut bildirimleri temizle
  const existingNotifications = document.querySelectorAll('.chrome-notification');
  existingNotifications.forEach(n => n.remove());

  const notification = document.createElement('div');
  notification.className = 'chrome-notification';
  notification.innerHTML = `
    <div style="
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: ${color.bg}; 
      border: 2px solid ${color.border}; 
      color: ${color.text}; 
      padding: 16px 20px; 
      border-radius: 12px; 
      z-index: 9999; 
      font-size: 14px; 
      max-width: 350px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="font-size: 18px; flex-shrink: 0;">${icon}</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">${message}</div>
          ${details ? `<div style="font-size: 12px; opacity: 0.8;">${details}</div>` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="
                  background: none; 
                  border: none; 
                  color: ${color.text}; 
                  font-size: 18px; 
                  cursor: pointer; 
                  padding: 0; 
                  margin-left: auto;
                  opacity: 0.7;
                  line-height: 1;
                ">×</button>
      </div>
    </div>
  `;

  // CSS animasyon ekle
  if (!document.querySelector('#chrome-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'chrome-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // 8 saniye sonra otomatik kaldır
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 8000);
};

export const showFirebaseError = (error: any) => {
  console.error('🔴 Firebase Error:', error);
  
  if (error?.code === 'permission-denied' || 
      error?.message?.includes('Missing or insufficient permissions')) {
    
    showChromeNotification(
      'warning',
      'Chrome Bağlantı Sorunu',
      'Firebase verileri yüklenirken sorun oluştu. Sayfa yenileniyor...'
    );
    
    // 3 saniye sonra sayfayı yenile
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } else if (error?.code === 'unavailable') {
    showChromeNotification(
      'error',
      'Bağlantı Hatası',
      'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
    );
  } else {
    showChromeNotification(
      'error',
      'Beklenmeyen Hata',
      'Bir sorun oluştu. Lütfen sayfayı yenileyin.'
    );
  }
};

export const showChromeSuccess = (message: string) => {
  showChromeNotification('success', message);
};

export const showChromeWarning = (message: string, details?: string) => {
  showChromeNotification('warning', message, details);
};
