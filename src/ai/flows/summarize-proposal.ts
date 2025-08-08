'use server';

/**
 * @fileOverview AI agent that summarizes a proposal background.
 *
 * - summarizeProposalBackground - A function that summarizes the proposal background.
 * - SummarizeProposalBackgroundInput - The input type for the summarizeProposalBackground function.
 * - SummarizeProposalBackgroundOutput - The return type for the summarizeProposalBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProposalBackgroundInputSchema = z.object({
  background: z.string().describe('The lengthy proposal background to summarize.'),
});
export type SummarizeProposalBackgroundInput = z.infer<typeof SummarizeProposalBackgroundInputSchema>;

const SummarizeProposalBackgroundOutputSchema = z.object({
  summary: z.string().describe('The summarized proposal background.'),
});
export type SummarizeProposalBackgroundOutput = z.infer<typeof SummarizeProposalBackgroundOutputSchema>;

export async function summarizeProposalBackground(input: SummarizeProposalBackgroundInput): Promise<SummarizeProposalBackgroundOutput> {
  return summarizeProposalBackgroundFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProposalBackgroundPrompt',
  input: {schema: SummarizeProposalBackgroundInputSchema},
  output: {schema: SummarizeProposalBackgroundOutputSchema},
  prompt: `You are an expert at summarizing lengthy documents.

  Please summarize the following proposal background, extracting the key points and providing a concise overview:

  {{{background}}}`,
});

const summarizeProposalBackgroundFlow = ai.defineFlow(
  {
    name: 'summarizeProposalBackgroundFlow',
    inputSchema: SummarizeProposalBackgroundInputSchema,
    outputSchema: SummarizeProposalBackgroundOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
