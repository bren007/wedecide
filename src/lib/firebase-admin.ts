import { initializeApp, getApps, App } from 'firebase-admin/app';

/**
 * A singleton to get the Firebase Admin app instance.
 * This prevents re-initialization on every hot-reload.
 */
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp();
}
