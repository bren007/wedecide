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
export async function getAuthenticatedUser(
  sessionCookie: string | undefined
): Promise<AuthResult> {
  console.log(`AGENT (getAuthenticatedUser): Received session cookie value. Has value: ${!!sessionCookie}`);
  if (!sessionCookie) {
    // Log the detailed error on the server for diagnostics
    console.error(
      'getAuthenticatedUser error: No session cookie was provided to the function.'
    );
    // Throw a generic error to the client
    throw new Error('Authentication session cookie not found.');
  }

  const { auth, db } = initializeAdmin();

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      throw new Error(`User profile not found in database for UID: ${decodedToken.uid}.`);
    }
    const userProfile = userDoc.data() as UserProfile;

    // This constructs a user object that is compatible with what the client-side
    // expects, even though we are on the server.
    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      isAnonymous: false,
      tenantId: userProfile.tenantId, // From custom claims
      providerData: [], // Not available server-side
      metadata: {}, // Not available server-side
      profile: userProfile, // The full user profile from Firestore
      getIdToken: async () => sessionCookie,
      getIdTokenResult: async () => ({
        token: sessionCookie,
        claims: decodedToken,
        authTime: '',
        issuedAtTime: '',
        expirationTime: '',
        signInProvider: null,
        signInSecondFactor: null,
      }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({ ...decodedToken }),
    };

    return { user, decodedToken };
  } catch (error: any) {
    // Log the detailed error on the server for diagnostics
    console.error(
      'Could not verify session cookie. User is not authenticated.',
      error.message
    );
    // Throw a generic error to the client
    throw new Error('Authentication failed. Please log in again.');
  }
}
