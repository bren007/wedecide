'use server';

import { updateDecisionStatus } from '@/lib/data';
import type { DecisionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function setDecisionOutcome(id: string, outcome: DecisionStatus) {
  // Add a check to ensure only valid outcome statuses are set
  const validOutcomes: DecisionStatus[] = ['Approved', 'Endorsed', 'Noted', 'Not Approved'];
  if (validOutcomes.includes(outcome)) {
    await updateDecisionStatus(id, outcome);
    revalidatePath('/meeting');
  } else {
    // In a real app, you'd want more robust error handling
    console.error('Invalid outcome status:', outcome);
  }
}
