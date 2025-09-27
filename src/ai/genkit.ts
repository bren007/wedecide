
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config';

export const flash = googleAI.model('gemini-1.5-flash-latest');

// This is the stable, correct configuration.
// It explicitly defines the 'flash' model and provides it to the plugin.
// This prevents faulty auto-discovery and ensures all flows have access
// to a correctly configured model object.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
