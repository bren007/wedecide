// pages/api/auth/session.ts
import { initializeAdmin } from '@/lib/firebase/server-admin';
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { auth } = initializeAdmin();
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(401).json({ message: 'ID token is required.' });
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const options = {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    res.setHeader('Set-Cookie', serialize('session', sessionCookie, options));
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}
