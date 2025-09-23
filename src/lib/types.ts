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

export type BriefVersion = {
  version: number;
  createdAt: string;
  createdBy: string;
  content: DecisionBriefContent;
  agentQuestions?: string[];
  userResponses?: Record<string, string>;
};

export type DecisionBriefContent = {
  goal: string;
  title: string;
  strategicCase: string; // User-editable
  optionsAnalysis: string; // AI-generated
  recommendation: string; // AI-generated
  financialCase: string; // AI-generated
  alignmentScore: number;
  alignmentRationale: string;
};

export type DecisionBrief = {
  id: string; // Firestore document ID
  tenantId: string;
  status: 'Draft' | 'InReview' | 'Scheduled' | 'Decided' | 'Archived';
  finalDecision?: string;
  amendments?: string;
  createdAt: string;
  createdBy: string; // UID
  versions: BriefVersion[];
};
