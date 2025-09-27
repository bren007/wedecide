
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
  console.log('AGENT (startBriefingProcess): Initiated.');
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);
  console.log(`AGENT (startBriefingProcess): User ${user.email} authenticated.`);

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
    `AGENT (startBriefingProcess): Placeholder brief created with ID: ${newBriefRef.id}.`
  );

  // Asynchronously kick off draft generation but don't block the UI
  generateInitialDraft(newBriefRef.id, userResponses, goal, user.uid).catch((err) => {
    console.error(
      'AGENT (startBriefingProcess): CRITICAL - Initial draft generation failed.',
      err
    );
  });

  console.log(
    `AGENT (startBriefingProcess): Returning brief ID to client and letting draft generation run in background.`
  );
  return newBriefRef.id;
}

/**
 * Generates the first "V1" draft of the document using the refineBrief flow.
 * This runs in the background and does not need its own auth check, as it's
 * called by an authenticated server action.
 */
async function generateInitialDraft(
  briefId: string,
  userResponses: Record<string, string>,
  goal: string,
  userId: string
) {
  console.log(
    `AGENT (generateInitialDraft): Initiated for briefId: ${briefId}.`
  );

  const instruction = `My primary goal is: "${goal}". I have answered your clarifying questions. Based on my goal and my answers, please generate the first draft of the document. My answers were: ${JSON.stringify(
    userResponses
  )}`;
  console.log(
    `AGENT (generateInitialDraft): Constructed instruction for AI: "${instruction}"`
  );

  console.log(
    'AGENT (generateInitialDraft): Calling refineBrief for initial draft...'
  );
  const draftOutput = await refineBrief({
    instruction: instruction,
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
  console.log(
    'AGENT (generateInitialDraft): refineBrief flow successful. Received draft from AI.'
  );

  const newVersion: BriefVersionV2 = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    userResponses: userResponses,
    brief: draftOutput.brief,
    fullArtifact: draftOutput.fullArtifact,
  };

  const { db } = initializeAdmin();
  const briefRef = db.collection('decisionBriefs').doc(briefId);

  console.log(
    `AGENT (generateInitialDraft): Updating brief ${briefId} in Firestore with version 1.`
  );
  await briefRef.update({
    versions: [newVersion],
    status: 'Draft',
  });
  console.log(
    `AGENT (generateInitialDraft): Successfully added new version. Revalidating path /brief/${briefId}.`
  );

  revalidatePath(`/brief/${briefId}`);
}

/**
 * Refines an existing draft based on user instructions.
 */
export async function refineDraft(briefId: string, instruction: string) {
  console.log(`AGENT (refineDraft): Initiated for briefId: ${briefId}.`);
  const sessionCookie = cookies().get('session')?.value;
  const { user } = await getAuthenticatedUser(sessionCookie);
  console.log(`AGENT (refineDraft): User ${user.email} authenticated.`);

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
  console.log(
    `AGENT (refineDraft): Brief is in valid state for refinement. Latest version is ${latestVersion.version}.`
  );

  console.log('AGENT (refineDraft): Calling refineBrief flow...');
  const refinedOutput = await refineBrief({
    instruction: instruction,
    existingBrief: latestVersion.brief,
    existingArtifact: latestVersion.fullArtifact,
  });
  console.log(
    'AGENT (refineDraft): refineBrief flow successful. Received refined draft from AI.'
  );

  const newVersion: BriefVersionV2 = {
    version: existingBrief.versions.length + 1,
    createdAt: newtoISOString(),
    createdBy: user.uid,
    refinementInstruction: instruction,
    brief: refinedOutput.brief,
    fullArtifact: refinedOutput.fullArtifact,
  };

  console.log(
    `AGENT (refineDraft): Updating brief ${briefId} in Firestore with new version ${newVersion.version}.`
  );
  await briefRef.update({
    versions: [...existingBrief.versions, newVersion],
  });
  console.log(
    `AGENT (refineDraft): Successfully added new version. Revalidating path /brief/${briefId}.`
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
