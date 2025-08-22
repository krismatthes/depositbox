# Netlify 404 Debug Guide

## 1. Check Netlify Build Log

**I Netlify Dashboard:**
1. Gå til din site
2. Klik på "Deploys" tab
3. Klik på dit seneste deploy
4. Tjek "Deploy log" for fejl

**Look for:**
- Build failures
- Missing files warnings
- Export errors
- Plugin errors

## 2. Check Published Files

**I Netlify Dashboard:**
1. Gå til dit deploy
2. Klik "Browse deploy" (eller "Open deploy")
3. Se hvilke filer faktisk blev uploaded

**Expected struktur:**
```
/
├── index.html
├── _next/
├── api/
├── dashboard/
├── login/
├── register/
├── robots.txt
├── sitemap.xml
└── _redirects
```

## 3. Common 404 Causes

### A. Missing _redirects file
**Fix:** Ensure `apps/web/public/_redirects` exists:
```
/* /index.html 200
```

### B. Wrong publish directory
**Fix:** Check netlify.toml:
```toml
[build]
  base = "apps/web"
  command = "npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### C. Build failures
**Check:** Did build complete successfully?

### D. API routes not converted
**Issue:** Dynamic routes need `generateStaticParams` or should be removed

## 4. Quick Debug Commands

**Local build test:**
```bash
cd apps/web
npm run build
```

**Check build output:**
```bash
ls -la .next/
ls -la .next/static/
ls -la public/
```

## 5. Netlify Specific Checks

### Check Functions
**If using @netlify/plugin-nextjs:**
- Functions should auto-generate
- Check "Functions" tab in dashboard

### Check Environment Variables
**Required vars:**
- `NEXT_PUBLIC_API_URL`
- `NODE_VERSION=18`

## 6. URL Pattern Analysis

**Tell me which URLs give 404:**

**Working URLs should be:**
- `https://yoursite.netlify.app/` ✅
- `https://yoursite.netlify.app/login/` ✅  
- `https://yoursite.netlify.app/dashboard/` ✅

**404 URLs might be:**
- `https://yoursite.netlify.app/some-page` ❌
- Missing trailing slash issues
- Old route references

## 7. Next.js Specific Issues

**Check next.config.js:**
```js
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // No output: 'export' for Netlify
}
```

## 8. Debug Steps

1. **Share your Netlify deploy URL** - så jeg kan inspicere
2. **Copy build log** - fra Netlify dashboard
3. **Tell me specific 404 URLs** - hvilke sider virker ikke?
4. **Check browser console** - for JavaScript errors

## 9. Quick Fix Options

**Option 1: Redeploy**
```bash
cd apps/web
npm run build
# Upload .next folder to Netlify
```

**Option 2: Manual upload**
- Drag hele `apps/web` folder til Netlify
- Include `netlify.toml`

**Option 3: Git deployment**
- Push to GitHub/GitLab
- Connect to Netlify
- Auto-build from repository

## What to check first:

1. ✅ Did the build succeed in Netlify?
2. ✅ Are you using the right URL structure?
3. ✅ Is `netlify.toml` in the right place?
4. ✅ Do you see files in "Browse deploy"?

**Send me:**
- Your Netlify site URL
- Which specific page gives 404
- Your build log (copy/paste)