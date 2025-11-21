# Fix SWC Binary Error

If you're getting the SWC binary error, follow these steps:

## Quick Fix (Recommended)

1. **Delete node_modules and package-lock.json:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   ```

2. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

3. **Reinstall dependencies:**
   ```powershell
   npm install
   ```

4. **Try running again:**
   ```powershell
   npm run dev
   ```

## Alternative: Use Babel Instead of SWC

If the above doesn't work, you can configure Next.js to use Babel instead:

1. **Install Babel dependencies:**
   ```powershell
   npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript
   ```

2. **Create `.babelrc` file:**
   ```json
   {
     "presets": ["next/babel"]
   }
   ```

3. **Update `next.config.js`:**
   ```javascript
   module.exports = {
     reactStrictMode: true,
     swcMinify: false, // Disable SWC
   }
   ```

## Why This Happens

The SWC binary error usually occurs when:
- Node modules are corrupted
- Architecture mismatch (32-bit vs 64-bit)
- Antivirus blocking the binary
- Incomplete installation

The fix above should resolve it in most cases.

