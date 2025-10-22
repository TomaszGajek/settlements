# React 19 + Cloudflare Workers Fix

## Problem

The deployment to Cloudflare Pages was failing with the error:
```
Error: Failed to publish your Function. Got error: Uncaught ReferenceError: MessageChannel is not defined
  at chunks/_@astro-renderers_CkE2OI7e.mjs:6827:16 in requireReactDomServer_browser_production
```

## Root Cause

React 19's server-side rendering uses different server modules:
- `react-dom/server` - Designed for Node.js environments
- `react-dom/server.browser` - Intended for browser environments  
- `react-dom/server.edge` - Tailored for edge environments like Cloudflare Workers

By default, Astro was bundling the browser or Node.js version of React DOM Server, which relies on the `MessageChannel` API. While Cloudflare Workers do support `MessageChannel` with the `nodejs_compat` flag, React 19's implementation was trying to access it before it was available in the Workers runtime.

## Solution

The fix involves configuring Astro to use the edge-compatible React DOM server module:

### Changes Made

1. **Updated `astro.config.mjs`**:
   - Added Vite resolve alias to map `react-dom/server` to `react-dom/server.edge`
   - This ensures React uses the edge-compatible server module that doesn't rely on `MessageChannel`
   - Removed invalid `mode` property from Cloudflare adapter configuration

2. **Updated `wrangler.toml`**:
   - Updated `compatibility_date` from `2024-10-21` to `2025-01-01`
   - This provides better Node.js API support in Cloudflare Workers

## Configuration Details

### astro.config.mjs
```javascript
vite: {
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      // Use edge-compatible React DOM server for Cloudflare Workers
      // This prevents "MessageChannel is not defined" error with React 19
      "react-dom/server": "react-dom/server.edge",
    },
  },
  ssr: {
    external: ["node:async_hooks"],
  },
}
```

### wrangler.toml
```toml
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
```

## Testing

The build was tested locally and completed successfully:
- ✅ Server build completed without errors
- ✅ Client build completed with all modules transformed
- ✅ Static routes prerendered successfully
- ✅ All assets generated correctly

## Deployment

To deploy with these fixes:

1. Commit and push the changes:
   ```bash
   git add .
   git commit -m "fix: configure React 19 edge server for Cloudflare Workers"
   git push origin technical/debug
   ```

2. Merge to master or wait for the GitHub Action to deploy

3. The Cloudflare deployment should now succeed without the MessageChannel error

## References

- [Cloudflare Workers MessageChannel API](https://developers.cloudflare.com/workers/runtime-apis/messagechannel/)
- [React 19 Server Components](https://react.dev/reference/rsc/server-components)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

## Additional Notes

- The `react-dom/server.edge` module is specifically designed for edge runtime environments
- This configuration is compatible with React 19 and future versions
- The fix maintains full SSR functionality while being compatible with Cloudflare Workers constraints

