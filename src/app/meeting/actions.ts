
'use server';

import { getDecisionById } from '@/lib/data';
import type { Decision, DecisionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function updateDecisionStatus(id: string, status: DecisionStatus) {
  const decision = await getDecisionById(id);
  if (decision) {
      decision.status = status;
      return decision;
  }
  return undefined;
}

export async function setDecisionOutcome(id: string, outcome: DecisionStatus): Promise<Decision | undefined> {
  const validOutcomes: DecisionStatus[] = ['Approved', 'Endorsed', 'Noted', 'Not Approved'];
  if (validOutcomes.includes(outcome)) {
    const updatedDecision = await updateDecisionStatus(id, outcome);
    revalidatePath('/meeting');
    return updatedDecision;
  } else {
    console.error('Invalid outcome status:', outcome);
    return undefined;
  }
}
