
import { z } from 'genkit';

export const ClarifyGoalInputSchema = z.object({
  userGoal: z
    .string()
    .describe("The user's initial goal or problem statement."),
});
export type ClarifyGoalInput = z.infer<typeof ClarifyGoalInputSchema>;

export const ClarificationQuestionSchema = z.object({
  category: z
    .string()
    .describe("The category of the question (e.g., 'Strategic Alignment')."),
  question: z.string().describe('A specific, insightful question for the user.'),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

export const ClarifyGoalOutputSchema = z.object({
  questions: z
    .array(ClarificationQuestionSchema)
    .describe(
      'A list of focused clarifying questions for the user to help confirm intent and fill gaps.'
    ),
});
export type ClarifyGoalOutput = z.infer<typeof ClarifyGoalOutputSchema>;
