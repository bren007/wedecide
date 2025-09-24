
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersionV2, DecisionBriefV2 } from '@/lib/types';
import { generateInitialBrief, type GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { generateDraftAndSummarize } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Creates an initial, empty brief document in Firestore.
 * This is a separate function to ensure it runs quickly and within the
 * primary server action context where authentication is available.
 */
async function createPlaceholderBrief(goal: string, uid: string, tenantId: string): Promise<string> {
  const { db } = initializeAdmin();
  const newBriefRef = db.collection('decisionBriefs').doc();

  const initialBrief: DecisionBriefV2 = {
    id: newBriefRef.id,
    tenantId: tenantId,
    status: 'Discovery',
    goal: goal,
    createdAt: new Date().toISOString(),
    createdBy: uid,
    versions: [], // Starts with no versions
  };

  await newBriefRef.set(initialBrief);
  return newBriefRef.id;
}

/**
 * Updates the brief with the discovery output from the AI agent.
 */
async function updateBriefWithDiscovery(briefId: string, discoveryOutput: GenerateInitialBriefOutput, uid: string) {
  const { db } = initializeAdmin();
  const briefRef = db.collection('decisionBriefs').doc(briefId);
  
  const firstVersion: BriefVersionV2 = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: uid,
    agentQuestions: discoveryOutput.agentQuestions,
    identifiedSources: discoveryOutput.identifiedSources,
  };

  await briefRef.update({
    versions: [firstVersion],
  });
}


/**
 * Stage 1: Kicks off the briefing process.
 * This is a two-step process to avoid authentication context issues with long-running AI flows.
 * 1. Quickly create a placeholder document in Firestore.
 * 2. Asynchronously run the AI discovery flow and update the document.
 * @param goal The user's initial goal statement.
 * @returns The ID of the newly created brief.
 */
export async function startBriefingProcess(goal: string): Promise<string> {
  console.log('startBriefingProcess: Action initiated with goal:', goal);
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    throw new Error('Authentication session not found.');
  }
  const { user } = await getAuthenticatedUser(sessionCookie);
  if (!user || !user.profile.tenantId) {
    throw new Error('User not authenticated or tenant ID is missing.');
  }

  try {
    // 1. Immediately create a placeholder brief to get an ID.
    console.log('startBriefingProcess: Creating placeholder brief...');
    const briefId = await createPlaceholderBrief(goal, user.uid, user.profile.tenantId);
    console.log('startBriefingProcess: Placeholder brief created with ID:', briefId);

    // 2. Now, call the agentic AI flow (this may take longer).
    // We will NOT await this. The client will be redirected immediately.
    // The AI will update the document in the background.
    console.log('startBriefingProcess: Calling generateInitialBrief (Discovery) AI flow...');
    generateInitialBrief({ goal }).then(discoveryOutput => {
      console.log(`startBriefingProcess: AI flow complete for brief ${briefId}. Updating document.`);
      // 3. Update the placeholder brief with the AI's discovery output.
      return updateBriefWithDiscovery(briefId, discoveryOutput, user.uid);
    }).catch(error => {
        // In a real app, you'd have more robust error handling, maybe updating
        // the brief's status to 'Failed' so the UI can show it.
        console.error(`startBriefingProcess: AI flow failed for brief ${briefId}`, error);
    });

    // 4. Revalidate and return the ID to the client immediately.
    revalidatePath(`/brief/${briefId}`);
    return briefId;

  } catch (error) {
    console.error('startBriefingProcess: An error occurred.', error);
    // Ensure we throw the error to be caught by the client-side transition
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred during the briefing process.');
  }
}

/**
 * Stage 2: Generates the draft document.
 * Takes the user's answers, calls the AI to generate the full artifact and summary brief,
 * and adds this as a new version to the existing brief document.
 * @param briefId The ID of the brief to update.
 * @param userResponses The user's answers to the agent's questions.
 */
export async function generateDraft(briefId: string, userResponses: Record<string, string>) {
    console.log(`generateDraft: Action initiated for briefId: ${briefId}`);
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) throw new Error('Authentication session not found.');
    const { user } = await getAuthenticatedUser(sessionCookie);
    if (!user || !user.profile.tenantId) throw new Error('User not authenticated.');

    const { db } = initializeAdmin();
    const briefRef = db.collection('decisionBriefs').doc(briefId);
    const briefDoc = await briefRef.get();

    if (!briefDoc.exists || briefDoc.data()?.tenantId !== user.profile.tenantId) {
        throw new Error('Brief not found or you do not have permission to access it.');
    }
    
    const existingBrief = briefDoc.data() as DecisionBriefV2;
    const latestVersion = existingBrief.versions.at(-1);

    if (!latestVersion) {
        throw new Error('Cannot generate draft for a brief with no versions.');
    }
    
    // Call the AI agent to get the generated artifact and summary
    console.log('generateDraft: Calling generateDraftAndSummarize flow...');
    const draftOutput = await generateDraftAndSummarize({
        goal: existingBrief.goal,
        userResponses,
    });
    console.log('generateDraft: generateDraftAndSummarize flow successful.');

    // Create a new version containing the generated content
    const newVersion: BriefVersionV2 = {
        version: existingBrief.versions.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        userResponses: userResponses, // Store the answers that generated this version
        brief: draftOutput.brief,
        fullArtifact: draftOutput.fullArtifact,
        // Carry over questions from the previous version for context
        agentQuestions: latestVersion.agentQuestions,
        identifiedSources: latestVersion.identifiedSources,
    };
    
    console.log(`generateDraft: Preparing to add version ${newVersion.version} to brief ${briefId}.`);
    // Atomically add the new version and update the brief's status
    await briefRef.update({
        versions: [...existingBrief.versions, newVersion],
        status: 'Draft',
    });
    console.log(`generateDraft: Successfully added new version to brief ${briefId}.`);
    
    revalidatePath(`/brief/${briefId}`);
}


export async function getBrief(id: string): Promise<DecisionBriefV2 | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) throw new Error('Authentication session not found.');
  const { user } = await getAuthenticatedUser(sessionCookie);
  if (!user || !user.profile.tenantId) throw new Error('Authentication required.');

  try {
    const { db } = initializeAdmin();
    const briefDoc = await db.collection('decisionBriefs').doc(id).get();

    if (!briefDoc.exists || briefDoc.data()?.tenantId !== user.profile.tenantId) {
      console.log(`No brief found with id ${id} for tenant ${user.profile.tenantId}`);
      return null;
    }
    
    return briefDoc.data() as DecisionBriefV2;
  } catch (error) {
    console.error(`Failed to fetch brief ${id}`, error);
    return null;
  }
}
