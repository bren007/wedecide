
export type Objective = {
  id: string;
  name: string;
  description: string;
};

export type Consultation = {
  party: string;
  status: 'Supports' | 'Supports with conditions' | 'Neutral' | 'Opposed' | 'Awaiting Response';
  comment?: string;
};

export type Decision = {
  id: string;
  proposalTitle: string;
  decisionSought: string;
  finalDecision?: string;
  decisionNote?: string;
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
  consultations?: Consultation[];
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
