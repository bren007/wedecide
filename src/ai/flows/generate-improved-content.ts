
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating improved content for a decision proposal.
 *
 * - generateImprovedContent - A function that triggers the content generation flow.
 * - GenerateImprovedContentInput - The input type for the generateImprovedContent function.
 * - GenerateImprovedContentOutput - The return type for the generateImprovedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateImprovedContentInputSchema = z.object({
  proposalTitle: z.string().describe('The title of the proposal.'),
  decisionSought: z.string().describe('The specific decision being sought.'),
  background: z.string().describe('The background information of the proposal.'),
});
export type GenerateImprovedContentInput = z.infer<
  typeof GenerateImprovedContentInputSchema
>;

export const GenerateImprovedContentOutputSchema = z.object({
  suggestedDecisionSought: z.string().describe('A revised, clearer version of the "Decision Sought" statement.'),
  suggestedBackground: z.string().describe('A revised, more comprehensive version of the "Background" section.'),
});
export type GenerateImprovedContentOutput = z.infer<
  typeof GenerateImprovedContentOutputSchema
>;

export async function generateImprovedContent(
  input: GenerateImprovedContentInput
): Promise<GenerateImprovedContentOutput> {
  return generateImprovedContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImprovedContentPrompt',
  input: {schema: GenerateImprovedContentInputSchema},
  output: {schema: GenerateImprovedContentOutputSchema},
  prompt: `You are an expert secretariat member, skilled at refining decision proposals to make them clearer, more concise, and more impactful for senior decision-makers.

For the following proposal, your task is to rewrite and improve the 'Decision Sought' and 'Background' sections.

1.  **Improve the 'Decision Sought' statement:**
    *   Rewrite it to be a single, unambiguous sentence.
    *   Ensure it is an actionable request.
    *   Incorporate specific, key details from the background (like budget numbers, timelines, or key deliverables) to make it self-contained.

2.  **Improve the 'Background' section:**
    *   Rewrite it as a compelling narrative for a time-poor executive.
    *   Start with the core problem or opportunity.
    *   Briefly explain the proposed solution.
    *   Crucially, explain *why* this decision is important now (the "so what?").
    *   Ensure it provides just enough context for the 'Decision Sought' to make sense.

**Original Proposal:**
- **Title:** {{{proposalTitle}}}
- **Decision Sought:** {{{decisionSought}}}
- **Background:** {{{background}}}
`,
});

const generateImprovedContentFlow = ai.defineFlow(
  {
    name: 'generateImprovedContentFlow',
    inputSchema: GenerateImprovedContentInputSchema,
    outputSchema: GenerateImprovedContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
