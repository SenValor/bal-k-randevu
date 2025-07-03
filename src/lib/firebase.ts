// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFlrUHTuU9n4_nW1yQFjWXHAz5xaTD9NM",
  authDomain: "tekne-randevu.firebaseapp.com",
  projectId: "tekne-randevu",
  storageBucket: "tekne-randevu.firebasestorage.app",
  messagingSenderId: "162410073718",
  appId: "1:162410073718:web:c2399e4ba13a624422d957",
  measurementId: "G-RHLNMLC4BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in client-side and if supported
export const analytics = typeof window !== 'undefined' ? 
  isSupported().then(yes => yes ? getAnalytics(app) : null) : 
  null;

export default app; 