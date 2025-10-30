import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBN_6RxYW4n6QFKiHgH55hStVnqWByVo4o",
  authDomain: "baliksefasi-developer.firebaseapp.com",
  projectId: "baliksefasi-developer",
  storageBucket: "baliksefasi-developer.firebasestorage.app",
  messagingSenderId: "384661071715",
  appId: "1:384661071715:web:f8b33eab74c4e4c23f1556",
  measurementId: "G-DZPKW8097G"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  // Firestore offline persistence ayarları
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}

export { app, db, auth, storage, analytics };
