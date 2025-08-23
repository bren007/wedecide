
'use server';

/**
 * @fileOverview AI agent that summarizes a proposal for executive decision-makers.
 *
 * - summarizeProposalForMeeting - A function that summarizes the proposal.
 * - SummarizeProposalForMeetingInput - The input type for the function.
 * - SummarizeProposalForMeetingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProposalForMeetingInputSchema = z.object({
  proposalTitle: z.string().describe('The title of the proposal.'),
  decision: z.string().describe('The specific decision being sought.'),
  background: z.string().describe('The lengthy proposal background to summarize.'),
  objectiveName: z.string().describe('The name of the strategic objective.'),
  objectiveDescription: z.string().describe('The description of the strategic objective.'),
});
export type SummarizeProposalForMeetingInput = z.infer<typeof SummarizeProposalForMeetingInputSchema>;

const SummarizeProposalForMeetingOutputSchema = z.object({
  overview: z.string().describe("A concise overview of the proposal's key points and the specific decision being sought."),
  strategicAlignment: z.string().describe('An assessment of how well the proposal aligns with the stated strategic objective.'),
  riskAppraisal: z.string().describe('A brief summary of key risks, potential exposure, and any critical missing information to support decision-making.'),
});
export type SummarizeProposalForMeetingOutput = z.infer<typeof SummarizeProposalForMeetingOutputSchema>;

export async function summarizeProposalForMeeting(input: SummarizeProposalForMeetingInput): Promise<SummarizeProposalForMeetingOutput> {
  return summarizeProposalForMeetingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProposalForMeetingPrompt',
  input: {schema: SummarizeProposalForMeetingInputSchema},
  output: {schema: SummarizeProposalForMeetingOutputSchema},
  prompt: `You are an expert at briefing senior decision-makers. Your role is to provide a clear, concise, and structured summary of a proposal to help them make a confident and informed decision. The goal is to anticipate and manage risks, not to avoid them.

For the following proposal, provide:
1.  **Overview:** A summary of the proposal's key points and a clear statement of the specific decision being sought.
2.  **Strategic Alignment:** A brief assessment of how the proposal contributes to the stated strategic objective.
3.  **Risk Appraisal:** A brief, forward-looking summary of the key risks. What is the potential exposure? Is anything critical missing from the proposal that decision-makers need to consider before proceeding?

Keep the language direct and to the point.

**Proposal Details:**
- **Title:** {{{proposalTitle}}}
- **Decision Sought:** {{{decision}}}
- **Background:** {{{background}}}

**Strategic Objective:**
- **Name:** {{{objectiveName}}}
- **Description:** {{{objectiveDescription}}}
`,
});

const summarizeProposalForMeetingFlow = ai.defineFlow(
  {
    name: 'summarizeProposalForMeetingFlow',
    inputSchema: SummarizeProposalForMeetingInputSchema,
    outputSchema: SummarizeProposalForMeetingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
