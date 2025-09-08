
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
  decisionSought: z.string().describe('The specific decision being sought.'),
  background: z.string().describe('The lengthy proposal background to assess.'),
  decisionType: z.string().describe('The type of decision being sought.'),
  objectiveName: z.string().describe('The name of the strategic objective.'),
  objectiveDescription: z.string().describe('The description of the strategic objective.'),
});
export type GenerateAssessmentInput = z.infer<typeof GenerateAssessmentInputSchema>;

const GenerateAssessmentOutputSchema = z.object({
  summary: z.string().describe('A concise overview of the proposal\'s key points.'),
  strategicAlignment: z.string().describe('An assessment of how well the proposal aligns with the stated strategic objective.'),
  riskAssessment: z.string().describe('An analysis of the proposal\'s risk profile, evaluating how well potential risks are addressed.'),
});
export type GenerateAssessmentOutput = z.infer<typeof GenerateAssessmentOutputSchema>;

export async function generateAssessment(input: GenerateAssessmentInput): Promise<GenerateAssessmentOutput> {
  return generateAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssessmentPrompt',
  input: {schema: GenerateAssessmentInputSchema},
  output: {schema: GenerateAssessmentOutputSchema},
  prompt: `You are an expert member of a secretariat, responsible for ensuring that only high-quality, robust, and "decision-ready" proposals are presented to decision-makers. Your role is to help your colleagues prepare the best possible decision papers.

For the following proposal, provide a structured assessment to aid in this quality control process. The assessment should cover three important dimensions:
1.  **Summary:** Provide a concise, neutral overview of the proposal's key points. This helps ensure the core message is clear and easily digestible.
2.  **Strategic Alignment:** Assess how well the proposal aligns with the provided strategic objective. Your analysis should confirm that the proposal is not just a good idea in isolation, but that it actively contributes to the organization's stated goals.
3.  **Risk Assessment:** Provide a thoughtful analysis of the proposal's risk profile. The goal is not to eliminate all risk, which can lead to overly conservative decisions, but to ensure the risks are well understood and managed. Your assessment should:
    - Identify potential financial, operational, or reputational risks.
    - Evaluate whether the proposal acknowledges these risks and proposes credible mitigation strategies.
    - Highlight any significant unaddressed risks that warrant discussion, helping to strengthen the proposal before it is finalized.

**Proposal Details:**
- **Title:** {{{proposalTitle}}}
- **Decision Sought:** {{{decisionSought}}}
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
