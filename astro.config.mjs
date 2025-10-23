// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// Use Node adapter for development, Cloudflare for production
// eslint-disable-next-line no-undef
const isDev = process.env.NODE_ENV !== "production";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://settlements-88a.pages.dev/", // Update this to your actual Cloudflare Pages URL
  integrations: [react(), sitemap()],
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    define: isDev
      ? {}
      : {
          // Tell bundled code that MessageChannel is available in Cloudflare Workers
          "typeof MessageChannel": '"function"',
        },
    resolve: isDev
      ? {}
      : {
          // Use workerd-compatible module resolution for Cloudflare Workers
          conditions: ["workerd", "worker", "browser"],
        },
    ssr: isDev
      ? {
          // Development: Allow Node.js builtins
          external: ["node:async_hooks"],
        }
      : {
          // Production: Bundle React for Cloudflare Workers with proper conditions
          external: ["node:async_hooks"],
          noExternal: true, // Bundle everything for edge runtime
        },
  },
  adapter: isDev
    ? node({
        mode: "standalone",
      })
    : cloudflare({
        platformProxy: {
          enabled: true,
        },
        imageService: "compile", // Use compile-time image optimization
      }),
});
