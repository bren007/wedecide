
'use server';

/**
 * @fileOverview A Genkit flow for transcribing audio and generating a structured meeting summary.
 *
 * - summarizeTranscript - A function that triggers the transcription and summary flow.
 * - SummarizeTranscriptInput - The input type for the summarizeTranscript function.
 * - SummarizeTranscriptOutput - The return type for the summarizeTranscript function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeTranscriptInputSchema = z.object({
  audioDataUri: z.string().describe("A recording of a meeting, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  isChathamHouse: z.boolean().optional().describe('If true, the summary should not attribute comments to specific individuals.'),
  summaryType: z.enum(['full', 'concise']).default('concise').describe("The type of summary to generate. 'full' includes discussion, decisions, and actions. 'concise' includes only decisions and actions."),
});
export type SummarizeTranscriptInput = z.infer<typeof SummarizeTranscriptInputSchema>;

const SummarizeTranscriptOutputSchema = z.object({
  discussionSummary: z.string().optional().describe('A concise summary of the key points discussed during the meeting. This is only generated for "full" summaryType.'),
  decisionsAgreed: z.string().describe('A clear list of the specific decisions that were formally agreed upon.'),
  actionItems: z.string().describe('A list of action items, including who is responsible for each if mentioned.'),
});
export type SummarizeTranscriptOutput = z.infer<typeof SummarizeTranscriptOutputSchema>;

export async function summarizeTranscript(input: SummarizeTranscriptInput): Promise<SummarizeTranscriptOutput> {
  return summarizeTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTranscriptPrompt',
  input: { schema: SummarizeTranscriptInputSchema },
  output: { schema: SummarizeTranscriptOutputSchema },
  prompt: `You are a professional secretariat responsible for drafting minutes. 

First, transcribe the following audio recording of a meeting.
Second, based on the transcript you just created, generate a structured summary with the following distinct sections:
{{#if summaryType.full}}
1.  **Discussion Summary:** A concise overview of the key points, arguments, and topics covered.
{{/if}}
2.  **Decisions Agreed:** A clear list of the specific decisions that were formally agreed upon by the participants.
3.  **Action Items:** A bulleted list of all tasks or actions that were assigned, noting who is responsible for each if specified.

{{#if isChathamHouse}}
**IMPORTANT**: This meeting was held under the Chatham House Rule. The summary must not attribute any statement or viewpoint to a specific person or their affiliation. Report on what was said, but not on who said it.
{{/if}}

Format the output clearly.

**Audio Recording:**
{{media url=audioDataUri}}
`,
});

const summarizeTranscriptFlow = ai.defineFlow(
  {
    name: 'summarizeTranscriptFlow',
    inputSchema: SummarizeTranscriptInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async (input) => {
    // Re-map input to make it compatible with Handlebars #if
    const promptInput = {
      ...input,
      summaryType: {
        full: input.summaryType === 'full',
      },
    };

    const { output } = await prompt(promptInput);

    return output!;
  }
);
