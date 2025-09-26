
import { ai, flash } from '@/ai/genkit';
import { z } from 'zod';

/**
 * @fileOverview A minimal Genkit flow for testing the core AI call.
 */

// Define the Genkit flow.
export const clarifyGoalFlow = ai.defineFlow(
  {
    name: 'clarifyGoalFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (userGoal) => {
    const prompt = `You are an expert consultant. The user's goal is: "${userGoal}". Respond with a single, insightful clarifying question.`;
    
    const { output } = await ai.generate({
        model: flash,
        prompt: prompt,
    });

    if (!output) {
        throw new Error('The agent failed to generate a response.');
    }

    return output;
  }
);
