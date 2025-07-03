// Firebase'e admin kullanıcısı eklemek için script
// Node.js ile çalıştırılabilir: node src/scripts/init-admin.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCFlrUHTuU9n4_nW1yQFjWXHAz5xaTD9NM",
  authDomain: "tekne-randevu.firebaseapp.com",
  projectId: "tekne-randevu",
  storageBucket: "tekne-randevu.firebasestorage.app",
  messagingSenderId: "162410073718",
  appId: "1:162410073718:web:c2399e4ba13a624422d957",
  measurementId: "G-RHLNMLC4BW"
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