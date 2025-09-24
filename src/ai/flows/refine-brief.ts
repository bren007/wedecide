
'use server';
/**
 * @fileOverview A Genkit flow for refining an existing decision brief based on user instructions.
 *
 * - refineBrief - A function that handles the document refinement.
 * - RefineBriefInput - The input type for the function.
 * - RefineBriefOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { BriefContent, FullArtifactContent } from '@/lib/types';


const BriefContentSchema = z.object({
  title: z.string().describe("A clear, concise title for the decision brief."),
  strategicCase: z.string().describe("A summary of the strategic case for the decision, explaining why it's important."),
  recommendation: z.string().describe("The agent's recommended course of action."),
  alignmentScore: z.number().describe("A score from 0 to 100 indicating how well the proposal aligns with strategic goals."),
  alignmentRationale: z.string().describe("A brief explanation for the alignment score, referencing specific strategic goals."),
});

const FullArtifactContentSchema = z.object({
  title: z.string().describe("A clear, concise, and official title for the full decision artifact."),
  strategicCase: z.string().describe("The full strategic case for the decision, explaining in detail why it's important, the problem it solves, and how it aligns with organizational goals. This should be comprehensive."),
  optionsAnalysis: z.string().describe("A detailed analysis of the different options available, including a 'do nothing' option, with a summary of pros and cons for each."),
  recommendation: z.string().describe("The agent's fully justified recommended course of action, explaining why it was chosen over other options."),
  financialCase: z.string().describe("A detailed summary of the financial implications, including budget impact and potential return on investment, based on the data retrieved from tools."),
});


const RefineBriefInputSchema = z.object({
  instruction: z.string().describe("The user's instruction for how to refine the document."),
  existingBrief: BriefContentSchema.describe('The existing concise summary layer of the document.'),
  existingArtifact: FullArtifactContentSchema.describe('The existing comprehensive, detailed layer of the document.'),
});
export type RefineBriefInput = z.infer<typeof RefineBriefInputSchema>;


const RefineBriefOutputSchema = z.object({
  brief: BriefContentSchema.describe('The new, refined concise summary layer of the document.'),
  fullArtifact: FullArtifactContentSchema.describe('The new, refined comprehensive, detailed layer of the document.'),
});
export type RefineBriefOutput = z.infer<typeof RefineBriefOutputSchema>;


export async function refineBrief(input: RefineBriefInput): Promise<RefineBriefOutput> {
  return refineBriefFlow(input);
}


const refineBriefPrompt = ai.definePrompt({
  name: 'refineBriefPrompt',
  input: { schema: RefineBriefInputSchema },
  output: { schema: RefineBriefOutputSchema },
  prompt: `You are an expert public sector advisor. You have already written a draft decision document which has two layers: a concise 'brief' and a detailed 'fullArtifact'.

The user has provided a new instruction to refine this document.

**User's Instruction:** "{{instruction}}"

**Your Task:**

1.  Read the user's instruction carefully.
2.  Generate a new, improved version of the **fullArtifact** that incorporates the user's feedback. You MUST NOT just repeat the old content; you must modify it based on the instruction.
3.  After generating the new full artifact, you MUST then generate a new **brief** that is a concise and accurate summary of your newly created full artifact. The two layers must be consistent.
4.  Maintain the same JSON output structure.

**Existing Document Content:**

**Brief:**
\`\`\`json
{{{JSONstringify existingBrief}}}
\`\`\`

**Full Artifact:**
\`\`\`json
{{{JSONstringify existingArtifact}}}
\`\`\`
`,
});


const refineBriefFlow = ai.defineFlow(
  {
    name: 'refineBriefFlow',
    inputSchema: RefineBriefInputSchema,
    outputSchema: RefineBriefOutputSchema,
  },
  async (input) => {
    console.log('AGENT: Starting refineBriefFlow with instruction:', input.instruction);

    const promptInput = {
      ...input,
      JSONstringify: (obj: any) => JSON.stringify(obj, null, 2),
    };
    
    const { output } = await refineBriefPrompt(promptInput);
    
    if (!output) {
      throw new Error('The agent failed to refine the document.');
    }
    
    console.log('AGENT: Successfully refined document.');
    return output;
  }
);
