'use server';

import { getDecisionById } from '@/lib/data';
import type { Decision, DecisionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { summarizeTranscript, type SummarizeTranscriptInput } from '@/ai/flows/summarize-transcript';

async function updateDecisionStatus(id: string, status: DecisionStatus, finalDecision: string, decisionNote?: string) {
  const decision = await getDecisionById(id);
  if (decision) {
      decision.status = status;
      decision.finalDecision = finalDecision;
      decision.decisionNote = decisionNote;
      // Set the decidedAt timestamp when a final decision is made
      if (['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(status)) {
        decision.decidedAt = new Date().toISOString();
      }
      return decision;
  }
  return undefined;
}

export async function setDecisionOutcome(id: string, outcome: DecisionStatus, finalDecision: string, decisionNote?: string): Promise<Decision | undefined> {
  const validOutcomes: DecisionStatus[] = ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'];
  if (validOutcomes.includes(outcome)) {
    const updatedDecision = await updateDecisionStatus(id, outcome, finalDecision, decisionNote);
    revalidatePath('/meeting');
    revalidatePath('/past-decisions');
    revalidatePath(`/review/${id}`);
    return updatedDecision;
  } else {
    console.error('Invalid outcome status:', outcome);
    return undefined;
  }
}

export async function generateSummaryFromAudio(audioDataUri: string, isChathamHouse: boolean, summaryType: 'full' | 'concise') {
  if (!audioDataUri) {
    throw new Error('Audio data is required.');
  }
  const result = await summarizeTranscript({ audioDataUri, isChathamHouse, summaryType });
  return result;
}
