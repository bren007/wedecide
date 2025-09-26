
'use server';

import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { cookies } from 'next/headers';
import {
  generateClarifyingQuestions,
} from '@/ai/flows/generate-clarifying-questions';
import type { ClarifyGoalInput, ClarifyGoalOutput } from '@/lib/types';

/**
 * Stage 1: Calls a Genkit flow to generate dynamic, targeted clarifying questions
 * based on the user's initial goal.
 */
export async function clarifyGoal(
  input: ClarifyGoalInput
): Promise<ClarifyGoalOutput> {
  const sessionCookie = cookies().get('session')?.value;
  // This action is secure because it verifies the user before proceeding.
  await getAuthenticatedUser(sessionCookie);

  console.log('AGENT: Generating clarifying questions for goal:', input.userGoal);

  const clarifyingQuestions = await generateClarifyingQuestions(input);

  if (
    !clarifyingQuestions?.questions ||
    clarifyingQuestions.questions.length === 0
  ) {
    throw new Error('The agent failed to generate clarifying questions.');
  }
  console.log('AGENT: Successfully generated questions.');
  return clarifyingQuestions;
}
