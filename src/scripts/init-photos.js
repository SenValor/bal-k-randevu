// Firebase'e fotoğraf ayarlarını başlatma scripti
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

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializePhotos() {
  try {
    console.log('🖼️ Fotoğraf ayarları Firebase\'e kaydediliyor...');
    
    // Boş fotoğraf listesi oluştur (admin sonradan fotoğraf ekleyecek)
    await setDoc(doc(db, 'settings', 'boatPhotos'), {
      photos: [], // Başlangıçta boş - admin panelinden fotoğraf eklenecek
      updatedAt: new Date(),
      updatedBy: 'system',
      note: 'Admin panelinden fotoğraf ekleyebilirsiniz'
    });
    
    console.log('✅ Fotoğraf ayarları başarıyla oluşturuldu!');
    console.log('📝 Admin panelinden "Fotoğraflar" sekmesine giderek fotoğraf ekleyebilirsiniz.');
    console.log('🎯 Önerilen fotoğraf boyutu: 800x600 piksel veya daha büyük');
    console.log('📁 Desteklenen formatlar: JPG, PNG, WEBP');
    console.log('📏 Maksimum dosya boyutu: 5MB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fotoğraf ayarları oluşturulamadı:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
initializePhotos(); 