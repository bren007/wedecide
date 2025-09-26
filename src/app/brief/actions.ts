
'use server';

import { initializeAdmin } from '@/lib/firebase/server-admin';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { BriefVersionV2, DecisionBriefV2 } from '@/lib/types';
import { refineBrief } from '@/ai/flows/refine-brief';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Kicks off the briefing process by creating a placeholder and then
 * asynchronously triggering the first draft generation.
 */
export async function startBriefingProcess(
  goal: string,
  userResponses: Record<string, string>
): Promise<string> {
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);

  console.log('actions.startBriefingProcess: Initiated with goal:', goal);

  const { db } = initializeAdmin();
  const newBriefRef = db.collection('decisionBriefs').doc();

  const initialBrief: DecisionBriefV2 = {
    id: newBriefRef.id,
    tenantId: user.profile.tenantId,
    status: 'Discovery',
    goal: goal,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    versions: [],
  };

  await newBriefRef.set(initialBrief);
  console.log(
    'actions.startBriefingProcess: Placeholder created with ID:',
    newBriefRef.id
  );

  // Asynchronously kick off draft generation but don't block the UI
  generateInitialDraft(newBriefRef.id, userResponses, goal).catch(
    console.error
  );

  return newBriefRef.id;
}

/**
 * Generates the first "V1" draft of the document using the refineBrief flow.
 */
async function generateInitialDraft(
  briefId: string,
  userResponses: Record<string, string>,
  goal: string
) {
  // Since this is called from a Server Action, we need to read the cookie again.
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);

  console.log(
    `actions.generateInitialDraft: Initiated for briefId: ${briefId}`
  );

  // Combine goal and responses into a single instruction for the agent.
  const instruction = `My primary goal is: "${goal}". I have answered your clarifying questions. Based on my goal and my answers, please generate the first draft of the document. My answers were: ${JSON.stringify(
    userResponses
  )}`;

  console.log(
    'actions.generateInitialDraft: Calling refineBrief for initial draft...'
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
  console.log('actions.generateInitialDraft: refineBrief flow successful.');

  const newVersion: BriefVersionV2 = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    userResponses: userResponses,
    brief: draftOutput.brief,
    fullArtifact: draftOutput.fullArtifact,
  };

  const { db } = initializeAdmin();
  const briefRef = db.collection('decisionBriefs').doc(briefId);

  console.log(
    `actions.generateInitialDraft: Adding version 1 to brief ${briefId}.`
  );
  await briefRef.update({
    versions: [newVersion],
    status: 'Draft',
  });
  console.log(`actions.generateInitialDraft: Successfully added new version.`);

  revalidatePath(`/brief/${briefId}`);
}

/**
 * Refines an existing draft based on user instructions.
 */
export async function refineDraft(briefId: string, instruction: string) {
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);

  console.log(`actions.refineDraft: Initiated for briefId: ${briefId}`);

  const { db } = initializeAdmin();
  const briefRef = db.collection('decisionBriefs').doc(briefId);
  const briefDoc = await briefRef.get();

  if (!briefDoc.exists || briefDoc.data()?.tenantId !== user.profile.tenantId) {
    throw new Error(
      'Brief not found or you do not have permission to access it.'
    );
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
    version: existingBrief.versions.length + 1,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    refinementInstruction: instruction,
    brief: refinedOutput.brief,
    fullArtifact: refinedOutput.fullArtifact,
  };

  await briefRef.update({
    versions: [...existingBrief.versions, newVersion],
  });
  console.log(
    `actions.refineDraft: Successfully added new version to brief ${briefId}.`
  );

  revalidatePath(`/brief/${briefId}`);
}

/**
 * Fetches a brief by its ID, ensuring the user has permission to view it.
 */
export async function getBrief(id: string): Promise<DecisionBriefV2 | null> {
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);

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
