
import type { NextRequest } from 'next/server';
import { initializeAdmin } from './server-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AuthenticatedUser, UserProfile } from '../types';

type AuthResult = {
  user: AuthenticatedUser | null;
  decodedToken: DecodedIdToken | null;
};

// This is a separate auth function specifically for usage in Next.js middleware.
// It directly uses the `request` object, which is not available in Server Actions.
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  const { auth } = initializeAdmin();
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return { user: null, decodedToken: null };
  }

  try {
    const decodedToken = await auth.verifySessionCookie(session, true);
    
    const userProfile: UserProfile = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        role: decodedToken.role || 'member',
        tenantId: decodedToken.tenantId || '',
        createdAt: '',
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
      getIdToken: async () => session,
      getIdTokenResult: async () => ({ token: session, claims: decodedToken, authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({ ...decodedToken }),
    };

    return { user, decodedToken };
  } catch (error) {
    console.warn('Could not verify session cookie in middleware.', error);
    return { user: null, decodedToken: null };
  }
}
