import type { Decision, DecisionStatus, Objective, GovernanceLevel } from './types';

// In a real application, this would be a database.
// For this demo, we're using a mutable in-memory array.
const objectives: Objective[] = [
  { id: 'OBJ-001', name: 'Market Expansion', description: 'Expand market share in emerging regions by 15%.' },
  { id: 'OBJ-002', name: 'Operational Efficiency', description: 'Reduce operational costs by 10% through automation.' },
  { id: 'OBJ-003', name: 'Product Innovation', description: 'Launch two new major product features this year.' },
  { id: 'OBJ-004', name: 'Customer Satisfaction', description: 'Improve customer satisfaction score to 95%.' },
];

export let decisions: Decision[] = [
  {
    id: 'DEC-001',
    title: 'Project Phoenix: Q3 Budget Allocation',
    background: 'Project Phoenix is entering its third quarter and requires a significant budget allocation to scale operations. The project has met all its Q2 milestones and is projected to exceed its annual targets. This proposal outlines the need for an additional $250,000 for new hires, marketing, and infrastructure upgrades. The finance department has reviewed the preliminary request and found it to be within the company\'s strategic investment framework.',
    decisionType: 'Approve',
    status: 'Scheduled for Meeting',
    submittedAt: new Date('2023-10-15T09:00:00Z').toISOString(),
    objectiveId: 'OBJ-003',
    relatedDecisionIds: ['DEC-004'],
    alignmentScore: 85,
    governanceLevel: 'Project',
  },
  {
    id: 'DEC-002',
    title: 'Adoption of New HR Management Software',
    background: 'The current HR software is outdated, leading to inefficiencies in payroll, recruitment, and employee data management. After evaluating several market-leading solutions, the HR department recommends adopting "HR-Flow", a cloud-based platform that promises to streamline all HR processes. This proposal seeks endorsement for the transition, with a projected implementation timeline of 6 months.',
    decisionType: 'Endorse',
    status: 'In Review',
    submittedAt: new Date('2023-10-20T14:30:00Z').toISOString(),
    objectiveId: 'OBJ-002',
    alignmentScore: 92,
    governanceLevel: 'Program',
  },
  {
    id: 'DEC-003',
    title: 'Updated Work-From-Home Policy',
    background: 'This document provides an overview of the proposed changes to the company\'s work-from-home policy. The key changes include a hybrid model requiring employees to be in the office three days a week and new guidelines for home office setup and security. This is for noting purposes, and feedback will be collected in a separate forum.',
    decisionType: 'Note',
    status: 'Awaiting Update',
    submittedAt: new Date('2023-10-22T11:00:00Z').toISOString(),
    objectiveId: 'OBJ-004',
    governanceLevel: 'Strategic Board',
  },
  {
    id: 'DEC-004',
    title: 'Annual Company Offsite Event 2024',
    background: 'Proposal for the annual company offsite event. The proposed location is a resort in the mountains, with a focus on team-building activities and strategic planning sessions. The total estimated cost is $80,000.',
    decisionType: 'Approve',
    status: 'Approved',
    submittedAt: new Date('2023-09-01T10:00:00Z').toISOString(),
    objectiveId: 'OBJ-004',
    governanceLevel: 'Strategic Board',
  },
  {
    id: 'DEC-005',
    title: 'New Partnership with Innovate Inc.',
    background: 'A strategic partnership opportunity has emerged with Innovate Inc., a leader in the AI research space. This collaboration would give us access to their proprietary technology, accelerating our product development. This proposal is to endorse the partnership agreement draft.',
    decisionType: 'Endorse',
    status: 'Endorsed',
    submittedAt: new Date('2023-09-05T16:00:00Z').toISOString(),
    objectiveId: 'OBJ-001',
    governanceLevel: 'Program',
  },
  {
    id: 'DEC-006',
    title: 'Q4 Marketing Campaign Launch',
    background: 'Details of the upcoming Q4 marketing campaign, "Future Forward". The campaign will target new demographics through social media and influencer collaborations. This is for the board to note.',
    decisionType: 'Note',
    status: 'Noted',
    submittedAt: new Date('2023-09-10T12:00:00Z').toISOString(),
    objectiveId: 'OBJ-001',
    relatedDecisionIds: ['DEC-001'],
    governanceLevel: 'Project',
  },
   {
    id: 'DEC-007',
    title: 'IT Infrastructure Overhaul Phase 1',
    background: 'The initial phase of the IT infrastructure overhaul requires approval. This includes server upgrades and migrating to a new cloud provider. The attached document has the full cost-benefit analysis and risk assessment. The proposal has been reviewed by the finance team but requires further clarification on vendor selection before proceeding.',
    decisionType: 'Approve',
    status: 'Awaiting Update',
    submittedAt: new Date('2023-10-21T18:00:00Z').toISOString(),
    objectiveId: 'OBJ-002',
    governanceLevel: 'Program',
  },
];

export async function getDecisions(): Promise<Decision[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 100));
  return decisions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getDecisionById(id: string): Promise<Decision | undefined> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 50));
  return decisions.find(d => d.id === id);
}

export async function getObjectives(): Promise<Objective[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 50));
  return objectives;
}

export async function getObjectiveById(id: string): Promise<Objective | undefined> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 50));
  return objectives.find(o => o.id === id);
}
