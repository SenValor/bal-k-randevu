// Firebase'e varsayılan saat dilimlerini kaydetmek için script
// Node.js ile çalıştırılabilir: node src/scripts/init-times.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config - firebase.ts'den güncellenmiş
const firebaseConfig = {
  apiKey: "AIzaSyBqf2A1Imd_9IqCSNp2zyedYQBKyYNPNTc",
  authDomain: "balik-sefasi.firebaseapp.com",
  projectId: "balik-sefasi",
  storageBucket: "balik-sefasi.firebasestorage.app",
  messagingSenderId: "903043505535",
  appId: "1:903043505535:web:583c2e8886c718f6a10e4a",
  measurementId: "G-0WE5C1CJHE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeAvailableTimes() {
  const defaultTimes = ['07:00-13:00', '14:00-20:00'];
  
  try {
    await setDoc(doc(db, 'settings', 'availableTimes'), {
      times: defaultTimes,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'system'
    });
    
    console.log('✅ Varsayılan saat dilimleri başarıyla oluşturuldu!');
    console.log('Saatler:', defaultTimes);
    console.log('📍 Konum: settings/availableTimes');
  } catch (error) {
    console.error('❌ Saat dilimleri oluşturulamadı:', error);
  }
}

initializeAvailableTimes(); 