'use server';

import { decisions } from '@/lib/data';
import type { DecisionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function updateDecisionStatus(id: string, status: DecisionStatus) {
    const decision = decisions.find(d => d.id === id);
    if (decision) {
        decision.status = status;
    }
}

export async function approveForMeeting(id: string) {
  await updateDecisionStatus(id, 'Scheduled for Meeting');
  revalidatePath(`/review/${id}`);
  revalidatePath('/');
  revalidatePath('/meeting');
  redirect('/');
}
