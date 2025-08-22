# Fix NPM Cache Issues

## Problem
Du oplever fejl som:
- `Unable to read file CharacterRange.js`
- `Unable to read file MakeDataViewWithBufferWitnessRecord.js` 
- `Unable to read file array-find-index.js`
- `EACCES: permission denied` npm errors

## Root Cause
NPM cache har root-owned filer pga. tidligere sudo npm kommandoer.

## Løsning

### 1. Fix NPM cache permissions (kræver password)
```bash
sudo chown -R 501:20 "/Users/kristianmatthes/.npm"
```

### 2. Derefter kør disse kommandoer:
```bash
cd "/Users/kristianmatthes/Desktop/Project X"
npm cache clean --force
npm install
npm run dev
```

## Alternative løsning (hvis sudo ikke er tilgængeligt)

### 1. Ryd cache manuel:
```bash
rm -rf /Users/kristianmatthes/.npm/_cacache
```

### 2. Brug NPM med --force flag:
```bash
cd "/Users/kristianmatthes/Desktop/Project X"
npm install --force
npm run dev
```

## Test Deployment (virker stadig)

Selvom development server har problemer, kan du stadig deploye:

```bash
cd apps/web
npm run build  # Dette virker stadig
```

## Netlify Deployment

Din kode er stadig klar til deployment. Upload til Netlify:
1. Drag `apps/web` mappen til Netlify
2. Eller forbind til Git repository
3. Sæt `NEXT_PUBLIC_API_URL` environment variable

## Status

✅ **Kode**: Deployment-klar  
✅ **2FA**: Komplet implementeret  
✅ **Build**: Succeeder (kun dev server har issues)  
⚠️ **Dev Server**: Kræver npm cache fix  

## Næste skridt

1. Fix npm cache med sudo kommando ovenfor
2. Deploy til Netlify (virker uanset dev server issues)
3. Deploy API til separat service (Heroku/Railway/Render)