# Korrekt Netlify Drag & Drop

## Din Current Deploy Problem

**Netlify skippede build fordi:**
1. `netlify.toml` var ikke i root af uploaded folder
2. Next.js plugin kunne ikke finde korrekt projekt struktur
3. Raw source files blev served uden build

## ✅ Korrekt Upload Procedure

### Step 1: Organiser Upload Folder
```bash
cd "/Users/kristianmatthes/Desktop"
mkdir "NetlifyUpload"
cd "NetlifyUpload"

# Kopier WEB APP indhold til root af upload folder
cp -r "/Users/kristianmatthes/Desktop/Project X/apps/web/"* .

# Check struktur - skal se sådan ud:
# NetlifyUpload/
# ├── netlify.toml          ← I ROOT!
# ├── package.json
# ├── next.config.js
# ├── src/
# ├── public/
# └── ...andre web app files
```

### Step 2: Upload NetlifyUpload Folder
**Drag den NYE `NetlifyUpload` folder til Netlify**

**IKKE hele "Project X" - kun indholdet fra apps/web**

## 🔧 Alternative: Fix Current Deploy

### Option A: Redeploy med korrekt struktur (anbefalet)
1. Opret `NetlifyUpload` folder som beskrevet ovenfor
2. Drag til Netlify (erstatter current deploy)

### Option B: GitHub Integration
```bash
# Push til GitHub og connect til Netlify
cd "/Users/kristianmatthes/Desktop/Project X"
git add .
git commit -m "Deploy fix"
git push origin main
```

## 📋 Hvad der skulle være sket

**Med korrekt upload:**
```
✅ Initializing
✅ Building       ← npm install + npm run build  
✅ Deploying      ← Upload built files
✅ Functions      ← Next.js functions generated
✅ Cleanup
```

## 🎯 Test Efter Fix

**URLs der skal virke efter korrekt deploy:**
- `https://yoursite.netlify.app/` 
- `https://yoursite.netlify.app/login`
- `https://yoursite.netlify.app/register`
- `https://yoursite.netlify.app/dashboard`

## ⚠️ Environment Variables

**Husk at sætte i Netlify Dashboard:**
- `NEXT_PUBLIC_API_URL=https://your-api-url.com`
- `NODE_VERSION=18`

## 🚀 Quick Action Plan

1. **Lav NetlifyUpload folder** (som beskrevet)
2. **Drag DENNE folder til Netlify**  
3. **Check build log** - bør vise "Building" som "Complete"
4. **Test URLs** - alt bør virke

**Den nuværende deploy er bare raw files - intet Next.js kører!**