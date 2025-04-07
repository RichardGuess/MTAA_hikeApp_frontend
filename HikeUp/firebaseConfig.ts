// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXP8mgkmaLkvUYZliVZC-kLD7cDaYX-R0",
  authDomain: "hikeapp-mtaa.firebaseapp.com",
  projectId: "hikeapp-mtaa",
  storageBucket: "hikeapp-mtaa.firebasestorage.app",
  messagingSenderId: "938836830099",
  appId: "1:938836830099:android:58d7d47d9027f1513f6a66"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
