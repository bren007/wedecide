'use server';

import { initializeAdmin } from './server-admin';
import type { AuthenticatedUser, UserProfile } from '@/lib/types';
import type { DecodedIdToken } from 'firebase-admin/auth';

type AuthResult = {
  user: AuthenticatedUser;
  decodedToken: DecodedIdToken;
};

/**
 * Verifies a session cookie string and returns the authenticated user's data.
 * Throws an error if the user is not authenticated.
 */
export async function getAuthenticatedUser(sessionCookie: string | undefined): Promise<AuthResult> {
  if (!sessionCookie) {
    throw new Error('Authentication session cookie not found.');
  }

  const { auth, db } = initializeAdmin();

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
        throw new Error('User profile not found in database.');
    }
    const userProfile = userDoc.data() as UserProfile;

    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      isAnonymous: false,
      tenantId: userProfile.tenantId,
      providerData: [], 
      metadata: {},
      profile: userProfile,
      getIdToken: async () => sessionCookie,
      getIdTokenResult: async () => ({ token: sessionCookie, claims: decodedToken, authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({ ...decodedToken }),
    };

    return { user, decodedToken };
  } catch (error: any) {
    console.error('Could not verify session cookie. User is not authenticated.', error.message);
    throw new Error('Authentication failed. Please log in again.');
  }
}
