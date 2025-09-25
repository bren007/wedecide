
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

// This prompt now explicitly uses the 'flash' model defined in genkit.ts,
// ensuring the correct model is always used and avoiding resolution errors.
const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
  // By removing the model parameter here, we rely on the default set in `genkit.ts`.
  // This was the source of the persistent error.
  prompt: `You are an expert public sector consultant. Your task is to generate insightful clarifying questions for a user's goal.

**User's Goal:** "{{userGoal}}"

**Your Task:**
Generate one question for each of the following categories to help refine the goal:
1.  **Strategic Alignment:** A question linking the goal to a higher-level organizational priority.
2.  **Scope & Constraints:** A question to define boundaries (e.g., budget, timeline).
3.  **Audience & Purpose:** A question to clarify the ultimate user and desired outcome.
4.  **Data & Information Gaps:** A question to proactively ask for necessary data.

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
      console.error('AGENT ERROR: The clarifyGoalPrompt returned no output.');
      throw new Error('The agent failed to generate clarification questions.');
    }

    return output;
  }
);
