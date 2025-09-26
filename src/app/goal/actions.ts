'use server';

import type { ClarifyGoalOutput } from '@/lib/schema/clarify-goal-schema';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

/**
 * Stage 1: Returns a hardcoded set of clarifying questions.
 * This is a stable workaround to bypass a persistent environment issue with the Genkit flow.
 */
export async function clarifyGoal(
  sessionCookie: string,
  goal: string
): Promise<ClarifyGoalOutput> {
  console.log('actions.clarifyGoal: Bypassing AI call and returning hardcoded questions for goal:', goal);
  
  // We still check for an authenticated user to ensure the action is secure.
  const { user } = await getAuthenticatedUser(sessionCookie);
  if (!user) throw new Error('Authentication session not found.');

  const hardcodedQuestions = {
    questions: [
      {
        category: 'Strategic Alignment',
        question: "How does this goal align with our organization's primary strategic objectives?",
      },
      {
        category: 'Scope and Constraints',
        question: 'What are the key constraints for this project, such as budget, timeline, or available resources?',
      },
      {
        category: 'Audience and Purpose',
        question: 'Who is the primary audience for this brief, and what is the main purpose you want it to achieve?',
      },
      {
        category: 'Information Gaps',
        question: 'What key information or data might be missing that would be critical for making a decision?',
      },
    ]
  };

  return Promise.resolve(hardcodedQuestions);
}
