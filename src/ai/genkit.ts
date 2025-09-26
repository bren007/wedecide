
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config';

// This explicit definition is the key to resolving model resolution errors.
// It creates an unambiguous reference to the correct, stable model identifier.
export const flash = googleAI.model('gemini-1.5-flash');

export const ai = genkit({
  plugins: [
    googleAI({
      // By explicitly listing the models we intend to use, we prevent
      // the faulty auto-discovery/resolution that was causing the 404 error.
      models: [flash],
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
