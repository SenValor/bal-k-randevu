const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Firebase konfigürasyonu - Gerçek değerlerle güncelleyin
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

// Teknelerin konum bilgileri
const boatLocations = {
  "1. Tekne": {
    name: "Eyüp Odabaşı Sporcular Parkı - İskele",
    address: "Eyüp Odabaşı Sporcular Parkı, Sarıyer/İstanbul", 
    coordinates: {
      latitude: 41.1675,
      longitude: 29.0488
    },
    googleMapsUrl: "https://maps.app.goo.gl/fVPxCBB9JphkEMBH7",
    directions: "Metro ile Eyüpsultan durağından veya otobüsle kolayca ulaşabilirsiniz. Park içinde otopark da mevcut. Yakında özel otopark bulunmakta ve civar sokaklarda park yerleri mevcut."
  },
  "2. Tekne": {
    name: "2. Tekne Kalkış Noktası",
    address: "İstanbul", // Tam adresi eklenecek
    coordinates: {
      latitude: 41.161793,
      longitude: 29.047543
    },
    googleMapsUrl: "", // Eklenecek
    directions: "Detaylı ulaşım bilgisi için bizimle iletişime geçebilirsiniz."
  }
};

async function addBoatLocations() {
  try {
    console.log('🚀 Teknelere konum bilgileri ekleniyor...');

    // Mevcut tekneleri çek
    const boatsSnapshot = await getDocs(collection(db, 'boats'));
    
    for (const boatDoc of boatsSnapshot.docs) {
      const boatData = boatDoc.data();
      const boatName = boatData.name;
      
      console.log(`\n📍 ${boatName} için konum bilgisi kontrol ediliyor...`);
      
      // Bu tekne için konum bilgisi var mı?
      const locationData = boatLocations[boatName];
      
      if (locationData) {
        // Konum bilgisini güncelle
        await updateDoc(doc(db, 'boats', boatDoc.id), {
          location: locationData,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${boatName} konum bilgisi eklendi:`);
        console.log(`   📍 Konum: ${locationData.name}`);
        console.log(`   📧 Adres: ${locationData.address}`);
        console.log(`   🗺️ Koordinatlar: ${locationData.coordinates.latitude}, ${locationData.coordinates.longitude}`);
        
        if (locationData.googleMapsUrl) {
          console.log(`   🔗 Maps: ${locationData.googleMapsUrl}`);
        }
        
        console.log(`   🚗 Ulaşım: ${locationData.directions}`);
      } else {
        console.log(`⚠️ ${boatName} için konum bilgisi bulunamadı, atlanıyor...`);
      }
    }

    console.log('\n🎉 Konum bilgileri başarıyla eklendi!');
    console.log('\n📋 Eklenen Bilgiler:');
    console.log('• 1. Tekne: Eyüp Odabaşı Sporcular Parkı (41.1675, 29.0488)');
    console.log('• 2. Tekne: Yeni Konum (41.161793, 29.047543)');
    console.log('\n💡 Admin panelinden tekneleri düzenleyerek konum bilgilerini güncelleyebilirsiniz.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
addBoatLocations();
