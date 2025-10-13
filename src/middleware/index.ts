import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Extract the JWT token from the Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  // Create a new Supabase client with the user's access token if available
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  context.locals.supabase = supabase;
  return next();
});
