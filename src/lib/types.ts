import type { User as FirebaseUser } from 'firebase/auth';
import { z } from 'zod';

export type UserRole =
  | 'admin'
  | 'member'
  | 'chair'
  | 'secretariat'
  | 'observer'
  | 'auditor';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string;
  invitedBy?: string;
  createdAt: string;
};

export interface AuthenticatedUser extends FirebaseUser {
  profile: UserProfile;
}

export type Objective = {
  id: string;
  name:string;
  description: string;
};

// Zod Schemas for AI Flows - This is the single source of truth

export const ClarifyGoalInputSchema = z.object({
  userGoal: z.string().describe("The user's initial goal or problem statement."),
});

export const ClarificationQuestionSchema = z.object({
  category: z
    .string()
    .describe("The category of the question (e.g., 'Strategic Alignment', 'Scope and Constraints')."),
  question: z.string().describe('A specific, insightful question for the user.'),
});

export const ClarifyGoalOutputSchema = z.object({
  questions: z
    .array(ClarificationQuestionSchema)
    .describe('A list of focused clarifying questions for the user to help confirm intent and fill gaps.'),
});

export const BriefContentSchema = z.object({
  title: z.string().describe("A clear, concise title for the decision brief."),
  strategicCase: z.string().describe("A summary of the strategic case for the decision, explaining why it's important."),
  recommendation: z.string().describe("The agent's recommended course of action."),
  alignmentScore: z.number().describe("A score from 0 to 100 indicating how well the proposal aligns with strategic goals."),
  alignmentRationale: z.string().describe("A brief explanation for the alignment score, referencing specific strategic goals."),
});

export const FullArtifactContentSchema = z.object({
  title: z.string().describe("A clear, concise, and official title for the full decision artifact."),
  strategicCase: z.string().describe("The full strategic case for the decision, explaining in detail why it's important, the problem it solves, and how it aligns with organizational goals. This should be comprehensive."),
  optionsAnalysis: z.string().describe("A detailed analysis of the different options available, including a 'do nothing' option, with a summary of pros and cons for each."),
  recommendation: z.string().describe("The agent's fully justified recommended course of action, explaining why it was chosen over other options."),
  financialCase: z.string().describe("A detailed summary of the financial implications, including budget impact and potential return on investment."),
});

export const RefineBriefInputSchema = z.object({
  instruction: z.string().describe("The user's instruction for how to refine the document."),
  existingBrief: BriefContentSchema.describe('The existing concise summary layer of the document.'),
  existingArtifact: FullArtifactContentSchema.describe('The existing comprehensive, detailed layer of the document.'),
});

export const RefineBriefOutputSchema = z.object({
  brief: BriefContentSchema.describe('The new, refined concise summary layer of the document.'),
  fullArtifact: FullArtifactContentSchema.describe('The new, refined comprehensive, detailed layer of the document.'),
});


// TypeScript types derived from Zod schemas

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;
export type ClarifyGoalInput = z.infer<typeof ClarifyGoalInputSchema>;
export type ClarifyGoalOutput = z.infer<typeof ClarifyGoalOutputSchema>;

export type BriefContent = z.infer<typeof BriefContentSchema>;
export type FullArtifactContent = z.infer<typeof FullArtifactContentSchema>;
export type RefineBriefInput = z.infer<typeof RefineBriefInputSchema>;
export type RefineBriefOutput = z.infer<typeof RefineBriefOutputSchema>;

export type DecisionBriefV2 = {
  id: string;
  tenantId: string;
  status: 'Discovery' | 'Draft' | 'InReview' | 'Deliberation' | 'Decided' | 'Archived';
  goal: string;
  createdAt: string;
  createdBy: string; // UID
  versions: BriefVersionV2[];
};

export type BriefVersionV2 = {
  version: number;
  createdAt: string;
  createdBy: string; // UID of user who triggered this version
  refinementInstruction?: string;
  userResponses?: Record<string, string>; // User answers to agentQuestions
  brief: BriefContent;
  fullArtifact: FullArtifactContent;
};
