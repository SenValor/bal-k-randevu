// Chrome Firebase debug helper

export const logChromeFirebaseDebug = (operation: string, data?: any) => {
  if (typeof window === 'undefined') return;
  
  const isChrome = navigator.userAgent.includes('Chrome');
  const timestamp = new Date().toLocaleTimeString();
  
  console.group(`🔍 Chrome Firebase Debug - ${operation} (${timestamp})`);
  console.log('Browser:', isChrome ? '✅ Chrome' : '❌ Other');
  console.log('User Agent:', navigator.userAgent);
  console.log('Online Status:', navigator.onLine ? '✅ Online' : '❌ Offline');
  
  if (data) {
    console.log('Data:', data);
  }
  
  // Firebase connection status
  if ((window as any).firebaseTimeout) {
    console.log('Firebase Timeout:', (window as any).firebaseTimeout);
  }
  
  console.groupEnd();
};

export const checkChromeFirebasePermissions = async () => {
  console.log('🔍 Chrome Firebase Permissions Check');
  
  try {
    // Test basic Firebase connection
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    console.log('📡 Testing Firebase connection...');
    
    // Test settings access
    const testDoc = await getDoc(doc(db, 'settings', 'general'));
    console.log('✅ Settings access:', testDoc.exists() ? 'OK' : 'Empty');
    
    // Test boats access
    const boatsDoc = await getDoc(doc(db, 'boats', 'test'));
    console.log('✅ Boats access:', 'OK (no error)');
    
    // Test boatSchedules access
    const scheduleDoc = await getDoc(doc(db, 'boatSchedules', 'test'));
    console.log('✅ BoatSchedules access:', 'OK (no error)');
    
    return true;
  } catch (error: any) {
    console.error('❌ Firebase permission test failed:', error);
    
    if (error?.code === 'permission-denied') {
      console.error('🚫 Permission denied - check Firebase rules');
    }
    
    return false;
  }
};

export const showChromeFirebaseStatus = () => {
  if (typeof window === 'undefined') return;
  
  const status = {
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
    online: navigator.onLine,
    localStorage: typeof localStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    firebaseTimeout: (window as any).firebaseTimeout || 'Not set'
  };
  
  console.table(status);
  return status;
};
