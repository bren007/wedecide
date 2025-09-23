import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';
import {next} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(), // This is needed for Firestore integration
    next(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
