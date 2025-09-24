'use server';

import { initializeAdmin } from './server-admin';
import type { AuthenticatedUser, UserProfile } from '@/lib/types';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

type AuthResult = {
  user: AuthenticatedUser | null;
  decodedToken: DecodedIdToken | null;
};

// This function gets the authenticated user from a session cookie value.
// It's designed to be used in server-side components and server actions.
export async function getAuthenticatedUser(sessionCookie: string): Promise<AuthResult> {
  const { auth } = initializeAdmin();

  if (!sessionCookie) {
    return { user: null, decodedToken: null };
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    const userProfile: UserProfile = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        role: decodedToken.role || 'member', // Default to 'member' if not set
        tenantId: decodedToken.tenantId || '',
        createdAt: '', // Not available in token
    };

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
  } catch (error) {
    console.warn('Could not verify session cookie. User is not authenticated.', error);
    return { user: null, decodedToken: null };
  }
}
