
export type Objective = {
  id: string;
  name: string;
  description: string;
};

export type Decision = {
  id: string;
  proposalTitle: string;
  decision: string;
  background: string;
  decisionType: 'Approve' | 'Endorse' | 'Note' | 'Agree' | 'Direct';
  status: DecisionStatus;
  submittedAt: string;
  decidedAt?: string;
  objectiveId: string;
  relatedDecisionIds?: string[];
  alignmentScore?: number;
  governanceLevel?: GovernanceLevel;
  submittingOrganisation?: string;
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
  | 'Awaiting Update'
  | 'Not Endorsed';
