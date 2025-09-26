
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config';

const flash = googleAI.model('gemini-1.5-flash');

// Reverted to the simplest possible configuration to establish a stable baseline.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      models: [flash],
      model: 'gemini-1.5-flash',
    }),
  ],
});
