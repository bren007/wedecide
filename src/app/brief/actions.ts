
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersionV2, DecisionBriefV2 } from '@/lib/types';
import { refineBrief } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Creates an initial, empty brief document in Firestore.
 */
async function createPlaceholderBrief(
  goal: string,
  uid: string,
  tenantId: string
): Promise<string> {
  console.log(
    'actions.createPlaceholderBrief: Creating placeholder for tenant',
    tenantId
  );
  const { db } = initializeAdmin();
  const newBriefRef = db.collection('decisionBriefs').doc();

  const initialBrief: DecisionBriefV2 = {
    id: newBriefRef.id,
    tenantId: tenantId,
    status: 'Discovery', // Will be updated to 'Draft' after first generation
    goal: goal,
    createdAt: new Date().toISOString(),
    createdBy: uid,
    versions: [],
  };

  await newBriefRef.set(initialBrief);
  console.log(
    'actions.createPlaceholderBrief: Placeholder created with ID:',
    newBriefRef.id
  );
  return newBriefRef.id;
}

/**
 * Kicks off the briefing process by creating a placeholder and then generating the first draft.
 */
export async function startBriefingProcess(
  goal: string,
  userResponses: Record<string, string>
): Promise<string> {
  console.log('actions.startBriefingProcess: Initiated with goal:', goal);
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) throw new Error('Authentication session not found.');

  const { user } = await getAuthenticatedUser(sessionCookie);
  if (!user || !user.profile.tenantId)
    throw new Error('User not authenticated or tenant ID is missing.');

  const briefId = await createPlaceholderBrief(
    goal,
    user.uid,
    user.profile.tenantId
  );

  // Asynchronously kick off draft generation but don't block the UI
  generateDraft(briefId, userResponses).catch(console.error);

  revalidatePath(`/brief/${briefId}`);
  return briefId;
}

/**
 * Stage 2: Generates the first draft of the document.
 */
export async function generateDraft(
  briefId: string,
  userResponses: Record<string, string>,
  isFirstDraft = false
) {
  console.log(`actions.generateDraft: Initiated for briefId: ${briefId}`);
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

  // Combine goal and responses into a single instruction for the agent.
  const instruction = `My primary goal is: "${existingBrief.goal}". I have answered your clarifying questions. Based on my goal and my answers, please generate the first draft of the document. My answers were: ${JSON.stringify(userResponses)}`;

  console.log(
    'actions.generateDraft: Calling refineBrief flow for initial draft...'
  );
  const draftOutput = await refineBrief({
    instruction: instruction,
    // For the first draft, there's no existing content.
    existingBrief: {
      title: '',
      strategicCase: '',
      recommendation: '',
      alignmentScore: 0,
      alignmentRationale: '',
    },
    existingArtifact: {
      title: '',
      strategicCase: '',
      optionsAnalysis: '',
      recommendation: '',
      financialCase: '',
    },
  });
  console.log('actions.generateDraft: refineBrief flow successful.');

  const newVersion: BriefVersionV2 = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    userResponses: userResponses,
    brief: draftOutput.brief,
    fullArtifact: draftOutput.fullArtifact,
  };

  console.log(
    `actions.generateDraft: Adding version ${newVersion.version} to brief ${briefId}.`
  );
  await briefRef.update({
    versions: [newVersion],
    status: 'Draft',
  });
  console.log(
    `actions.generateDraft: Successfully added new version to brief ${briefId}.`
  );

  revalidatePath(`/brief/${briefId}`);
}

/**
 * Stage 2 Refinement: Refines an existing draft based on user instructions.
 */
export async function refineDraft(briefId: string, instruction: string) {
  console.log(
    `actions.refineDraft: Initiated for briefId: ${briefId} with instruction: "${instruction}"`
  );
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

  if (
    existingBrief.status !== 'Draft' ||
    !latestVersion?.brief ||
    !latestVersion.fullArtifact
  ) {
    throw new Error(
      'Can only refine a brief that is in the "Draft" status and has content.'
    );
  }

  console.log('actions.refineDraft: Calling refineBrief flow...');
  const refinedOutput = await refineBrief({
    instruction: instruction,
    existingBrief: latestVersion.brief,
    existingArtifact: latestVersion.fullArtifact,
  });
  console.log('actions.refineDraft: refineBrief flow successful.');

  const newVersion: BriefVersionV2 = {
    ...latestVersion,
    version: existingBrief.versions.length + 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    refinementInstruction: instruction,
    brief: refinedOutput.brief,
    fullArtifact: refinedOutput.fullArtifact,
  };

  console.log(
    `actions.refineDraft: Preparing to add version ${newVersion.version} to brief ${briefId}.`
  );
  await briefRef.update({
    versions: [...existingBrief.versions, newVersion],
  });
  console.log(
    `actions.refineDraft: Successfully added new refined version to brief ${briefId}.`
  );

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

    if (
      !briefDoc.exists ||
      briefDoc.data()?.tenantId !== user.profile.tenantId
    ) {
      console.log(
        `No brief found with id ${id} for tenant ${user.profile.tenantId}`
      );
      return null;
    }

    return briefDoc.data() as DecisionBriefV2;
  } catch (error) {
    console.error(`Failed to fetch brief ${id}`, error);
    return null;
  }
}
