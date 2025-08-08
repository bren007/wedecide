'use server';

import { updateDecisionStatus } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function approveForMeeting(id: string) {
  await updateDecisionStatus(id, 'Scheduled for Meeting');
  revalidatePath(`/review/${id}`);
  revalidatePath('/');
  redirect('/');
}
