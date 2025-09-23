'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersion, DecisionBrief } from '@/lib/types';
import type { GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { refineBrief } from '@/ai/flows/refine-brief';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

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


export async function getBrief(id: string): Promise<DecisionBrief | null> {
  try {
    const { db } = initializeAdmin();
    const briefDoc = await db.collection('decisionBriefs').doc(id).get();

    if (!briefDoc.exists) {
      return null;
    }
    // Note: We're not doing RBAC/tenancy checks here yet, but will in middleware
    return briefDoc.data() as DecisionBrief;
  } catch (error) {
    console.error(`Failed to fetch brief ${id}`, error);
    return null;
  }
}

export async function addBriefVersion(briefId: string, userResponses: Record<string, string>) {
    const { user } = await getAuthenticatedUser();
    const { db } = initializeAdmin();

    if (!user) {
        throw new Error('You must be logged in to refine a brief.');
    }

    const briefRef = db.collection('decisionBriefs').doc(briefId);
    const briefDoc = await briefRef.get();

    if (!briefDoc.exists) {
        throw new Error('Brief not found.');
    }

    const existingBrief = briefDoc.data() as DecisionBrief;
    const latestVersion = existingBrief.versions.at(-1);

    if (!latestVersion) {
        throw new Error('Cannot refine a brief with no versions.');
    }
    
    // Mark the previous version with the user's responses
    latestVersion.userResponses = userResponses;

    // Call the AI agent to get the refined content
    const refinedContent = await refineBrief({
        existingBrief: latestVersion.content,
        userResponses,
    });

    const newVersion: BriefVersion = {
        version: existingBrief.versions.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        content: refinedContent,
        // The refineBrief flow does not currently ask follow-up questions,
        // but it could be extended to do so.
        agentQuestions: [], 
    };

    // Atomically add the new version to the array
    await briefRef.update({
        versions: FieldValue.arrayUnion(newVersion)
    });
    
    // Invalidate the cache for the brief page
    revalidatePath(`/brief/${briefId}`);
}
