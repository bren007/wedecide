'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config';

// This explicit definition is the key to resolving the model resolution error.
// It creates an unambiguous reference to the correct, stable model identifier.
export const flash = googleAI.model('gemini-1.5-flash');

export const ai = genkit({
  plugins: [
    googleAI({
      // Ensure the API key is passed correctly.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Setting the default model for the entire application to our explicitly
  // defined and correctly resolved `flash` model.
  model: flash,
});
