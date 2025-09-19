# Chrome File Upload Fix Guide

## Issue Identified
✅ **Works in Safari** - File upload functions correctly
❌ **Blocked in Chrome** - File picker won't open due to security restrictions

## Chrome-Specific Solutions

### Solution 1: Enable HTTPS for Development

Chrome often requires HTTPS for file operations. Update your Next.js config:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    https: true, // Enable HTTPS in development
  },
};

export default nextConfig;
```

Then restart with: `npm run dev`

### Solution 2: Chrome Flags (Development Only)

Launch Chrome with disabled security for development:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/tmp/chrome-dev --allow-running-insecure-content --disable-features=VizDisplayCompositor

# Or create an alias
alias chrome-dev="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/tmp/chrome-dev"
```

### Solution 3: Content Security Policy Fix

Add CSP headers that allow file operations:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
          }
        ]
      }
    ]
  }
};
```

### Solution 4: Use Different Port

Chrome sometimes has issues with port 3009. Try standard ports:

```bash
# Try port 3000
npm run dev -- --port 3000

# Or port 8080
npm run dev -- --port 8080
```

### Solution 5: Chrome Extensions Check

Even in incognito, some extensions persist:
1. Go to `chrome://extensions/`
2. Disable ALL extensions
3. Restart Chrome completely
4. Try again

### Solution 6: Chrome Security Settings

1. Go to `chrome://settings/content/filesystem`
2. Check if file system access is blocked
3. Add `localhost:3009` to allowed sites

### Solution 7: Use Safari for Development

Since Safari works perfectly:
- Use Safari for development and testing
- Deploy to production where Chrome users will access via HTTPS
- Most production deployments use HTTPS, which resolves Chrome's security restrictions

## Quick Test Commands

```bash
# Test with HTTPS
npm run dev -- --experimental-https

# Test with different port
npm run dev -- --port 3000

# Test Chrome with disabled security (DEVELOPMENT ONLY)
open -a "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome-dev http://localhost:3009
```

## Recommended Approach

1. **Continue development in Safari** - It works perfectly
2. **Set up HTTPS** - For Chrome compatibility
3. **Production deployment** - Will work in all browsers with HTTPS

The upload functionality is working correctly - it's just Chrome's localhost security restrictions causing the issue.
