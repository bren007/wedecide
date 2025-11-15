/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onUserCreate } from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";
import { getFirebaseAdminApp } from "./firebase-admin";
import { supabaseAdmin } from "./supabase-admin";

// Initialize the Firebase Admin SDK.
getFirebaseAdminApp();

/**
 * This function triggers when a new user is created in Firebase Authentication.
 *
 * 1. It extracts the organization name from a custom claim (which we assume
 *    was set on the client during the sign-up process).
 * 2. It creates a new `organization` in the Supabase database.
 * 3. It creates a `user_profile` in Supabase, linking the user to the new
 *    organization with an 'Admin' role.
 */
export const onusersignup = onUserCreate(async (event) => {
  const user = event.data;
  const { customClaims } = user;

  logger.info(`New user signed up: ${user.uid}`, { uid: user.uid, email: user.email });

  if (!customClaims || !customClaims.organization_name) {
    logger.error("User is missing 'organization_name' custom claim.", { uid: user.uid });
    // In a production app, you might want to delete the user or handle this differently.
    return;
  }

  const organizationName = customClaims.organization_name;
  logger.info(`Creating new organization '${organizationName}' for user ${user.uid}`);

  try {
    // Step 1: Create the new organization in Supabase.
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({ name: organizationName })
      .select()
      .single();

    if (orgError) {
      logger.error("Failed to create organization in Supabase.", { uid: user.uid, error: orgError });
      throw new Error(orgError.message);
    }

    const organizationId = orgData.id;
    logger.info(`Successfully created organization with ID: ${organizationId}`, { orgId: organizationId });

    // Step 2: Create the user's profile in Supabase, linking them to the new org.
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: user.uid, // The Firebase UID is the primary key.
        organization_id: organizationId,
        role: "Admin", // The first user is always an admin.
        email: user.email || "",
      });

    if (profileError) {
      logger.error("Failed to create user profile in Supabase.", { uid: user.uid, error: profileError });
      // If this fails, we should ideally roll back the organization creation.
      // For this prototype, we'll log the error.
      throw new Error(profileError.message);
    }
     logger.info(`Successfully created user profile for ${user.uid} in org ${organizationId}`);

  } catch (error) {
    logger.error("An unexpected error occurred during the onUserSignUp process.", { uid: user.uid, error });
    // This will cause the function to fail and potentially be retried.
    throw error;
  }
});
