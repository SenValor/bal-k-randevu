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

async function updateSecondBoatLocation() {
  try {
    console.log('🔄 2. Teknenin konum bilgisi güncelleniyor...');

    // Mevcut tekneleri çek
    const boatsSnapshot = await getDocs(collection(db, 'boats'));
    
    for (const boatDoc of boatsSnapshot.docs) {
      const boatData = boatDoc.data();
      const boatName = boatData.name;
      
      console.log(`\n🔍 ${boatName} kontrol ediliyor...`);
      
      // 2. Tekneyi bul (ismi "2. Tekne" veya benzer olanı)
      if (boatName.includes('2') || boatName.toLowerCase().includes('deniz') || boatName.toLowerCase().includes('ikinci')) {
        console.log(`📍 ${boatName} için yeni konum bilgisi ekleniyor...`);
        
        const newLocation = {
          name: "2. Tekne Kalkış Noktası",
          address: "41°09'42.5\"N 29°02'51.2\"E",
          coordinates: {
            latitude: 41.161793,
            longitude: 29.047543
          },
          googleMapsUrl: "https://maps.app.goo.gl/w9ns57QT6rCAeHF19",
          directions: "2. tekne için özel kalkış noktası. Detaylı ulaşım bilgisi için bizimle iletişime geçebilirsiniz."
        };
        
        await updateDoc(doc(db, 'boats', boatDoc.id), {
          location: newLocation,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${boatName} başarıyla güncellendi!`);
        console.log(`📍 Yeni Google Maps: ${newLocation.googleMapsUrl}`);
        console.log(`🗺️ Koordinatlar: ${newLocation.coordinates.latitude}, ${newLocation.coordinates.longitude}`);
      } else if (boatName.includes('1') || boatName.toLowerCase().includes('balik') || boatName.toLowerCase().includes('birinci')) {
        console.log(`📍 ${boatName} için 1. tekne konum bilgisi kontrol ediliyor...`);
        
        const firstBoatLocation = {
          name: "Eyüp Odabaşı Sporcular Parkı - İskele",
          address: "Sarıyer/İstanbul",
          coordinates: {
            latitude: 41.1675,
            longitude: 29.0488
          },
          googleMapsUrl: "https://maps.app.goo.gl/fVPxCBB9JphkEMBH7",
          directions: "Metro ile Eyüpsultan durağından veya otobüsle kolayca ulaşabilirsiniz."
        };
        
        await updateDoc(doc(db, 'boats', boatDoc.id), {
          location: firstBoatLocation,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${boatName} (1. tekne) konum bilgisi de güncellendi`);
      }
    }

    console.log('\n🎉 Tekne konum bilgileri başarıyla güncellendi!');
    console.log('\n📋 Güncel Durumu:');
    console.log('• 1. Tekne: Eyüp Odabaşı Sporcular Parkı');
    console.log('• 2. Tekne: https://maps.app.goo.gl/w9ns57QT6rCAeHF19');
    console.log('\n💡 Artık 2. teknedeki rezervasyonlarda yeni konum gösterilecek!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
updateSecondBoatLocation();
