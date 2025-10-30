const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Firebase konfigürasyonu
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

async function fixBoatLocationSchema() {
  try {
    console.log('🔧 Tekne konum şemalarını düzeltiliyor...');

    // Mevcut tekneleri çek
    const boatsSnapshot = await getDocs(collection(db, 'boats'));
    
    for (const boatDoc of boatsSnapshot.docs) {
      const boatData = boatDoc.data();
      const boatName = boatData.name;
      
      console.log(`\n🔍 ${boatName} kontrol ediliyor...`);
      
      // Eğer location alanı problematikse, sadece gerekli alanları güncelleyelim
      const updateData = {
        updatedAt: new Date()
      };
      
      // Eğer location alanı varsa ve hatalıysa, kaldır veya düzelt
      if (boatData.location) {
        console.log(`📍 Mevcut location alanı temizleniyor...`);
        // location alanını tamamen kaldır
        updateData.location = null;
      }
      
      try {
        await updateDoc(doc(db, 'boats', boatDoc.id), updateData);
        console.log(`✅ ${boatName} başarıyla temizlendi`);
      } catch (error) {
        console.error(`❌ ${boatName} güncellenirken hata:`, error.message);
      }
    }

    console.log('\n🎉 Tüm teknelerin location alanları temizlendi!');
    console.log('\n💡 Artık admin panelden güvenli şekilde konum bilgilerini ekleyebilirsiniz.');
    console.log('📍 Sadece ihtiyacınız olan alanları (örn: Google Maps linki) doldurun.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Genel hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
fixBoatLocationSchema();
