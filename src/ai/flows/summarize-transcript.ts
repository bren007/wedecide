
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
});
export type SummarizeTranscriptInput = z.infer<typeof SummarizeTranscriptInputSchema>;

const SummarizeTranscriptOutputSchema = z.object({
  discussionSummary: z.string().describe('A concise summary of the key points discussed during the meeting.'),
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
1.  **Discussion Summary:** A concise overview of the key points, arguments, and topics covered.
2.  **Decisions Agreed:** A clear list of the specific decisions that were formally agreed upon by the participants.
3.  **Action Items:** A bulleted list of all tasks or actions that were assigned, noting who is responsible for each if specified.

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
    const { output } = await prompt(input);
    return output!;
  }
);
