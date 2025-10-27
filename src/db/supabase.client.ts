import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * Klient Supabase dla przeglądarki z konfiguracją auth
 *
 * WAŻNE: Czas wygaśnięcia tokena JWT (JWT expiry) jest konfigurowany
 * w Supabase Dashboard → Authentication → Settings → JWT Expiry.
 *
 * Aplikacja dodatkowo implementuje client-side timeout sesji (30 minut nieaktywności)
 * przez hook useSessionTimeout w AuthProvider.
 *
 * Auto refresh: Supabase automatycznie odświeża tokeny przed wygaśnięciem.
 * Można to wyłączyć ustawiając autoRefreshToken: false w opcjach auth.
 */
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatyczne odświeżanie tokenów przed wygaśnięciem (domyślnie: true)
    autoRefreshToken: true,
    // Persist session w localStorage (domyślnie: true)
    persistSession: true,
    // Wykrywanie sesji w innych kartach przeglądarki (domyślnie: true)
    detectSessionInUrl: true,
  },
});

// Export typed SupabaseClient for use in services
export type SupabaseClient = BaseSupabaseClient<Database>;
