import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

/**
 * Supabase Admin client with service role key.
 * Use this ONLY in server-side code (API endpoints, server-side functions).
 * This client bypasses Row Level Security (RLS) policies.
 * 
 * @example
 * // Delete a user (admin operation)
 * const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

