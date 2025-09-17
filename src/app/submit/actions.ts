
'use server';

import { z } from 'zod';
import { decisions, sampleBusinessCase } from '@/lib/data';
import type { Decision, Consultation } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { analyzeDecisionDocument, type AnalyzeDecisionDocumentOutput } from '@/ai/flows/analyze-decision-document';

const ConsultationSchema = z.object({
  party: z.string().min(1, 'Party name is required.'),
  status: z.enum(['Supports', 'Supports with conditions', 'Neutral', 'Opposed', 'Awaiting Response']),
  comment: z.string().optional(),
});

const DecisionSchema = z.object({
  proposalTitle: z.string().min(5, 'Title must be at least 5 characters long.'),
  decisionSought: z.string().min(10, 'Decision must be at least 10 characters long.'),
  background: z.string().min(20, 'Background must be at least 20 characters long.'),
  decisionType: z.enum(['Approve', 'Endorse', 'Note', 'Agree', 'Direct'], {
    errorMap: () => ({ message: 'Please select a decision type.' }),
  }),
  objectiveId: z.string().min(1, 'Please select a strategic objective.'),
  governanceLevel: z.enum(['Project', 'Program', 'Strategic Board'], {
    errorMap: () => ({ message: 'Please select a governance group.' }),
  }),
  submittingOrganisation: z.string().min(1, 'Please enter the submitting organisation.'),
  consultations: z.array(ConsultationSchema).optional(),
});

export type FormState = {
  errors?: {
    proposalTitle?: string[];
    decisionSought?: string[];
    background?: string[];
    decisionType?: string[];
    objectiveId?: string[];
    governanceLevel?: string[];
    submittingOrganisation?: string[];
    consultations?: string[];
    consultationParty?: string[];
    consultationStatus?: string[];
  };
  message?: string;
};

async function addDecision(decision: Omit<Decision, 'id' | 'submittedAt' | 'status'>) {
    const newDecision: Decision = {
        ...decision,
        id: `DEC-${String(decisions.length + 1).padStart(3, '0')}`,
        submittedAt: new Date().toISOString(),
        status: 'Submitted',
        alignmentScore: Math.floor(Math.random() * 30) + 70, // Simulate score
    };
    decisions.unshift(newDecision);
    return newDecision;
}

export async function createDecision(prevState: FormState, formData: FormData) {

  const consultationParties = formData.getAll('consultationParty');
  const consultationStatuses = formData.getAll('consultationStatus');
  const consultationComments = formData.getAll('consultationComment');

  const consultations: Consultation[] = consultationParties.map((party, index) => ({
    party: party as string,
    status: consultationStatuses[index] as Consultation['status'],
    comment: consultationComments[index] as string | undefined,
  })).filter(c => c.party);


  const validatedFields = DecisionSchema.safeParse({
    proposalTitle: formData.get('proposalTitle'),
    decisionSought: formData.get('decisionSought'),
    background: formData.get('background'),
    decisionType: formData.get('decisionType'),
    objectiveId: formData.get('objectiveId'),
    governanceLevel: formData.get('governanceLevel'),
    submittingOrganisation: formData.get('submittingOrganisation'),
    consultations: consultations.length > 0 ? consultations : undefined,
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create decision. Please check the fields.',
    };
  }
  
  try {
    const newDecision = await addDecision(validatedFields.data);
    revalidatePath('/');
    revalidatePath(`/review/${newDecision.id}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Decision.',
    };
  }

  redirect('/');
}

// Action to analyze the document
export async function analyzeDocument(): Promise<AnalyzeDecisionDocumentOutput> {
    // In a real app, we'd get the content from a file upload.
    // For this prototype, we'll use a hardcoded sample business case.
    const result = await analyzeDecisionDocument({ documentContent: sampleBusinessCase });
    return result;
}
