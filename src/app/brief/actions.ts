
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersion, DecisionBrief, DecisionBriefContent } from '@/lib/types';
import { generateInitialBrief, type GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { refineBrief } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * A single server action that orchestrates the entire initial brief creation process.
 * 1. Calls the AI agent to generate the initial brief.
 * 2. Creates the brief document in Firestore.
 * @param goal The user's initial goal statement.
 * @returns The ID of the newly created brief.
 */
export async function startBriefingProcess(goal: string): Promise<string> {
  console.log('startBriefingProcess: Action initiated with goal:', goal);
   if (!goal) {
    console.error('startBriefingProcess: Goal is empty.');
    throw new Error('Goal cannot be empty.');
  }
  
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      throw new Error('Authentication session not found.');
    }

    // 1. Call the agentic AI flow
    console.log('startBriefingProcess: Calling generateInitialBrief...');
    const result = await generateInitialBrief({ goal });
    console.log('startBriefingProcess: generateInitialBrief successful.');

    // 2. Create the brief in the database
    console.log('startBriefingProcess: Calling createBrief...');
    const newBriefId = await createBrief(result, sessionCookie);
    console.log('startBriefingProcess: createBrief successful. New ID:', newBriefId);


    // 3. Revalidate path to ensure the new brief page is not stale (optional but good practice)
    revalidatePath(`/brief/${newBriefId}`);

    return newBriefId;
  } catch (error) {
    console.error('startBriefingProcess: An error occurred.', error);
    throw error; // Re-throw the error to be caught by the client
  }
}


// This action creates a new Decision Brief document in Firestore.
export async function createBrief(
  briefData: GenerateInitialBriefOutput,
  sessionCookie: string
): Promise<string> {
  const { user } = await getAuthenticatedUser(sessionCookie);
  const { db } = initializeAdmin();

  if (!user || !user.profile.tenantId) {
    console.error('createBrief: User not authenticated or missing tenantId.');
    throw new Error('You must be logged in to create a brief.');
  }
  console.log(`createBrief: Authenticated user ${user.uid} in tenant ${user.profile.tenantId}.`);

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
  
  console.log('createBrief: Preparing to set new brief document with ID:', newBriefRef.id);
  await newBriefRef.set(newBrief);
  console.log('createBrief: Document successfully created in Firestore.');

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
    console.log(`addBriefVersion: Action initiated for briefId: ${briefId}`);
    const sessionCookie = cookies().get('session')?.value;
    const { user } = await getAuthenticatedUser(sessionCookie);
    const { db } = initializeAdmin();

    if (!user || !user.profile.tenantId) {
        console.error('addBriefVersion: User not authenticated or missing tenantId.');
        throw new Error('You must be logged in to refine a brief.');
    }
     console.log(`addBriefVersion: Authenticated user ${user.uid} in tenant ${user.profile.tenantId}.`);

    const briefQuery = await db.collection('decisionBriefs')
        .where('id', '==', briefId)
        .where('tenantId', '==', user.profile.tenantId)
        .limit(1)
        .get();
        
    if (briefQuery.empty) {
        console.error(`addBriefVersion: Brief not found with ID ${briefId} for tenant ${user.profile.tenantId}.`);
        throw new Error('Brief not found or you do not have permission to access it.');
    }

    const briefRef = briefQuery.docs[0].ref;
    const existingBrief = briefQuery.docs[0].data() as DecisionBrief;
    const latestVersion = existingBrief.versions.at(-1);

    if (!latestVersion) {
        console.error(`addBriefVersion: Cannot refine a brief with no versions (ID: ${briefId}).`);
        throw new Error('Cannot refine a brief with no versions.');
    }
    
    // Call the AI agent to get the refined content
    console.log('addBriefVersion: Calling refineBrief flow...');
    const refinedContent: DecisionBriefContent = await refineBrief({
        existingBrief: latestVersion.content,
        userResponses,
    });
     console.log('addBriefVersion: refineBrief flow successful.');

    const newVersion: BriefVersion = {
        version: existingBrief.versions.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        content: refinedContent,
        agentQuestions: [], // The refineBrief flow does not ask follow-up questions
        userResponses: userResponses,
    };
    
    console.log(`addBriefVersion: Preparing to add version ${newVersion.version} to brief ${briefId}.`);
    // Atomically add the new version to the versions array.
    await briefRef.update({
        versions: [...existingBrief.versions, newVersion]
    });
    console.log(`addBriefVersion: Successfully added new version to brief ${briefId}.`);
    
    // Invalidate the cache for the brief page
    revalidatePath(`/brief/${briefId}`);
}
