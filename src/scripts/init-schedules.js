const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBu-7XKOGa7zWB99_LMzVq1K3vkG8y8HN8",
  authDomain: "tekne-randevu.firebaseapp.com",
  projectId: "tekne-randevu",
  storageBucket: "tekne-randevu.firebasestorage.app",
  messagingSenderId: "794993627609",
  appId: "1:794993627609:web:0bbff7d9f29c9ad2af6b1f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Yerel tarih formatı için yardımcı fonksiyon
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initSchedules = async () => {
  try {
    console.log('🕐 Varsayılan saat ayarları başlatılıyor...');

    // Varsayılan çalışma saatleri
    const defaultSchedule = {
      times: ['07:00-13:00', '14:00-20:00'],
      description: 'Varsayılan çalışma saatleri',
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'settings', 'availableTimes'), defaultSchedule);

    // Örnek özel gün (bugün + 7 gün)
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    const futureDateStr = formatLocalDate(futureDate);

    const customSchedule = {
      date: futureDateStr,
      timeSlots: [
        { id: 'morning', start: '08:00', end: '14:00' },
        { id: 'afternoon', start: '15:00', end: '21:00' },
        { id: 'evening', start: '19:00', end: '22:00' }
      ],
      isCustom: true,
      description: 'Örnek özel gün - 3 seans',
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'schedules', futureDateStr), customSchedule);

    // Hafta sonu özel saatleri (bu hafta sonu)
    const weekend = new Date(today);
    weekend.setDate(today.getDate() + (6 - today.getDay())); // Bu cumartesi
    const weekendStr = formatLocalDate(weekend);

    const weekendSchedule = {
      date: weekendStr,
      timeSlots: [
        { id: 'morning', start: '09:00', end: '15:00' },
        { id: 'afternoon', start: '16:00', end: '22:00' }
      ],
      isCustom: true,
      description: 'Hafta sonu özel saatleri',
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'schedules', weekendStr), weekendSchedule);

    console.log('✅ Saat ayarları başarıyla oluşturuldu!');
    console.log(`📅 Varsayılan saatler: ${defaultSchedule.times.join(', ')}`);
    console.log(`🎯 Özel gün örneği: ${futureDateStr} (3 seans)`);
    console.log(`🎉 Hafta sonu örneği: ${weekendStr} (2 seans)`);
    console.log('');
    console.log('🚀 Admin panelde /admin/schedule adresinden saatleri yönetebilirsiniz!');

  } catch (error) {
    console.error('❌ Hata:', error);
    console.log('');
    console.log('💡 Firebase Security Rules kontrol edin:');
    console.log('   - Firestore > Rules');
    console.log('   - "schedules" koleksiyonuna yazma izni verin');
    console.log('   - "settings" koleksiyonuna yazma izni verin');
  }
};

// Script çalıştır
initSchedules().then(() => {
  console.log('🏁 Script tamamlandı');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
}); 