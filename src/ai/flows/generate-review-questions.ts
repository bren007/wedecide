'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating questions to assess a proposal's fitness for review.
 *
 * - generateFitnessReviewQuestions - A function that triggers the question generation flow.
 * - GenerateFitnessReviewQuestionsInput - The input type for the generateFitnessReviewQuestions function.
 * - GenerateFitnessReviewQuestionsOutput - The return type for the generateFitnessReviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFitnessReviewQuestionsInputSchema = z.object({
  title: z.string().describe('The title of the proposal.'),
  background: z.string().describe('The background information of the proposal.'),
  decisionType: z.enum(['Approve', 'Endorse', 'Note']).describe('The type of decision being sought.'),
});
export type GenerateFitnessReviewQuestionsInput = z.infer<
  typeof GenerateFitnessReviewQuestionsInputSchema
>;

const GenerateFitnessReviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of questions to assess the proposal\u2019s fitness for review.'),
});
export type GenerateFitnessReviewQuestionsOutput = z.infer<
  typeof GenerateFitnessReviewQuestionsOutputSchema
>;

export async function generateFitnessReviewQuestions(
  input: GenerateFitnessReviewQuestionsInput
): Promise<GenerateFitnessReviewQuestionsOutput> {
  return generateFitnessReviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFitnessReviewQuestionsPrompt',
  input: {schema: GenerateFitnessReviewQuestionsInputSchema},
  output: {schema: GenerateFitnessReviewQuestionsOutputSchema},
  prompt: `You are a member of a secretariat for a strategic decision-making body. Your role is to vet proposals to ensure they are "decision-ready" before they are presented.

For the following proposal, generate a list of vetting questions. These questions should help determine if the proposal is fully formed, well-considered, and strategically aligned. Focus on questions that probe for clarity, completeness, potential risks, and resource implications to ensure decision-makers receive only high-quality materials.

Proposal Title: {{{title}}}
Background: {{{background}}}
Decision Type: {{{decisionType}}}

Vetting Questions:`,
});

const generateFitnessReviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateFitnessReviewQuestionsFlow',
    inputSchema: GenerateFitnessReviewQuestionsInputSchema,
    outputSchema: GenerateFitnessReviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
