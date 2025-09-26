import type { User as FirebaseUser } from 'firebase/auth';

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

// Types for the Goal Clarification AI Flow
export type ClarificationQuestion = {
  category: string;
  question: string;
};

export type ClarifyGoalOutput = {
  questions: ClarificationQuestion[];
};

export type ClarifyGoalInput = {
  userGoal: string;
};


// V2 Brief Types (The new standard for the application)
export type BriefContent = {
  title: string;
  strategicCase: string;
  recommendation: string;
  alignmentScore: number;
  alignmentRationale: string;
};

export type FullArtifactContent = {
  title: string;
  strategicCase: string;
  optionsAnalysis: string;
  recommendation: string;
  financialCase: string;
};

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
