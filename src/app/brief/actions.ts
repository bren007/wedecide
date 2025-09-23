
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersion, DecisionBrief, DecisionBriefContent } from '@/lib/types';
import { generateInitialBrief, type GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { refineBrief } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * A server action that orchestrates the entire initial brief creation process.
 * This is a more robust, two-step process to avoid losing auth context on long-running AI flows.
 * 1. Creates an initial, empty brief document in Firestore to get a stable ID. This happens
 *    within the authenticated user's context.
 * 2. Calls the AI agent to generate the initial brief content.
 * 3. Updates the previously created brief document with the AI-generated content.
 * @param goal The user's initial goal statement.
 * @returns The ID of the newly created brief.
 */
export async function startBriefingProcess(goal: string): Promise<string> {
  console.log('startBriefingProcess: Action initiated with goal:', goal);
   if (!goal) {
    console.error('startBriefingProcess: Goal is empty.');
    throw new Error('Goal cannot be empty.');
  }

  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    console.error('startBriefingProcess: Authentication session not found.');
    throw new Error('Authentication session not found.');
  }

  try {
    // 1. Create a placeholder brief first to get an ID and validate auth.
    console.log('startBriefingProcess: Creating placeholder brief...');
    const newBriefId = await createPlaceholderBrief(goal, sessionCookie);
    console.log('startBriefingProcess: Placeholder brief created with ID:', newBriefId);

    // 2. Call the agentic AI flow to generate content.
    console.log('startBriefingProcess: Calling generateInitialBrief AI flow...');
    const result = await generateInitialBrief({ goal });
    console.log('startBriefingProcess: generateInitialBrief successful.');

    // 3. Update the placeholder brief with the AI-generated content.
    console.log('startBriefingProcess: Updating brief with AI content...');
    await updateBriefWithInitialContent(newBriefId, result, sessionCookie);
    console.log('startBriefingProcess: Brief update successful.');

    // 4. Revalidate path to ensure the new brief page is not stale.
    revalidatePath(`/brief/${newBriefId}`);

    return newBriefId;
  } catch (error) {
    console.error('startBriefingProcess: An error occurred.', error);
    // In a real app, you might want to delete the placeholder brief if the AI call fails.
    throw error; // Re-throw the error to be caught by the client
  }
}

// This is a new function to create a preliminary brief.
export async function createPlaceholderBrief(goal: string, sessionCookie: string): Promise<string> {
  const { user } = await getAuthenticatedUser(sessionCookie);
  const { db } = initializeAdmin();

  if (!user || !user.profile.tenantId) {
    throw new Error('You must be logged in to create a brief.');
  }

  const briefsCollection = db.collection('decisionBriefs');
  const newBriefRef = briefsCollection.doc();

  // Create a minimal brief. The content will be populated by the AI later.
  const placeholderContent: DecisionBriefContent = {
    goal: goal,
    title: `Drafting brief for: ${goal.substring(0, 50)}...`,
    strategicCase: 'Generating...',
    optionsAnalysis: 'Generating...',
    recommendation: 'Generating...',
    financialCase: 'Generating...',
    alignmentScore: 0,
    alignmentRationale: 'Generating...',
  };

  const firstVersion: BriefVersion = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    content: placeholderContent,
    agentQuestions: [], // No questions yet
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


// This is a new function to update the brief with the AI's output.
export async function updateBriefWithInitialContent(
  briefId: string,
  briefData: GenerateInitialBriefOutput,
  sessionCookie: string
): Promise<void> {
  const { user } = await getAuthenticatedUser(sessionCookie);
  const { db } = initializeAdmin();

  if (!user || !user.profile.tenantId) {
    throw new Error('You must be logged in to update a brief.');
  }

  const briefRef = db.collection('decisionBriefs').doc(briefId);
  const briefDoc = await briefRef.get();

  if (!briefDoc.exists || briefDoc.data()?.tenantId !== user.profile.tenantId) {
    throw new Error('Brief not found or you do not have permission to access it.');
  }
  
  const existingBrief = briefDoc.data() as DecisionBrief;

  const firstVersion: BriefVersion = {
    version: 1,
    createdAt: existingBrief.versions[0].createdAt,
    createdBy: existingBrief.versions[0].createdBy,
    content: briefData.brief, // This is the full content from the AI
    agentQuestions: briefData.agentQuestions,
  };

  // Replace the placeholder version with the real one.
  await briefRef.update({
    versions: [firstVersion]
  });
}

// This function is no longer needed as its logic is split between createPlaceholderBrief and updateBriefWithInitialContent
/*
export async function createBrief(
  briefData: GenerateInitialBriefOutput,
  sessionCookie: string
): Promise<string> {
  // ...
}
*/


export async function getBrief(id: string): Promise<DecisionBrief | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    throw new Error('Authentication session not found.');
  }
  
  try {
    const { user } = await getAuthenticatedUser(sessionCookie);
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
    if (!sessionCookie) {
        throw new Error('Authentication session not found.');
    }
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
