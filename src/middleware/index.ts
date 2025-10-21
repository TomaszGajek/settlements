import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your Cloudflare Pages environment variables."
  );
}

// Public paths that don't require authentication
const publicPaths = ["/", "/reset-password", "/reset-password/confirm"];

// API paths that need special handling
const apiPaths = ["/api/"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, cookies } = context;
  const pathname = new URL(request.url).pathname;

  // Create a Supabase client that works with server-side cookies
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map((cookie) => ({
          name: cookie.name,
          value: cookie.value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });

  // Make supabase available in context.locals
  context.locals.supabase = supabase;

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname === path);
  const isApiPath = apiPaths.some((path) => pathname.startsWith(path));

  // If it's an API path, let it handle auth internally
  if (isApiPath) {
    return next();
  }

  // If user is not authenticated and trying to access protected route
  if (!session && !isPublicPath) {
    return redirect("/?reason=session_expired");
  }

  // If user is authenticated and trying to access public auth pages
  if (session && isPublicPath) {
    const now = new Date();
    return redirect(`/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
  }

  return next();
});
