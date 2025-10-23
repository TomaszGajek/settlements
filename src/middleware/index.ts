import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Public paths that don't require authentication
const publicPaths = ["/", "/reset-password", "/reset-password/confirm"];

// API paths that need special handling
const apiPaths = ["/api/"];

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Validate environment variables inside the middleware
    if (!supabaseUrl || !supabaseAnonKey) {
      const errorMessage = `Missing Supabase environment variables. PUBLIC_SUPABASE_URL: ${supabaseUrl ? "SET" : "MISSING"}, PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "SET" : "MISSING"}. Please configure these in your Cloudflare Pages environment variables.`;

      // Return a proper error HTML response
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Error</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #dc2626; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Configuration Error</h1>
  <p>The application is missing required environment variables:</p>
  <pre>${errorMessage}</pre>
  <p>Please configure these variables in your Cloudflare Pages dashboard.</p>
</body>
</html>`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

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
  } catch (error) {
    // Catch any unexpected errors and return a proper HTML response
    let errorMessage = "Unknown error";
    let errorStack = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || "";
    } else {
      try {
        errorMessage = JSON.stringify(error, null, 2);
      } catch {
        errorMessage = String(error);
      }
    }

    // Log the error for server-side debugging
    // eslint-disable-next-line no-console
    console.error("[Middleware] Error:", error);

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { color: #dc2626; }
    .error-section { margin: 1rem 0; }
    .error-section h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <h1>Server Error</h1>
  <p>An unexpected error occurred in the middleware:</p>
  <div class="error-section">
    <h2>Error Message</h2>
    <pre>${errorMessage}</pre>
  </div>
  ${errorStack ? `<div class="error-section"><h2>Stack Trace</h2><pre>${errorStack}</pre></div>` : ""}
</body>
</html>`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }
});
