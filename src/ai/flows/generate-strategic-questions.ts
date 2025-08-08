'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating strategic questions for a given decision proposal.
 *
 * - generateStrategicQuestions - A function that triggers the question generation flow.
 * - GenerateStrategicQuestionsInput - The input type for the generateStrategicQuestions function.
 * - StrategicQuestions - The output type for the generateStrategicQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStrategicQuestionsInputSchema = z.object({
  title: z.string().describe('The title of the proposal.'),
  background: z.string().describe('The background information of the proposal.'),
  decisionType: z.enum(['Approve', 'Endorse', 'Note']).describe('The type of decision being sought.'),
});
export type GenerateStrategicQuestionsInput = z.infer<
  typeof GenerateStrategicQuestionsInputSchema
>;

const StrategicQuestionsSchema = z.object({
    'What is known?': z.array(z.string()).describe('Questions to clarify the current situation and available data.'),
    'What if?': z.array(z.string()).describe('Questions to explore potential scenarios and consequences.'),
    'Now What?': z.array(z.string()).describe('Questions to determine actionable next steps and implementation plans.'),
    'So, What?': z.array(z.string()).describe('Questions to assess the impact and significance of the decision.'),
    "What's Unsaid?": z.array(z.string()).describe('Questions to uncover hidden assumptions, biases, or unaddressed issues.'),
});
export type StrategicQuestions = z.infer<typeof StrategicQuestionsSchema>;


export async function generateStrategicQuestions(
  input: GenerateStrategicQuestionsInput
): Promise<StrategicQuestions> {
  return generateStrategicQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStrategicQuestionsPrompt',
  input: {schema: GenerateStrategicQuestionsInputSchema},
  output: {schema: StrategicQuestionsSchema},
  prompt: `You are an expert strategic advisor in a high-stakes meeting. Your role is to help decision-makers thoroughly vet a proposal by asking insightful, targeted questions.

For the proposal below, generate a list of questions for each of the following categories to facilitate a robust discussion:
- "What is known?": Clarify facts, data, and the current state.
- "What if?": Explore potential scenarios, risks, and unintended consequences.
- "Now What?": Focus on implementation, action plans, and next steps.
- "So, What?": Assess the broader impact, significance, and alignment with strategic goals.
- "What's Unsaid?": Uncover hidden assumptions, biases, unspoken concerns, or missing information.

Ensure the questions are specific to the proposal details provided.

**Proposal Details:**
- **Title:** {{{title}}}
- **Decision Type:** {{{decisionType}}}
- **Background:** {{{background}}}
`,
});

const generateStrategicQuestionsFlow = ai.defineFlow(
  {
    name: 'generateStrategicQuestionsFlow',
    inputSchema: GenerateStrategicQuestionsInputSchema,
    outputSchema: StrategicQuestionsSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
