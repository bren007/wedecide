
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

// This is a more robust singleton pattern for Firebase Admin initialization.
// It caches the initialized services on a global object to prevent re-initialization
// during Next.js hot-reloads in development, which can cause memory leaks.
const globalForFirebase = globalThis as unknown as {
  app: App | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
};

function getAdminServices() {
    if (globalForFirebase.app) {
        return {
            app: globalForFirebase.app,
            auth: globalForFirebase.auth!,
            db: globalForFirebase.db!,
        };
    }

    const app = getApps().length > 0 ? getApp() : initializeApp({ credential: cert(serviceAccount) });
    const auth = getAuth(app);
    const db = getFirestore(app);

    globalForFirebase.app = app;
    globalForFirebase.auth = auth;
    globalForFirebase.db = db;
    
    return { app, auth, db };
}


export function initializeAdmin() {
  return getAdminServices();
}
