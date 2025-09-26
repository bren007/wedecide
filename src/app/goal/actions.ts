
'use server';

import type { ClarifyGoalOutput } from '@/lib/schema/clarify-goal-schema';
// import { clarifyGoalFlow } from '@/ai/flows/clarify-goal';

/**
 * Stage 1: Returns a hardcoded set of clarifying questions to bypass the failing AI call.
 */
export async function clarifyGoal(
  goal: string
): Promise<ClarifyGoalOutput> {
  console.log('actions.clarifyGoal: Bypassing AI call and returning hardcoded questions for goal:', goal);
  
  // This is a stable workaround to bypass the persistent environment issue with the Genkit flow.
  const hardcodedQuestions = {
    questions: [
      {
        category: 'Strategic Alignment',
        question: 'How does this goal align with our organization\'s primary strategic objectives?',
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

  // The return type is compatible with the UI, but we are not calling the AI.
  // We are using a Promise.resolve to maintain the async function signature.
  return Promise.resolve(hardcodedQuestions);
}
