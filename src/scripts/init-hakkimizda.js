// Firebase'e hakkımızda verilerini eklemek için script
// Node.js ile çalıştırılabilir: node src/scripts/init-hakkimizda.js

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

const defaultQuestionsAnswers = [
  {
    id: '1',
    question: 'Nereden Kalkıyoruz?',
    answer: 'Turlarımız Eyüp Odabaşı Sporcular Parkı\'ndan başlıyor. Metro ile Eyüpsultan durağından veya otobüsle kolayca ulaşabilirsiniz. Park içinde otopark da mevcut.',
    emoji: '🚤',
    color: 'blue-700',
    order: 1
  },
  {
    id: '2',
    question: 'Nereye Gidiyoruz?',
    answer: 'İstanbul Boğazı\'nın en bereketli balık noktalarına gidiyoruz. Rumeli Kavağı, Anadolu Kavağı ve Fatih Sultan Mehmet Köprüsü çevresindeki balık zengini alanları geziyoruz.',
    emoji: '🗺️',
    color: 'green-700',
    order: 2
  },
  {
    id: '3',
    question: 'Hangi Balıklar Tutuluyor?',
    answer: 'Mevsime göre çipura, levrek, lüfer, palamut, istavrit, mezgit, barbunya ve daha birçok tür balık yakalama şansınız var. İlkbaharda çipura ve levrek, yazın lüfer ve palamut, sonbaharda barbunya bollaşır.',
    emoji: '🐟',
    color: 'orange-700',
    order: 3
  },
  {
    id: '4',
    question: 'Tur Ne Kadar Sürüyor?',
    answer: 'Normal turlarımız 6 saat sürüyor. Sabah turu 07:00-13:00, öğleden sonra turu 14:00-20:00 saatleri arasında. Özel turlar için istediğiniz saatleri belirleyebilirsiniz.',
    emoji: '⏰',
    color: 'purple-700',
    order: 4
  },
  {
    id: '5',
    question: 'Neler İkram Ediliyor?',
    answer: 'Teknede soğuk içecekler ikram ediyoruz. Çay, kahve ve meşrubat mevcut. Kendi yiyecek ve içeceklerinizi de getirebilirsiniz. Teknede buz dolabı bulunuyor.',
    emoji: '☕',
    color: 'red-700',
    order: 5
  },
  {
    id: '6',
    question: 'Oltam Yoksa Ne Olur?',
    answer: 'Hiç sorun değil! +150 TL ek ücretle olta ve tüm balık avı takımını biz sağlıyoruz. Kaliteli oltalar, ipler, yemler ve çeşitli iğneler dahil. Deneyimli misafirler kendi ekipmanlarını da getirebilir.',
    emoji: '🎣',
    color: 'indigo-700',
    order: 6
  },
  {
    id: '7',
    question: 'Finalde Ne Yapılıyor?',
    answer: 'Tur sonunda avladığınız balıkları temizleyip paketliyoruz. Balıklarınızı eve götürebilir, ailenizle paylaşabilirsiniz. Ayrıca hatıra fotoğrafları çekiyoruz.',
    emoji: '🏁',
    color: 'teal-700',
    order: 7
  },
  {
    id: '8',
    question: 'Güvenlik Nasıl?',
    answer: 'Lisanslı kaptan ve 15+ yıl deneyimli ekibimiz var. Teknede can yelekleri, cankurtaran simidi ve modern güvenlik ekipmanları bulunuyor. Sigortalı ve lisanslı tekne ile güvenliğiniz garantimiz altında.',
    emoji: '🛟',
    color: 'pink-700',
    order: 8
  },
  {
    id: '9',
    question: 'Ne Getirmeli?',
    answer: 'Güneş kremi, şapka, güneş gözlüğü getirin. Yedek kıyafet, havlu ve kendi yiyecek/içeceklerinizi de getirebilirsiniz. Tekne güvertesinde yürürken kaymaz ayakkabı tavsiye ediyoruz.',
    emoji: '🎒',
    color: 'amber-700',
    order: 9
  },
  {
    id: '10',
    question: 'Çocuklar Katılabilir Mi?',
    answer: 'Elbette! 0-99 yaş arası herkes katılabilir. Çocuklar için özel can yelekleri ve güvenlik önlemleri alıyoruz. Deneyimli rehberimiz balık avlamayı öğretir.',
    emoji: '👶',
    color: 'cyan-700',
    order: 10
  }
];

async function createHakkimizdaData() {
  try {
    // Firebase'de hakkımızda verisini oluştur
    await setDoc(doc(db, 'settings', 'hakkimizda'), {
      questionsAnswers: defaultQuestionsAnswers,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Hakkımızda verileri başarıyla oluşturuldu!');
    console.log(`📝 ${defaultQuestionsAnswers.length} soru-cevap eklendi`);
    console.log('🔗 Admin panelinden düzenleyebilirsiniz: /admin/hakkimizda');
  } catch (error) {
    console.error('❌ Hakkımızda verileri oluşturulamadı:', error);
  }
}

createHakkimizdaData(); 