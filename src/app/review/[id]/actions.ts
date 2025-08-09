'use server';

import { getDecisionById } from '@/lib/data';
import type { DecisionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function updateDecisionStatus(id: string, status: DecisionStatus) {
    const decision = await getDecisionById(id);
    if (decision) {
        decision.status = status;
    }
}

export async function approveForMeeting(id: string) {
  await updateDecisionStatus(id, 'Scheduled for Meeting');
  revalidatePath(`/review/${id}`);
  revalidatePath('/');
  redirect('/');
}
