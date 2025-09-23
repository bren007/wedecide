'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersion, DecisionBrief } from '@/lib/types';
import type { GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { FieldValue } from 'firebase-admin/firestore';

// This action creates a new Decision Brief document in Firestore.
export async function createBrief(
  briefData: GenerateInitialBriefOutput
): Promise<string> {
  const { user } = await getAuthenticatedUser();
  const { db } = initializeAdmin();

  if (!user) {
    throw new Error('You must be logged in to create a brief.');
  }

  const briefsCollection = db.collection('decisionBriefs');
  const newBriefRef = briefsCollection.doc();

  const firstVersion: BriefVersion = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    content: briefData.brief,
    agentQuestions: briefData.agentQuestions,
  };

  const newBrief: DecisionBrief = {
    id: newBriefRef.id,
    tenantId: user.profile.tenantId,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    versions: [firstVersion],
  };

  await newBriefRef.set(newBrief);

  return newBriefRef.id;
}
