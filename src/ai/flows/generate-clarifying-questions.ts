
'use server';

/**
 * @fileOverview AI agent that generates targeted clarifying questions for a user's goal.
 * This file ONLY exports the server action function. All types and schemas are in /src/lib/types.ts.
 */

import { ai } from '@/ai/genkit';
import {
  ClarifyGoalInputSchema,
  ClarifyGoalOutputSchema,
  type ClarifyGoalInput,
  type ClarifyGoalOutput,
} from '@/lib/types';

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

3.  **Data and Information Gaps:** Based on its initial analysis, generate one question to confirm or request missing data.
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
    console.log(
      'AGENT (clarifyGoalFlow): Received goal. Generating clarifying questions...'
    );
    console.log(`AGENT (clarifyGoalFlow): Goal: "${input.userGoal}"`);

    const { output } = await prompt(input);

    if (!output?.questions || output.questions.length === 0) {
      console.error(
        'AGENT (clarifyGoalFlow): Failed to generate questions from LLM.'
      );
      throw new Error('The agent failed to generate a response.');
    }

    console.log('AGENT (clarifyGoalFlow): Successfully generated questions:');
    output.questions.forEach((q) =>
      console.log(`  - [${q.category}]: ${q.question}`)
    );

    return output;
  }
);
