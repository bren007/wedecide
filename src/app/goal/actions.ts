
'use server';

import type { ClarifyGoalOutput } from '@/lib/schema/clarify-goal-schema';
import { clarifyGoal as clarifyGoalFlow } from '@/ai/flows/clarify-goal';

/**
 * Stage 1: Calls the Genkit flow to get clarifying questions for a user's goal.
 */
export async function clarifyGoal(
  goal: string
): Promise<ClarifyGoalOutput> {
  console.log('actions.clarifyGoal: Initiating AI-powered clarification for goal:', goal);
  
  try {
    const result = await clarifyGoalFlow({ userGoal: goal });
    return result;
  } catch (error) {
    console.error('actions.clarifyGoal: An error occurred.', error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error('An unexpected error occurred while clarifying the goal.');
  }
}
