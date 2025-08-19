export type Objective = {
  id: string;
  name: string;
  description: string;
};

export type Decision = {
  id: string;
  title: string;
  background: string;
  decisionType: 'Approve' | 'Endorse' | 'Note';
  status: DecisionStatus;
  submittedAt: string;
  objectiveId: string;
  relatedDecisionIds?: string[];
  alignmentScore?: number;
  governanceLevel?: GovernanceLevel;
};

export type GovernanceLevel = 'Project' | 'Program' | 'Strategic Board';

export type DecisionStatus = 
  | 'Submitted'
  | 'In Review'
  | 'Scheduled for Meeting'
  | 'Approved'
  | 'Endorsed'
  | 'Noted'
  | 'Not Approved'
  | 'Awaiting Update';
