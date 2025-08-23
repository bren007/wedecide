
'use server';

/**
 * @fileOverview AI agent that provides a structured assessment of a proposal.
 *
 * - generateAssessment - A function that generates the assessment.
 * - GenerateAssessmentInput - The input type for the generateAssessment function.
 * - GenerateAssessmentOutput - The return type for the generateAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAssessmentInputSchema = z.object({
  proposalTitle: z.string().describe('The title of the proposal.'),
  decision: z.string().describe('The specific decision being sought.'),
  background: z.string().describe('The lengthy proposal background to assess.'),
  decisionType: z.string().describe('The type of decision being sought.'),
  objectiveName: z.string().describe('The name of the strategic objective.'),
  objectiveDescription: z.string().describe('The description of the strategic objective.'),
});
export type GenerateAssessmentInput = z.infer<typeof GenerateAssessmentInputSchema>;

const GenerateAssessmentOutputSchema = z.object({
  summary: z.string().describe('A concise overview of the proposal\'s key points.'),
  strategicAlignment: z.string().describe('An assessment of how well the proposal aligns with the stated strategic objective.'),
  riskAssessment: z.string().describe('A brief analysis of potential risks associated with the proposal.'),
});
export type GenerateAssessmentOutput = z.infer<typeof GenerateAssessmentOutputSchema>;

export async function generateAssessment(input: GenerateAssessmentInput): Promise<GenerateAssessmentOutput> {
  return generateAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssessmentPrompt',
  input: {schema: GenerateAssessmentInputSchema},
  output: {schema: GenerateAssessmentOutputSchema},
  prompt: `You are an expert secretariat member responsible for assessing decision proposals.

For the following proposal, provide a structured assessment covering three key areas:
1.  **Summary:** A concise overview of the key points of the proposal.
2.  **Strategic Alignment:** An assessment of how well the proposal aligns with the provided strategic objective.
3.  **Risk Assessment:** A brief analysis of potential risks or downsides associated with the proposal.

**Proposal Details:**
- **Title:** {{{proposalTitle}}}
- **Decision Sought:** {{{decision}}}
- **Type:** {{{decisionType}}}
- **Background:** {{{background}}}

**Strategic Objective:**
- **Name:** {{{objectiveName}}}
- **Description:** {{{objectiveDescription}}}
`,
});

const generateAssessmentFlow = ai.defineFlow(
  {
    name: 'generateAssessmentFlow',
    inputSchema: GenerateAssessmentInputSchema,
    outputSchema: GenerateAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
