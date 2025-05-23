// firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCuEeAiUgF09x2H9oYYYrS4GhonYq3bUcY",
  authDomain: "hikeapp-mtaa.firebaseapp.com",
  projectId: "hikeapp-mtaa",
  storageBucket: "hikeapp-mtaa.firebasestorage.app",
  messagingSenderId: "938836830099",
  appId: "1:938836830099:web:baea87d5287d16cc3f6a66",
  measurementId: "G-434KW6Z141"
};

// prevents reinitializing on Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
