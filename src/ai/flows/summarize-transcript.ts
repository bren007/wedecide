
'use server';

/**
 * @fileOverview A Genkit flow for transcribing audio and generating a summary.
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
  summary: z.string().describe('A concise summary of the meeting transcript.'),
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
Second, based on the transcript you just created, generate a concise summary of the meeting's key outcomes, decisions, and action items.

The summary should be written in a professional, neutral tone suitable for official records.

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
