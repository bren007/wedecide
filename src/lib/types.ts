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
};

export type DecisionStatus = 
  | 'Submitted'
  | 'In Review'
  | 'Scheduled for Meeting'
  | 'Approved'
  | 'Endorsed'
  | 'Noted'
  | 'Not Approved';