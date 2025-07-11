// Firebase'e admin kullanıcısı eklemek için script
// Node.js ile çalıştırılabilir: node src/scripts/init-admin.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
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
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = 'admin@baliksefasi.com';
  const password = 'admin123';
  
  try {
    // Firebase Authentication'da kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestore'da kullanıcı bilgilerini sakla (isteğe bağlı)
    await setDoc(doc(db, 'admin_profiles', user.uid), {
      email: email,
      role: 'super_admin',
      name: 'Admin User',
      active: true,
      createdAt: new Date()
    });
    
    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('Email: admin@baliksefasi.com');
    console.log('Şifre: admin123');
    console.log('UID:', user.uid);
  } catch (error) {
    console.error('❌ Admin kullanıcısı oluşturulamadı:', error);
    
    // Daha detaylı hata mesajları
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Bu email adresi zaten kullanımda!');
    } else if (error.code === 'auth/weak-password') {
      console.log('⚠️ Şifre çok zayıf!');
    } else if (error.code === 'auth/invalid-email') {
      console.log('⚠️ Geçersiz email adresi!');
    }
  }
}

createAdminUser(); 