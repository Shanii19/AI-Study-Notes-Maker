# Troubleshooting Guide

## Fixed Issues

### ✅ Invalid next.config.js
**Error:** `Unrecognized key(s) in object: 'api'`

**Fix Applied:** Removed the invalid `api` configuration. Next.js 14 handles body size limits differently.

### ⚠️ SWC Binary Error
**Error:** `Failed to load SWC binary for win32/x64`

**Status:** Fixed by reinstalling node_modules. If it persists, see solutions below.

## If SWC Error Persists

### Solution 1: Disable SWC (Recommended if error continues)

Edit `next.config.js` and uncomment the line:

```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Add this line
}
```

Then restart the server:
```powershell
npm run dev
```

### Solution 2: Reinstall with Specific Node Version

Make sure you're using Node.js 18 or higher:
```powershell
node --version
```

If not, download from https://nodejs.org/

### Solution 3: Check Antivirus

Sometimes antivirus software blocks the SWC binary. Try:
1. Temporarily disable antivirus
2. Add project folder to antivirus exclusions
3. Reinstall: `npm install`

### Solution 4: Use Babel Instead

If SWC continues to fail:

1. Install Babel:
```powershell
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript
```

2. Create `.babelrc`:
```json
{
  "presets": ["next/babel"]
}
```

3. Update `next.config.js`:
```javascript
module.exports = {
  reactStrictMode: true,
  swcMinify: false,
}
```

## Common Commands

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install

# Run dev server
npm run dev

# Check Node version
node --version

# Check npm version
npm --version
```

## Still Having Issues?

1. Make sure Node.js 18+ is installed
2. Try running as Administrator
3. Check Windows Defender/antivirus exclusions
4. Try a different terminal (PowerShell vs CMD)
5. Check if port 3000 is available

