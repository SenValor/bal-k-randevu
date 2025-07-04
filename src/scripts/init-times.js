// Firebase'e varsayılan saat dilimlerini kaydetmek için script
// Node.js ile çalıştırılabilir: node src/scripts/init-times.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCFlrUHTuU9n4_nW1yQFjWXHAz5xaTD9NM",
  authDomain: "tekne-randevu.firebaseapp.com",
  projectId: "tekne-randevu",
  storageBucket: "tekne-randevu.firebasestorage.app",
  messagingSenderId: "162410073718",
  appId: "1:162410073718:web:c2399e4ba13a624422d957",
  measurementId: "G-RHLNMLC4BW"
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