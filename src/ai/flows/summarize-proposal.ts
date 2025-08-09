'use server';

/**
 * @fileOverview AI agent that summarizes a proposal background and its strategic alignment.
 *
 * - summarizeProposalBackground - A function that summarizes the proposal background.
 * - SummarizeProposalBackgroundInput - The input type for the summarizeProposalBackground function.
 * - SummarizeProposalBackgroundOutput - The return type for the summarizeProposalBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProposalBackgroundInputSchema = z.object({
  background: z.string().describe('The lengthy proposal background to summarize.'),
  objectiveName: z.string().describe('The name of the strategic objective.'),
  objectiveDescription: z.string().describe('The description of the strategic objective.'),
});
export type SummarizeProposalBackgroundInput = z.infer<typeof SummarizeProposalBackgroundInputSchema>;

const SummarizeProposalBackgroundOutputSchema = z.object({
  summary: z.string().describe('The summarized proposal background, including its strategic alignment.'),
});
export type SummarizeProposalBackgroundOutput = z.infer<typeof SummarizeProposalBackgroundOutputSchema>;

export async function summarizeProposalBackground(input: SummarizeProposalBackgroundInput): Promise<SummarizeProposalBackgroundOutput> {
  return summarizeProposalBackgroundFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProposalBackgroundPrompt',
  input: {schema: SummarizeProposalBackgroundInputSchema},
  output: {schema: SummarizeProposalBackgroundOutputSchema},
  prompt: `You are an expert at summarizing lengthy documents and identifying strategic context.

Please summarize the following proposal background. In your summary, first provide a concise overview of the key points, then explicitly describe how the proposal aligns with the following strategic objective.

**Proposal Background:**
{{{background}}}

**Strategic Objective:**
- **Name:** {{{objectiveName}}}
- **Description:** {{{objectiveDescription}}}
`,
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
