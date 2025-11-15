import { createClient } from "@supabase/supabase-js";

// These environment variables would be set in the Firebase Function settings.
// e.g., `firebase functions:config:set supabase.url="YOUR_URL"`
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable SUPABASE_URL in function config.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY in function config.");
}

// We use the service role key here to have admin-level access for creating
// organizations and users, bypassing RLS.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
