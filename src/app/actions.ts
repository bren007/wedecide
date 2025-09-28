
'use server';

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase';

const emailSchema = z.string().email({ message: 'A valid email must be provided.' });

export async function registerInterest(email: string): Promise<{ success: boolean; message: string; }> {
  try {
    const validation = emailSchema.safeParse(email);

    if (!validation.success) {
      return { success: false, message: validation.error.errors[0].message };
    }

    const firestore = getFirestore(getFirebaseAdminApp());

    await firestore.collection('interest').add({
      email: validation.data,
      submittedAt: new Date(),
    });

    return { success: true, message: 'Thank you for your interest!' };
  } catch (error) {
    console.error('Error registering interest:', error);
    // In a real production app, you might have more sophisticated error handling or logging.
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
}
