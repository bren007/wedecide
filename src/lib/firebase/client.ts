// This file initializes the Firebase client-side SDK.
// It's safe to expose this configuration publicly.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBjIlzRw068leuDF3GaAxsQe15cm9EiEkA",
  authDomain: "studio-2448447878-1a319.firebaseapp.com",
  projectId: "studio-2448447878-1a319",
  storageBucket: "studio-2448447878-1a319.appspot.com",
  messagingSenderId: "808371723987",
  appId: "1:808371723987:web:cbf026ab6b5c293fbabe26",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
