
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersion, DecisionBrief, DecisionBriefContent } from '@/lib/types';
import { generateInitialBrief, type GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { refineBrief } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';

/**
 * A single server action that orchestrates the entire initial brief creation process.
 * 1. Calls the AI agent to generate the initial brief.
 * 2. Creates the brief document in Firestore.
 * @param goal The user's initial goal statement.
 * @returns The ID of the newly created brief.
 */
export async function startBriefingProcess(goal: string): Promise<string> {
   if (!goal) {
    throw new Error('Goal cannot be empty.');
  }
  
  // 1. Call the agentic AI flow
  const result = await generateInitialBrief({ goal });

  // 2. Create the brief in the database
  const newBriefId = await createBrief(result);

  // 3. Revalidate path to ensure the new brief page is not stale (optional but good practice)
  revalidatePath(`/brief/${newBriefId}`);

  return newBriefId;
}


// This action creates a new Decision Brief document in Firestore.
export async function createBrief(
  briefData: GenerateInitialBriefOutput
): Promise<string> {
  const { user } = await getAuthenticatedUser();
  const { db } = initializeAdmin();

  if (!user || !user.profile.tenantId) {
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
    const { user } = await getAuthenticatedUser();
    const { db } = initializeAdmin();

    if (!user || !user.profile.tenantId) {
        throw new Error('Authentication required.');
    }

    const briefDoc = await db.collection('decisionBriefs')
        .where('id', '==', id)
        .where('tenantId', '==', user.profile.tenantId)
        .limit(1)
        .get();

    if (briefDoc.empty) {
      console.log(`No brief found with id ${id} for tenant ${user.profile.tenantId}`);
      return null;
    }
    
    return briefDoc.docs[0].data() as DecisionBrief;
  } catch (error) {
    console.error(`Failed to fetch brief ${id}`, error);
    return null;
  }
}

export async function addBriefVersion(briefId: string, userResponses: Record<string, string>) {
    const { user } = await getAuthenticatedUser();
    const { db } = initializeAdmin();

    if (!user || !user.profile.tenantId) {
        throw new Error('You must be logged in to refine a brief.');
    }

    const briefQuery = await db.collection('decisionBriefs')
        .where('id', '==', briefId)
        .where('tenantId', '==', user.profile.tenantId)
        .limit(1)
        .get();
        
    if (briefQuery.empty) {
        throw new Error('Brief not found or you do not have permission to access it.');
    }

    const briefRef = briefQuery.docs[0].ref;
    const existingBrief = briefQuery.docs[0].data() as DecisionBrief;
    const latestVersion = existingBrief.versions.at(-1);

    if (!latestVersion) {
        throw new Error('Cannot refine a brief with no versions.');
    }
    
    // Call the AI agent to get the refined content
    const refinedContent: DecisionBriefContent = await refineBrief({
        existingBrief: latestVersion.content,
        userResponses,
    });

    const newVersion: BriefVersion = {
        version: existingBrief.versions.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        content: refinedContent,
        agentQuestions: [], // The refineBrief flow does not ask follow-up questions
        userResponses: userResponses,
    };

    // A transaction is the robust way to handle this update.
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(briefRef);
      if (!doc.exists) {
        throw new Error("Document does not exist!");
      }
      const data = doc.data() as DecisionBrief;
      const currentVersions = data.versions;
      
      // The user responses should be stored with the version that *asked* the questions
      if (currentVersions.length > 0) {
        currentVersions[currentVersions.length - 1].userResponses = userResponses;
      }

      currentVersions.push(newVersion);
      transaction.update(briefRef, { versions: currentVersions });
    });
    
    // Invalidate the cache for the brief page
    revalidatePath(`/brief/${briefId}`);
}
