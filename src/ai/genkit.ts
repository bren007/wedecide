import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config';

// Explicitly define the model we want to use.
// This provides a clear, unambiguous reference and avoids resolution issues.
const flash = googleAI.model('gemini-1.5-flash');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Set the default model for the app to our explicitly defined 'flash' model.
  model: flash,
});
