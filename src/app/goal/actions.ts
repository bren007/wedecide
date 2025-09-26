
'use server';

import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type {
  ClarifyGoalOutput,
  ClarificationQuestion,
} from '@/lib/schema/clarify-goal-schema';
import { cookies } from 'next/headers';

/**
 * Stage 1: Returns a hardcoded set of clarifying questions.
 * This is a stable workaround to bypass a persistent environment issue with the Genkit flow.
 */
export async function clarifyGoal(goal: string): Promise<ClarifyGoalOutput> {
  console.log(
    'actions.clarifyGoal: Bypassing AI call and returning hardcoded questions for goal:',
    goal
  );

  const sessionCookie = cookies().get('session')?.value;
  // We check for an authenticated user to ensure the action is secure.
  await getAuthenticatedUser(sessionCookie);

  const hardcodedQuestions: { questions: ClarificationQuestion[] } = {
    questions: [
      {
        category: 'Strategic Alignment',
        question:
          "How does this goal align with our organization's primary strategic objectives?",
      },
      {
        category: 'Scope and Constraints',
        question:
          'What are the key constraints for this project, such as budget, timeline, or available resources?',
      },
      {
        category: 'Audience and Purpose',
        question:
          'Who is the primary audience for this brief, and what is the main purpose you want it to achieve?',
      },
      {
        category: 'Information Gaps',
        question:
          'What key information or data might be missing that would be critical for making a decision?',
      },
    ],
  };

  return Promise.resolve(hardcodedQuestions);
}
