
'use server';

/**
 * @fileOverview AI agent that generates targeted clarifying questions for a user's goal.
 *
 * - generateClarifyingQuestions - A function that generates the questions.
 * - ClarifyGoalInput - The input type for the function.
 * - ClarifyGoalOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the flow
const ClarifyGoalInputSchema = z.object({
  userGoal: z.string().describe("The user's initial goal or problem statement."),
});
export type ClarifyGoalInput = z.infer<typeof ClarifyGoalInputSchema>;

// Schema for a single question, which includes its category
export const ClarificationQuestionSchema = z.object({
  category: z
    .string()
    .describe("The category of the question (e.g., 'Strategic Alignment', 'Scope and Constraints')."),
  question: z.string().describe('A specific, insightful question for the user.'),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

// Output schema for the flow, containing a list of questions
export const ClarifyGoalOutputSchema = z.object({
  questions: z
    .array(ClarificationQuestionSchema)
    .describe('A list of focused clarifying questions for the user to help confirm intent and fill gaps.'),
});
export type ClarifyGoalOutput = z.infer<typeof ClarifyGoalOutputSchema>;

/**
 * The main exported function that clients will call.
 */
export async function generateClarifyingQuestions(
  input: ClarifyGoalInput
): Promise<ClarifyGoalOutput> {
  return clarifyGoalFlow(input);
}

// Define the Genkit prompt with specific instructions
const prompt = ai.definePrompt({
  name: 'clarifyGoalPrompt',
  input: { schema: ClarifyGoalInputSchema },
  output: { schema: ClarifyGoalOutputSchema },
  prompt: `You are an expert public sector consultant. Your job is to help a user refine their initial goal into a "decision-ready" brief.
To do this, you must ask exactly four insightful clarifying questions, one for each of the following categories.

**User's Goal:** "{{userGoal}}"

**Your Task:** Generate one question for each category below, tailored to the user's goal.

1.  **Strategic Alignment:** Generate one question that links the user's goal to a public sector strategic priority. This requires you to infer potential alignment.
    *   *Example:* "Based on the goal to implement the new 'Transport Link,' which of these strategic priorities does this initiative best support: Economic Development, Urban Congestion Reduction, or Climate Change Mitigation?"

2.  **Scope and Constraints:** Generate one question that clarifies the boundaries of the request.
    *   *Example:* "Is this brief focused solely on the initial feasibility assessment, or should it also include implementation timelines and resource allocation?"

3.  **Data and Information Gaps:** Generate one question to confirm or request missing data. Consider what data would be needed for a robust analysis.
    *   *Example:* "To support this analysis, what existing datasets, internal reports, or historical documents should be considered? For instance, do recent user satisfaction surveys or operational cost reports exist?"

4.  **Audience and Purpose:** Generate one question that helps tailor the final output for the intended decision-maker.
    *   *Example:* "Who is the ultimate decision-maker for this brief (e.g., the Minister, the Chief Executive, or the Board)? What specific action or decision do you want them to make?"

Return your response as a structured list of four questions.`,
});

// Define the Genkit flow
const clarifyGoalFlow = ai.defineFlow(
  {
    name: 'clarifyGoalFlow',
    inputSchema: ClarifyGoalInputSchema,
    outputSchema: ClarifyGoalOutputSchema,
  },
  async (input) => {
    console.log('AGENT: Generating clarifying questions for goal:', input.userGoal);
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The agent failed to generate a response.');
    }
    console.log('AGENT: Successfully generated questions.');
    return output;
  }
);
