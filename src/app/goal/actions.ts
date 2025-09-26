
'use server';

import type { ClarificationQuestion } from '@/lib/schema/clarify-goal-schema';
// The AI flow is temporarily disabled to establish a stable baseline.
// import { clarifyGoal as clarifyGoalFlow } from '@/ai/flows/clarify-goal';

/**
 * Stage 1: Returns a hardcoded set of clarifying questions to establish a stable baseline.
 * The call to the AI agent is temporarily bypassed to isolate the configuration error.
 */
export async function clarifyGoal(
  goal: string
): Promise<ClarificationQuestion[]> {
  console.log('actions.clarifyGoal: Bypassing AI and returning hardcoded questions for stability test. Goal:', goal);

  // This is a temporary, hardcoded response to ensure the UI and server action flow is working.
  const hardcodedQuestions: ClarificationQuestion[] = [
    {
      category: 'Strategic Alignment',
      question: 'What is the primary strategic objective this proposal aligns with?',
    },
    {
      category: 'Scope & Constraints',
      question: 'What are the key budgetary and timeline constraints for this initiative?',
    },
    {
      category: 'Audience & Purpose',
      question: 'Who is the primary audience or beneficiary of this work, and what is the main outcome you want for them?',
    },
    {
      category: 'Data & Information Gaps',
      question: 'What key data or information do you currently lack to make this proposal as strong as possible?',
    }
  ];

  return hardcodedQuestions;
}
