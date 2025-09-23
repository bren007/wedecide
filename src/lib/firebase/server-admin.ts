import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

// This function initializes the Firebase Admin SDK.
// It's a singleton pattern to avoid re-initializing the app on every hot-reload.
export function initializeAdmin() {
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } else {
    adminApp = getApp();
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
  return { app: adminApp, auth: adminAuth, db: adminDb };
}
