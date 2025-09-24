
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersionV2, DecisionBriefV2 } from '@/lib/types';
import { generateInitialBrief, type GenerateInitialBriefOutput } from '@/ai/flows/generate-initial-brief';
import { generateDraftAndSummarize } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Stage 1: Kicks off the briefing process.
 * Calls the AI agent to perform initial discovery (identify sources, ask questions).
 * Creates the main brief document in Firestore with the "Discovery" status and stores
 * the agent's questions.
 * @param goal The user's initial goal statement.
 * @returns The ID of the newly created brief.
 */
export async function startBriefingProcess(goal: string): Promise<string> {
  console.log('startBriefingProcess: Action initiated with goal:', goal);
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) throw new Error('Authentication session not found.');
  
  const { user } = await getAuthenticatedUser(sessionCookie);
  if (!user || !user.profile.tenantId) throw new Error('User not authenticated.');

  try {
    // 1. Call the agentic AI flow to generate discovery questions.
    console.log('startBriefingProcess: Calling generateInitialBrief (Discovery) AI flow...');
    const discoveryOutput = await generateInitialBrief({ goal });

    // 2. Create the brief document in Firestore with the discovery output.
    console.log('startBriefingProcess: Creating brief document in Firestore...');
    const { db } = initializeAdmin();
    const newBriefRef = db.collection('decisionBriefs').doc();

    const firstVersion: BriefVersionV2 = {
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      agentQuestions: discoveryOutput.agentQuestions,
      identifiedSources: discoveryOutput.identifiedSources,
    };

    const newBrief: DecisionBriefV2 = {
      id: newBriefRef.id,
      tenantId: user.profile.tenantId,
      status: 'Discovery',
      goal: goal,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      versions: [firstVersion],
    };

    await newBriefRef.set(newBrief);
    console.log('startBriefingProcess: Brief created with ID:', newBriefRef.id);

    revalidatePath(`/brief/${newBriefRef.id}`);
    return newBriefRef.id;

  } catch (error) {
    console.error('startBriefingProcess: An error occurred.', error);
    throw error;
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

