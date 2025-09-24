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

export type AgentQuestion = {
  question: string;
  rationale: string;
}

// --- V1 Brief Types (Pre-refactor) ---
export type DecisionBriefContent = {
  goal: string;
  title: string;
  strategicCase: string; 
  optionsAnalysis: string;
  recommendation: string; 
  financialCase: string; 
  alignmentScore: number;
  alignmentRationale: string;
};

export type BriefVersion = {
  version: number;
  createdAt: string;
  createdBy: string;
  content: DecisionBriefContent;
  agentQuestions?: AgentQuestion[];
  userResponses?: Record<string, string>;
};

export type DecisionBrief = {
  id: string; 
  tenantId: string;
  status: 'Draft' | 'InReview' | 'Scheduled' | 'Decided' | 'Archived';
  finalDecision?: string;
  amendments?: string;
  createdAt: string;
  createdBy: string; 
  versions: BriefVersion[];
};


// --- V2 Brief Types (Post-refactor for new agentic flow) ---

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
  
  // Stage 1: Discovery output
  identifiedSources?: string[];
  agentQuestions?: AgentQuestion[];
  userResponses?: Record<string, string>; // User answers to agentQuestions

  // Stage 2: Generated content
  brief?: BriefContent;
  fullArtifact?: FullArtifactContent;

  // Stage 2 refinement instruction
  refinementInstruction?: string;
};
