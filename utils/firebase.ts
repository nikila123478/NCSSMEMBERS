import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
    apiKey: "AIzaSyDhuvF69wKy3R1LyJnmrjrihMYseBxDI5k",
    authDomain: "ncss-294b6.firebaseapp.com",
    projectId: "ncss-294b6",
    storageBucket: "ncss-294b6.firebasestorage.app",
    messagingSenderId: "200544050829",
    appId: "1:200544050829:web:7c40f09a234a71ffa04cc4"
};

// Singleton Pattern (මේකෙන් තමයි සයිට් එක සුදු වෙන එක නවත්තන්නේ)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
