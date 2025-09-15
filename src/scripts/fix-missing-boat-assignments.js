const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Firebase config (değerler gerçek projenizden alınmalı)
const firebaseConfig = {
  // Buraya firebase config'inizi ekleyin
  // Bu script'i çalıştırmadan önce firebase config'i güncelleyin
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMissingBoatAssignments() {
  console.log('🔧 Eksik tekne atamaları düzeltiliyor...');
  
  try {
    // Önce tekneleri çek
    const boatsSnapshot = await getDocs(collection(db, 'boats'));
    const boats = [];
    boatsSnapshot.forEach((doc) => {
      boats.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    
    // Tekneleri tarihe göre sırala (ilk eklenen = T1)
    boats.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (boats.length === 0) {
      console.log('❌ Hiç tekne bulunamadı!');
      return;
    }
    
    const defaultBoat = boats[0]; // İlk tekne = T1
    console.log(`📍 Varsayılan tekne: ${defaultBoat.name} (${defaultBoat.id})`);
    
    // selectedBoat alanı olmayan rezervasyonları bul
    const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
    const reservationsToUpdate = [];
    
    reservationsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.selectedBoat) {
        reservationsToUpdate.push({
          id: docSnapshot.id,
          data: data
        });
      }
    });
    
    console.log(`🔍 ${reservationsToUpdate.length} rezervasyon güncellenmesi gerekiyor.`);
    
    if (reservationsToUpdate.length === 0) {
      console.log('✅ Tüm rezervasyonlarda tekne ataması mevcut.');
      return;
    }
    
    // Rezervasyonları güncelle
    let updatedCount = 0;
    for (const reservation of reservationsToUpdate) {
      try {
        // Koltuk kodlarını da güncelle (T1_ prefix ekle)
        let updatedSeats = reservation.data.selectedSeats || [];
        if (updatedSeats.length > 0) {
          updatedSeats = updatedSeats.map(seat => {
            // Eğer zaten prefix varsa dokunma
            if (seat.includes('_')) {
              return seat;
            }
            // Prefix yoksa T1_ ekle
            return `T1_${seat}`;
          });
        }
        
        await updateDoc(doc(db, 'reservations', reservation.id), {
          selectedBoat: defaultBoat.id,
          boatName: defaultBoat.name,
          selectedSeats: updatedSeats,
          updatedAt: new Date().toISOString(),
          fixedByScript: true
        });
        
        updatedCount++;
        console.log(`✅ Rezervasyon ${reservation.id} güncellendi (${reservation.data.reservationNumber})`);
      } catch (error) {
        console.error(`❌ Rezervasyon ${reservation.id} güncellenirken hata:`, error);
      }
    }
    
    console.log(`🎉 Toplam ${updatedCount} rezervasyon başarıyla güncellendi!`);
    console.log(`📋 Özet:`);
    console.log(`   - Tekne ataması: ${defaultBoat.name} (T1)`);
    console.log(`   - Koltuk kodları: T1_ prefix'i eklendi`);
    console.log(`   - Güncelleme zamanı: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Script çalıştırılırken hata oluştu:', error);
  }
}

// Script'i çalıştır
fixMissingBoatAssignments()
  .then(() => {
    console.log('🏁 Script tamamlandı.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script başarısız:', error);
    process.exit(1);
  });

