
import type { Decision, Objective } from './types';

// In a real application, this would be a database.
// For this demo, we're using a mutable in-memory array.
const objectives: Objective[] = [
  { id: 'OBJ-001', name: 'Improve Public Service Delivery', description: 'Enhance the efficiency, accessibility, and quality of services provided to the public.' },
  { id: 'OBJ-002', name: 'Enhance Public Trust and Transparency', description: 'Increase transparency in government operations and build greater public trust.' },
  { id: 'OBJ-003', name: 'Foster Sustainable Economic Development', description: 'Promote economic growth that is socially inclusive and environmentally sustainable.' },
  { id: 'OBJ-004', name: 'Strengthen International Cooperation', description: 'Enhance collaboration with international partners to address global challenges.' },
];

export let decisions: Decision[] = [
  {
    id: 'DEC-008',
    proposalTitle: 'Digital Identity Verification Platform',
    decision: 'Approve the budget and operational plan for the development of a national digital identity verification platform.',
    background: 'To improve access to digital government services and enhance security, this proposal outlines the plan and budget for a national digital identity platform. This includes development, security audits, and a phased public rollout. The projected benefit is a significant reduction in fraud and improved access to public services.',
    decisionType: 'Approve',
    status: 'Submitted',
    submittedAt: new Date('2023-10-25T10:00:00Z').toISOString(),
    objectiveId: 'OBJ-001',
    alignmentScore: 90,
    governanceLevel: 'Strategic Board',
    submittingOrganisation: 'Technology and Digital Services Agency',
    consultations: [
      { party: 'Treasury Board Secretariat', status: 'Supports with conditions', comment: 'Support is conditional on a revised cost-benefit analysis within 30 days.' },
      { party: 'Office of the Privacy Commissioner', status: 'Neutral', comment: 'No objections, provided the final implementation adheres to the Privacy Impact Assessment recommendations.' },
      { party: 'National Cyber Security Centre', status: 'Supports' },
    ]
  },
  {
    id: 'DEC-001',
    proposalTitle: 'National Broadband Network Expansion - Phase 2',
    decision: 'Approve the Phase 2 funding allocation of $250M for the National Broadband Network to connect 500,000 additional rural households.',
    background: 'Phase 1 of the National Broadband Network has successfully connected over 1 million households. This proposal outlines the funding required for Phase 2, which will extend high-speed internet access to 500,000 rural and underserved households, fostering economic development and improving access to digital services. The proposal details the projected costs, timeline, and economic impact.',
    decisionType: 'Approve',
    status: 'Scheduled for Meeting',
    submittedAt: new Date('2023-10-15T09:00:00Z').toISOString(),
    objectiveId: 'OBJ-003',
    relatedDecisionIds: ['DEC-004'],
    alignmentScore: 85,
    governanceLevel: 'Program',
    submittingOrganisation: 'Department of Communications and Digital Economy',
    consultations: [
        { party: 'Infrastructure Development Agency', status: 'Supports' },
        { party: 'Regional Development Councils', status: 'Supports' },
        { party: 'Telecommunications Regulatory Authority', status: 'Supports' },
    ]
  },
  {
    id: 'DEC-002',
    proposalTitle: 'Open Government Data Policy',
    decision: 'Endorse the adoption of the proposed Open Government Data Policy to standardize the proactive release of non-sensitive government data.',
    background: 'The draft Open Government Data Policy aims to make government more transparent and accountable by proactively releasing non-sensitive datasets to the public. This proposal seeks endorsement for the policy, which will foster innovation and allow for greater public scrutiny of government operations. The policy includes guidelines for data anonymization and publication standards.',
    decisionType: 'Endorse',
    status: 'In Review',
    submittedAt: new Date('2023-10-20T14:30:00Z').toISOString(),
    objectiveId: 'OBJ-002',
    alignmentScore: 92,
    governanceLevel: 'Strategic Board',
    submittingOrganisation: 'Inter-Agency Task Force on Transparency',
    consultations: [
        { party: 'National Archives', status: 'Supports' },
        { party: 'Chief Information Officer Council', status: 'Awaiting Response' },
        { party: 'Public Sector Transparency Board', status: 'Supports' },
    ]
  },
  {
    id: 'DEC-003',
    proposalTitle: 'Revised Public Consultation Guidelines',
    decision: 'Note the updated Public Consultation Guidelines, which establish new standards for engaging with citizens on policy development.',
    background: 'This document provides an overview of the revised guidelines for public consultations. The key changes include a requirement for multi-channel engagement (online and in-person), a minimum 30-day consultation period, and a mandate to publish a summary of feedback received. This is for noting purposes.',
    decisionType: 'Note',
    status: 'Awaiting Update',
    submittedAt: new Date('2023-10-22T11:00:00Z').toISOString(),
    objectiveId: 'OBJ-002',
    governanceLevel: 'Strategic Board',
    submittingOrganisation: 'Cabinet Office',
  },
  {
    id: 'DEC-004',
    proposalTitle: 'International Climate Change Summit Delegation',
    decision: 'Approve the proposed delegation and negotiation mandate for the upcoming International Climate Change Summit.',
    background: 'This proposal outlines the proposed members of the national delegation for the upcoming summit and the key priorities for negotiation, focusing on emissions reduction targets and international carbon markets.',
    decisionType: 'Approve',
    status: 'Approved',
    submittedAt: new Date('2023-09-01T10:00:00Z').toISOString(),
    decidedAt: new Date('2023-09-08T10:00:00Z').toISOString(),
    objectiveId: 'OBJ-004',
    alignmentScore: 78,
    governanceLevel: 'Strategic Board',
    submittingOrganisation: 'Ministry of Environment',
    consultations: [
        { party: 'Ministry of Foreign Affairs', status: 'Supports' },
        { party: 'Ministry of Trade and Industry', status: 'Supports' },
    ]
  },
  {
    id: 'DEC-005',
    proposalTitle: 'Partnership with Global Aid Organization',
    decision: 'Endorse the strategic partnership agreement with the Global Aid Organization to co-finance and implement a sanitation program in developing countries.',
    background: 'A strategic partnership opportunity has emerged with the Global Aid Organization to improve sanitation infrastructure in 5 target countries. This collaboration would leverage our technical expertise and their field presence. This proposal is to endorse the partnership agreement draft.',
    decisionType: 'Endorse',
    status: 'Endorsed',
    submittedAt: new Date('2023-09-05T16:00:00Z').toISOString(),
    decidedAt: new Date('2023-09-15T16:00:00Z').toISOString(),
    objectiveId: 'OBJ-004',
    alignmentScore: 95,
    governanceLevel: 'Program',
    submittingOrganisation: 'Development Agency',
  },
  {
    id: 'DEC-006',
    proposalTitle: 'National Cybersecurity Awareness Campaign',
    decision: 'Note the details of the "CyberSafe" national awareness campaign.',
    background: 'Details of the upcoming national cybersecurity awareness campaign, "CyberSafe". The campaign will target citizens and small businesses to promote best practices in online security. This is for the board to note.',
    decisionType: 'Note',
    status: 'Noted',
    submittedAt: new Date('2023-09-10T12:00:00Z').toISOString(),
    decidedAt: new Date('2023-09-12T12:00:00Z').toISOString(),
    objectiveId: 'OBJ-001',
    alignmentScore: 88,
    relatedDecisionIds: ['DEC-001'],
    governanceLevel: 'Project',
    submittingOrganisation: 'National Cyber Security Centre',
  },
   {
    id: 'DEC-007',
    proposalTitle: 'Public Transport Infrastructure Modernization - Phase 1',
    decision: 'Agree to proceed with Phase 1 of the public transport infrastructure modernization, pending final vendor selection for the ticketing system.',
    background: 'The initial phase of the transport overhaul requires approval. This includes station upgrades and a new integrated ticketing system. The attached document has the full cost-benefit analysis. The proposal has been reviewed by the treasury but requires further clarification on vendor selection.',
    decisionType: 'Agree',
    status: 'Awaiting Update',
    submittedAt: new Date('2023-10-21T18:00:00Z').toISOString(),
    objectiveId: 'OBJ-001',
    governanceLevel: 'Program',
    submittingOrganisation: 'Department for Transport',
    consultations: [
        { party: 'Treasury Department', status: 'Supports with conditions', comment: 'Awaiting final vendor selection for the ticketing system.' },
        { party: 'Public Works Agency', status: 'Supports' },
    ]
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
