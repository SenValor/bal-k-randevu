// Firebase'e fotoğraf ayarlarını başlatma scripti
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCFlrUHTuU9n4_nW1yQFjWXHAz5xaTD9NM",
  authDomain: "tekne-randevu.firebaseapp.com",
  projectId: "tekne-randevu",
  storageBucket: "tekne-randevu.firebasestorage.app",
  messagingSenderId: "162410073718",
  appId: "1:162410073718:web:c2399e4ba13a624422d957",
  measurementId: "G-RHLNMLC4BW"
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