
'use server';
/**
 * @fileOverview A Genkit flow for generating clarifying questions based on a user's goal.
 *
 * - clarifyGoal - A function that generates questions.
 */
import { ai, flash } from '@/ai/genkit';
import {
  ClarifyGoalInputSchema,
  ClarifyGoalOutputSchema,
  type ClarifyGoalInput,
  type ClarifyGoalOutput,
} from '@/lib/schema/clarify-goal-schema';

export async function clarifyGoal(
  input: ClarifyGoalInput
): Promise<ClarifyGoalOutput> {
  return clarifyGoalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  model: flash, // Use the explicit model object reference.
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
  prompt: `You are an expert public sector consultant. Your task is to generate insightful clarifying questions for a user's goal.

**User's Goal:** "{{userGoal}}"

**Your Task:**
Generate a list of four insightful clarifying questions to help the user refine their goal. The questions should cover:
1.  The strategic alignment of the goal.
2.  The scope and constraints (e.g., budget, timeline).
3.  The intended audience and purpose.
4.  Potential data or information gaps.

**Output Format:**
Respond only with a valid JSON object matching the output schema.
`,
});

// Define the Genkit flow.
const clarifyGoalFlow = ai.defineFlow(
  {
    name: 'clarifyGoalFlow',
    inputSchema: ClarifyGoalInputSchema,
    outputSchema: ClarifyGoalOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('The agent failed to generate clarification questions.');
    }

    return output;
  }
);
