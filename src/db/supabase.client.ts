import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use in services
export type SupabaseClient = BaseSupabaseClient<Database>;
