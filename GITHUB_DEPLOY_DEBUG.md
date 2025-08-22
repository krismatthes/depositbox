# GitHub Deploy Debug

## Likely Issue: Base Directory

**Problem:** Netlify deployed from root of repo, not from `apps/web`

## Fix Build Settings:

### 1. Go to Netlify Site Settings
- Your new GitHub-connected site
- Site Settings → Build & Deploy

### 2. Update Build Settings:
- **Base directory:** `apps/web`
- **Build command:** `npm run build`
- **Publish directory:** `.next`

### 3. Environment Variables:
- Site Settings → Environment variables
- Add: `NEXT_PUBLIC_API_URL=https://your-api-url.com`
- Add: `NODE_VERSION=18`

### 4. Trigger Redeploy:
- Deploys → "Trigger deploy" → "Deploy site"

## Check These:

### A. Build Log Analysis:
1. Latest deploy → View logs
2. Look for:
   - Did it find package.json in apps/web?
   - Did npm install succeed?
   - Did npm run build succeed?
   - Were functions created?

### B. Deploy Preview:
1. Latest deploy → "Preview deploy"
2. Browse the file structure
3. Is there an index.html?
4. Are there _next/ folders?

### C. Common Build Errors:
- "package.json not found" = base directory wrong
- "next: command not found" = npm install failed
- "Build failed" = check specific error in logs

## Alternative Quick Fix:

### Option 1: Move netlify.toml to repo root
```bash
cp apps/web/netlify.toml ./
```
Update netlify.toml:
```toml
[build]
  base = "apps/web"
  command = "npm run build"
  publish = "apps/web/.next"
```

### Option 2: Monorepo Setup
Add to repo root package.json:
```json
{
  "scripts": {
    "build": "cd apps/web && npm install && npm run build"
  }
}
```

## Most Likely Solution:

**Set Base Directory to `apps/web` in Netlify settings and redeploy.**