# Deploying Rewire to Vercel

## What Rewire expects

Rewire is built as a single Next.js app.

When the app code is uploaded to this repository, the repo root should contain files like:

- `package.json`
- `next.config.ts`
- `src/app/page.tsx`
- `src/app/api/assessment/route.ts`
- `src/app/api/assistant/route.ts`
- `src/app/api/tribe/route.ts`

## Vercel settings

Use these settings when importing the repo into Vercel:

- Framework Preset: `Next.js`
- Root Directory: `./`
- Build Command: leave default
- Output Directory: leave default
- Install Command: leave default

## Environment variables

Add these in Vercel Project Settings -> Environment Variables.

```env
OPENAI_API_KEY=replace_with_backend_only_key
TRIBE_V2_API_KEY=replace_with_backend_only_key
TRIBE_V2_MODEL=facebook/tribev2
TRIBE_V2_ENDPOINT_URL=https://your-remote-tribe-service.example.com/infer
```

## Important notes

- Keep all API keys on the backend only.
- Do not use `NEXT_PUBLIC_` for secrets.
- The current app is designed so server-side API routes hold model access and orchestration.
- TRIBE v2 should remain an experimental enrichment layer, not a diagnostic claim.

## Local development

```powershell
cd "C:\Users\livia\ADHD AI Friend\frontend"
Copy-Item .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Before deploying

Make sure the actual Next.js app code from the local `frontend` folder is uploaded into this repository. Vercel cannot deploy from README/docs alone.
