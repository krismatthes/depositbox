# Fix Netlify Drag & Drop Deploy

## Problem
Når du bruger drag & drop til Netlify, uploader du kun source code - ikke built files.

## ✅ Hurtigste Løsning: GitHub Integration

### Step 1: Push til GitHub
```bash
cd "/Users/kristianmatthes/Desktop/Project X"
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### Step 2: Connect Netlify til GitHub
1. Gå til Netlify Dashboard
2. "Add new site" → "Import an existing project"
3. Vælg GitHub
4. Vælg dit repository
5. Build settings opdateres automatisk fra `netlify.toml`

**Fordele:**
- Netlify installer npm packages automatisk
- Bygger projektet på deres servere
- Auto-deploy ved code changes
- Ingen lokale npm cache issues

## 🔧 Alternativ: Pre-build Locally

**Hvis du vil fortsætte med drag & drop:**

### Step 1: Fix npm først
Du skal køre denne kommando (kræver password):
```bash
sudo chown -R 501:20 "/Users/kristianmatthes/.npm"
```

### Step 2: Build locally
```bash
cd "/Users/kristianmatthes/Desktop/Project X/apps/web"
npm install
npm run build
```

### Step 3: Upload .next folder
**Drag disse til Netlify:**
- `apps/web/.next/` (built Next.js app)
- `apps/web/public/` (static files)
- `apps/web/netlify.toml` (config)

## 📋 Current Deploy Issues

**Dit nuværende deploy fejler fordi:**
1. Netlify forsøger at bygge fra source
2. npm install fejler pga. cache permissions
3. No built files = 404 everywhere

## 🎯 Anbefalet Workflow

**Best practice for Netlify + Next.js:**

1. **GitHub Integration** (anbefalet)
   - Push til GitHub
   - Auto-build på Netlify
   - Ingen lokale problemer

2. **Pre-built drag & drop** 
   - Fix npm cache først
   - Build locally
   - Upload .next + public folders

## 🚀 Quick GitHub Deploy

**3 minutter til working deploy:**

1. Create GitHub repository
2. Push dit code:
   ```bash
   git remote add origin https://github.com/yourusername/depositums-box.git
   git push -u origin main
   ```
3. Connect til Netlify
4. Deploy happens automatically

**Environment Variables at tilføje i Netlify:**
- `NEXT_PUBLIC_API_URL=https://your-api-url.com`

## 🔍 Debug Din Nuværende Deploy

**Tjek Netlify Dashboard:**
1. Gå til "Deploys"
2. Klik på seneste deploy
3. Se "Deploy log" 
4. Look for npm install errors

**Sandsynlige fejl i log:**
- `npm install failed`
- `command "npm run build" failed`
- `next: command not found`

Hvad foretrækker du: **GitHub integration** eller **fix npm cache**?