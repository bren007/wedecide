
'use server';
/**
 * @fileOverview A Genkit flow for generating clarifying questions based on a user's goal.
 *
 * - clarifyGoal - A function that generates questions.
 */

import { ai } from '@/ai/genkit';
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

// Rewritten prompt that does NOT specify a model,
// allowing it to inherit the correct default from `src/ai/genkit.ts`.
const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
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
