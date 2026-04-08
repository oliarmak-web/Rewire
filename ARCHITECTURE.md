# Rewire Architecture

| Layer | What it does | Current implementation |
| --- | --- | --- |
| Frontend app | ADHD-friendly onboarding, dashboard, routines, and assistant UI | Next.js App Router + React |
| Backend API | Keeps secrets server-side and handles assessment, assistant, and TRIBE requests | Next.js API routes |
| Assessment engine | Converts intake answers into pattern resemblance, routing, and follow-up coaching | Shared scoring logic in `src/lib/assessment.ts` |
| Life assistant | Helps users navigate school, food, social, and executive-function friction after onboarding | `/api/assistant` route |
| Human-in-the-loop | Escalates to a coach or professional when patterns suggest extra support is needed | Assistant response layer |
| TRIBE lab | Optional experimental research layer for multimodal enrichment | `/api/tribe` route with remote endpoint hook or demo mode |
| Secrets and model config | Stores model keys and endpoint placeholders away from the client | Server-only env vars in `.env.local` / `.env.example` |
| Deployment target | Single web app suitable for browser and phone layouts | Vercel-ready Next.js app |

## Guardrails

- Keys stay on the backend only.
- TRIBE v2 is experimental and non-diagnostic.
- The app is designed for onboarding first, then ongoing daily-life support.
