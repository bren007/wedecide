
'use server';

import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { cookies } from 'next/headers';
import {
  ClarifyGoalOutput,
  generateClarifyingQuestions,
} from '@/ai/flows/generate-clarifying-questions';

/**
 * Stage 1: Calls a Genkit flow to generate dynamic, targeted clarifying questions
 * based on the user's initial goal.
 */
export async function clarifyGoal(goal: string): Promise<ClarifyGoalOutput> {
  console.log('actions.clarifyGoal: Initiating AI clarification for goal:', goal);

  const sessionCookie = cookies().get('session')?.value;
  // This action is secure because it verifies the user before proceeding.
  await getAuthenticatedUser(sessionCookie);

  const clarifyingQuestions = await generateClarifyingQuestions({
    userGoal: goal,
  });

  if (!clarifyingQuestions?.questions || clarifyingQuestions.questions.length === 0) {
    throw new Error('The agent failed to generate clarifying questions.');
  }

  return clarifyingQuestions;
}
