'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import type { UserProfile } from '@/lib/types';
import { cookies } from 'next/headers';

/**
 * Creates a session cookie for the authenticated user.
 */
export async function createSession(idToken: string) {
  const { auth } = initializeAdmin();
  if (!idToken) {
    throw new Error('ID token is required.');
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { status: 'success' };
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * This is a one-time server action to "seed" the database with the first user and tenant.
 * In a real B2B application, this would be handled by a secure, internal admin panel.
 * For this prototype, we expose it as a server action triggered by a special login.
 */
export async function seedFirstUser() {
  const { auth, db } = initializeAdmin();

  const seedData = {
    email: 'admin@we-decide.com',
    password: 'password', // For simplicity in the prototype
    displayName: 'Founding Admin',
    tenantId: 'tenant-001',
    tenantName: 'WeDecide Global Corp',
  };
  
  try {
    await auth.getUserByEmail(seedData.email);
    console.log('Seed user already exists. Skipping creation.');
    return;
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') {
      throw error; // Re-throw unexpected errors
    }
  }

  console.log(`Creating user: ${seedData.email}`);
  const userRecord = await auth.createUser({
    email: seedData.email,
    password: seedData.password,
    displayName: seedData.displayName,
  });

  console.log(`Setting custom claims for user: ${userRecord.uid}`);
  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'admin',
    tenantId: seedData.tenantId,
  });

  console.log(`Creating user profile in Firestore for UID: ${userRecord.uid}`);
  const userProfile: UserProfile = {
    uid: userRecord.uid,
    email: seedData.email,
    displayName: seedData.displayName,
    role: 'admin',
    tenantId: seedData.tenantId,
    createdAt: new Date().toISOString(),
  };
  await db.collection('users').doc(userRecord.uid).set(userProfile);
  
  console.log('Database seeding successful.');
}
