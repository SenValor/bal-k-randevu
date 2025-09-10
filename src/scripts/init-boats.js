const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyBvPQmhqnwI3lfTbqmz6hbdnbPnLHOFKOo",
  authDomain: "balik-sefasi-2b5e7.firebaseapp.com",
  projectId: "balik-sefasi-2b5e7",
  storageBucket: "balik-sefasi-2b5e7.firebasestorage.app",
  messagingSenderId: "1089508901654",
  appId: "1:1089508901654:web:f7d9e7b4e7e3d3e2d9e3d3",
  measurementId: "G-XXXXXXXXXX"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Başlangıç tekneleri
const initialBoats = [
  {
    name: '1. Tekne',
    description: 'Geleneksel tekli koltuk düzeni ile konforlu seyahat',
    imageUrl: '/tekne-gorseller/tekne-1.jpg', // Mevcut fotoğraf
    capacity: 12,
    seatingLayout: 'single',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '2. Tekne',
    description: 'Modern çiftli koltuk düzeni ile rahat oturma',
    imageUrl: '/tekne-gorseller/tekne-2.jpg', // Mevcut fotoğraf
    capacity: 12,
    seatingLayout: 'double',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function initializeBoats() {
  try {
    console.log('🚀 Tekneler Firebase\'e ekleniyor...');

    for (const boat of initialBoats) {
      const docRef = await addDoc(collection(db, 'boats'), boat);
      console.log(`✅ ${boat.name} eklendi (ID: ${docRef.id})`);
    }

    console.log('🎉 Tüm tekneler başarıyla eklendi!');
    console.log('');
    console.log('📋 Eklenen Tekneler:');
    initialBoats.forEach((boat, index) => {
      console.log(`${index + 1}. ${boat.name}`);
      console.log(`   - Açıklama: ${boat.description}`);
      console.log(`   - Kapasite: ${boat.capacity} kişi`);
      console.log(`   - Oturma Düzeni: ${boat.seatingLayout === 'single' ? 'Tekli' : 'Çiftli'}`);
      console.log(`   - Fotoğraf: ${boat.imageUrl}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
initializeBoats();
