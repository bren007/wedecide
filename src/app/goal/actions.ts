
'use server';

import { clarifyGoal as clarifyGoalFlow, type ClarificationQuestion } from '@/ai/flows/clarify-goal';

export type { ClarificationQuestion };

/**
 * Stage 1: Calls the AI agent to get clarifying questions for a user's goal.
 */
export async function clarifyGoal(goal: string): Promise<ClarificationQuestion[]> {
  console.log('actions.clarifyGoal: Initiated with goal:', goal);
  
  try {
    const result = await clarifyGoalFlow({ userGoal: goal });
    console.log('actions.clarifyGoal: Received questions from agent.');
    return result.questions;
  } catch (error) {
    console.error('actions.clarifyGoal: An error occurred.', error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error('An unexpected error occurred while clarifying the goal.');
  }
}
