
'use server';

/**
 * @fileOverview A Genkit flow for generating a summary of meeting outcomes.
 *
 * - generateMeetingSummary - A function that triggers the summary generation flow.
 * - GenerateMeetingSummaryInput - The input type for the generateMeetingSummary function.
 * - GenerateMeetingSummaryOutput - The return type for the generateMeetingSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Decision } from '@/lib/types';

const DecisionSchema = z.object({
  id: z.string(),
  proposalTitle: z.string(),
  decisionSought: z.string(),
  finalDecision: z.string().optional(),
  decisionNote: z.string().optional(),
  background: z.string(),
  decisionType: z.enum(['Approve', 'Endorse', 'Note', 'Agree', 'Direct']),
  status: z.enum(['Submitted', 'In Review', 'Scheduled for Meeting', 'Approved', 'Endorsed', 'Noted', 'Not Approved', 'Awaiting Update', 'Not Endorsed']),
  submittedAt: z.string(),
  decidedAt: z.string().optional(),
  objectiveId: z.string(),
  relatedDecisionIds: z.array(z.string()).optional(),
  alignmentScore: z.number().optional(),
  governanceLevel: z.enum(['Project', 'Program', 'Strategic Board']).optional(),
  submittingOrganisation: z.string().optional(),
  consultations: z.array(z.any()).optional(),
});

const GenerateMeetingSummaryInputSchema = z.object({
  decisions: z.array(DecisionSchema).describe('The list of decisions that were discussed in the meeting.'),
});
type GenerateMeetingSummaryInput = z.infer<typeof GenerateMeetingSummaryInputSchema>;

const GenerateMeetingSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the meeting outcomes.'),
});
type GenerateMeetingSummaryOutput = z.infer<typeof GenerateMeetingSummaryOutputSchema>;


export async function generateMeetingSummary(input: GenerateMeetingSummaryInput): Promise<GenerateMeetingSummaryOutput> {
  return generateMeetingSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingSummaryPrompt',
  input: { schema: GenerateMeetingSummaryInputSchema },
  output: { schema: GenerateMeetingSummaryOutputSchema },
  prompt: `You are a professional secretariat responsible for drafting minutes. Based on the list of decisions provided below, generate a concise summary of the meeting's key outcomes.

For each decision, clearly state the title and its final outcome (e.g., Approved, Endorsed, Noted, Not Approved). State the final decision text in full.

If an explanatory note ('decisionNote') is provided, you must attribute it to the correct decision-making body ('governanceLevel') using natural and contextually appropriate language. For example, instead of a robotic template, you should generate phrases like "The Strategic Board also stipulated that..." or "Furthermore, the Program Committee required that...". The phrasing should be formal and clear.

**Decisions:**
{{#each decisions}}
- **Title:** {{{proposalTitle}}}
  - **Outcome:** The proposal was {{{status}}}.
  - **Final Decision:** {{{finalDecision}}}
  {{#if decisionNote}}
  - **Note:** The {{{governanceLevel}}} also stated: "{{{decisionNote}}}"
  {{/if}}
{{/each}}
`,
});

const generateMeetingSummaryFlow = ai.defineFlow(
  {
    name: 'generateMeetingSummaryFlow',
    inputSchema: GenerateMeetingSummaryInputSchema,
    outputSchema: GenerateMeetingSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
