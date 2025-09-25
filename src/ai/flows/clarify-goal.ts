
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

const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
  prompt: `You are an expert public sector consultant specializing in decision-making and governance. Your task is to act as a proactive partner, not a passive assistant. Your job is to generate highly specific and insightful questions to clarify a user's goal. Avoid generic or conversational questions.

**User's Goal:** "{{userGoal}}"

**Your Task:**
Generate one question for each of the following categories.

1.  **Strategic Alignment:** Question should link the goal to a higher-level organizational priority.
    *   Example: "Which of our organization's published strategic goals does this initiative best support?"

2.  **Scope & Constraints:** Question should define the boundaries of the request (e.g., budget, timeline, key stakeholders).
    *   Example: "Are there any specific budget or timeline constraints that must be considered for this project?"

3.  **Audience & Purpose:** Question should clarify the ultimate user of the brief and the desired outcome.
    *   Example: "Who is the ultimate decision-maker for this brief, and what specific action or outcome do you want them to take?"

4.  **Data & Information Gaps:** Question should proactively ask for data that is likely to be missing from the initial request.
    *   Example: "I am preparing to analyze existing financial data. Are there any other specific datasets or documents I should incorporate for a comprehensive analysis?"

**Output Format:**
Respond only with a JSON object. Do not include any conversational text or explanation. The JSON schema should contain a 'questions' array, where each object has a 'category' and a 'question' field.
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
    console.log('AGENT: Starting clarifyGoalFlow with goal:', input.userGoal);
    
    console.log('AGENT: Calling LLM prompt...');
    
    const { output } = await prompt(input);
    console.log('AGENT: Received response from LLM.');

    if (!output) {
      console.error('AGENT ERROR: The clarifyGoalPrompt returned no output.');
      throw new Error('The agent failed to generate clarification questions.');
    }

    console.log('AGENT: Successfully generated clarification questions.', output);
    return output;
  }
);
