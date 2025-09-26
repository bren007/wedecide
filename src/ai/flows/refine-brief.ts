
'use server';
/**
 * @fileOverview A Genkit flow for refining an existing decision brief based on user instructions.
 * This file ONLY exports the server action function. All types and schemas are in /src/lib/types.ts.
 */

import { ai } from '@/ai/genkit';
import {
  RefineBriefInputSchema,
  RefineBriefOutputSchema,
  type RefineBriefInput,
  type RefineBriefOutput,
} from '@/lib/types';

export async function refineBrief(
  input: RefineBriefInput
): Promise<RefineBriefOutput> {
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

**Existing Document Content (for context only, you must generate new content):**

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
    console.log(
      `AGENT (refineBriefFlow): Received instruction. Refining document...`
    );
    console.log(`AGENT (refineBriefFlow): Instruction: "${input.instruction}"`);

    const promptInput = {
      ...input,
      JSONstringify: (obj: any) => JSON.stringify(obj, null, 2),
    };

    const { output } = await refineBriefPrompt(promptInput);

    if (!output) {
      console.error(
        'AGENT (refineBriefFlow): Failed to generate refined document from LLM.'
      );
      throw new Error('The agent failed to refine the document.');
    }

    console.log(
      'AGENT (refineBriefFlow): Successfully refined document. New brief title:',
      output.brief.title
    );
    return output;
  }
);
