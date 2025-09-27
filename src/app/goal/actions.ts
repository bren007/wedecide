
'use server';

import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { generateClarifyingQuestions } from '@/ai/flows/generate-clarifying-questions';
import type { ClarifyGoalInput, ClarifyGoalOutput } from '@/lib/types';

/**
 * Stage 1: Calls a Genkit flow to generate dynamic, targeted clarifying questions
 * based on the user's initial goal.
 */
export async function clarifyGoal(
  input: ClarifyGoalInput
): Promise<ClarifyGoalOutput> {
  console.log('AGENT (clarifyGoal): Initiated.');

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  console.log(`AGENT (clarifyGoal): Retrieving session cookie. Found: ${!!sessionCookie}`);

  const { user } = await getAuthenticatedUser(sessionCookie);
  console.log(`AGENT (clarifyGoal): User ${user.email} authenticated.`);

  console.log('AGENT (clarifyGoal): Calling generateClarifyingQuestions flow...');
  const clarifyingQuestions = await generateClarifyingQuestions(input);

  if (
    !clarifyingQuestions?.questions ||
    clarifyingQuestions.questions.length === 0
  ) {
    console.error('AGENT (clarifyGoal): AI flow failed to return questions.');
    throw new Error('The agent failed to generate clarifying questions.');
  }

  console.log('AGENT (clarifyGoal): Successfully received questions from AI.');
  return clarifyingQuestions;
}
