
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
    decisionSought: 'Approve the budget and operational plan for the development of a national digital identity verification platform.',
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
    decisionSought: 'Approve the Phase 2 funding allocation of $250M for the National Broadband Network to connect 500,000 additional rural households.',
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
    decisionSought: 'Endorse the adoption of the proposed Open Government Data Policy to standardize the proactive release of non-sensitive government data.',
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
    decisionSought: 'Note the updated Public Consultation Guidelines, which establish new standards for engaging with citizens on policy development.',
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
    decisionSought: 'Approve the proposed delegation and negotiation mandate for the upcoming International Climate Change Summit.',
    finalDecision: 'The proposed delegation for the International Climate Change Summit is approved. The negotiation mandate is approved with the amendment that carbon market negotiations must prioritize transparency and human rights safeguards.',
    decisionNote: 'The delegation is instructed to provide daily progress reports to the Secretariat.',
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
    decisionSought: 'Endorse the strategic partnership agreement with the Global Aid Organization to co-finance and implement a sanitation program in developing countries.',
    finalDecision: 'The strategic partnership agreement with the Global Aid Organization is endorsed.',
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
    decisionSought: 'Note the details of the "CyberSafe" national awareness campaign.',
    finalDecision: 'The details of the "CyberSafe" national awareness campaign are noted.',
    decisionNote: 'The communications team is to report on campaign metrics quarterly.',
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
    decisionSought: 'Agree to proceed with Phase 1 of the public transport infrastructure modernization, pending final vendor selection for the ticketing system.',
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

export const sampleBusinessCase = `
BUSINESS CASE: NATIONAL DIGITAL IDENTITY VERIFICATION PLATFORM

1. Executive Summary
This document outlines the business case for the development and implementation of a National Digital Identity Verification Platform. The platform will provide a secure, reliable, and user-friendly way for citizens to verify their identity online, unlocking access to a wide range of digital government and private sector services. The total requested investment is $15M over two years, with an expected net benefit of $50M over five years through fraud reduction and administrative efficiencies. The primary decision sought is to approve the budget and operational plan to proceed with the project.

2. Problem Statement
Currently, citizens face a fragmented and often insecure process for accessing digital services, requiring multiple logins and passwords. This leads to user frustration, high administrative costs for government agencies, and significant security risks. The lack of a trusted digital identity framework is a major barrier to the digital transformation of public services.

3. Proposed Solution
We propose the creation of a centralized, federated digital identity platform. This platform will allow citizens to create a single, secure digital identity, which can be used across all government services. It will be built on open standards to ensure interoperability and future-proofing.

4. Strategic Alignment
This project directly supports the national strategic objective of 'Improving Public Service Delivery' (OBJ-001) by making services more accessible, efficient, and secure.

5. Cost-Benefit Analysis
- Costs: Total project cost is estimated at $15M over two years, covering development, infrastructure, and a public awareness campaign.
- Benefits: Projected benefits include a $30M reduction in identity fraud, $15M in administrative savings, and $5M in improved service delivery efficiency over five years.

6. Risk Assessment
- Key risks include potential for data breaches, low public adoption, and vendor lock-in.
- Mitigation strategies include undergoing independent security audits, a phased rollout with a strong public communication plan, and using open-source technologies.

7. Decision Sought
Approve the budget of $15M and the operational plan for the development of a national digital identity verification platform.
`;


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
