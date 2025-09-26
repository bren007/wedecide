
'use server';
/**
 * @fileOverview A Genkit flow for generating clarifying questions based on a user's goal.
 *
 * - clarifyGoal - A function that generates questions.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai'; // Explicit import for the fix.
import {
  ClarifyGoalInputSchema,
  ClarifyGoalOutputSchema,
  type ClarifyGoalInput,
  type ClarifyGoalOutput,
} from '@/lib/schema/clarify-goal-schema';

export async function clarifyGoal(
  input: ClarifyGoalInput
): Promise<ClarifyGoalOutput> {
  // Good logging to see what's happening.
  console.log('AGENT: Starting clarifyGoal flow.');
  return clarifyGoalFlow(input);
}

// This prompt now EXPLICITLY defines the model it must use, bypassing any
// faulty global configuration or model resolution that was causing the 404 error.
// This is the definitive fix.
const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
  model: googleAI.model('gemini-1.5-flash'), // The explicit, targeted fix.
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
    console.log('AGENT: Calling LLM with the explicitly defined model.');
    const { output } = await prompt(input);
    console.log('AGENT: Successfully received LLM output.');

    if (!output) {
      console.error('AGENT ERROR: The clarifyGoalPrompt returned no output.');
      throw new Error('The agent failed to generate clarification questions.');
    }

    return output;
  }
);
