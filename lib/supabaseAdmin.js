import { createClient } from "@supabase/supabase-js";

// Only imported from code that runs on the server (API routes / Server
// Components). The service_role key must never reach the browser — that's
// why this file's variables don't use the NEXT_PUBLIC_ prefix.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;