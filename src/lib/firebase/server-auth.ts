import type { NextRequest } from 'next/server';
import { initializeAdmin } from './server-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import type { AuthenticatedUser } from '../types';

type AuthResult = {
  user: AuthenticatedUser | null;
  decodedToken: DecodedIdToken | null;
};

// This function gets the authenticated user from the request cookies.
// It's designed to be used in server-side components and middleware.
export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthResult> {
  const { auth } = initializeAdmin();
  const session = req ? req.cookies.get('session')?.value : cookies().get('session')?.value;

  if (!session) {
    return { user: null, decodedToken: null };
  }

  try {
    const decodedToken = await auth.verifySessionCookie(session, true);
    
    // The decoded token itself doesn't contain all user profile info like displayName.
    // We combine the basic info from the token with the custom claims (profile).
    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      // The rest of the Firebase User properties are not available server-side without extra lookups.
      // We fill in what we can.
      emailVerified: decodedToken.email_verified || false,
      isAnonymous: decodedToken.is_anonymous || false,
      tenantId: decodedToken.tenant || null,
      providerData: [], // Not available from session cookie
      metadata: {}, // Not available
      // Here we attach the custom claims as the user's profile
      profile: {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || '',
          role: decodedToken.role || 'member',
          tenantId: decodedToken.tenantId || '',
          createdAt: '', // Not available in token
      },
      // Dummy implementations for methods
      getIdToken: async () => session,
      getIdTokenResult: async () => ({ token: session, claims: decodedToken, authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({ ...decodedToken }),
    };

    return { user, decodedToken };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return { user: null, decodedToken: null };
  }
}
