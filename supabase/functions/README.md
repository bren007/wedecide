# Edge Functions Deployment Guide

## Prerequisites
You need the Supabase CLI linked to your project. Run once:
```bash
npx supabase login
npx supabase link --project-ref bxiylyhkxdyreveervhj
```

## Set Secrets
The Edge Functions need API keys. Set them once (they persist across deploys):
```bash
npx supabase secrets set GEMINI_API_KEY=<your-gemini-key>
npx supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-key>
```

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available 
inside Edge Functions — you don't need to set those.

## Deploy Functions
```bash
npx supabase functions deploy generate-draft --no-verify-jwt
npx supabase functions deploy publish-report --no-verify-jwt
```

We use `--no-verify-jwt` because the functions handle auth internally 
and need to be callable from the browser with the anon key.

## Verify
After deploying, the functions will be available at:
- `https://bxiylyhkxdyreveervhj.supabase.co/functions/v1/generate-draft`
- `https://bxiylyhkxdyreveervhj.supabase.co/functions/v1/publish-report`

The frontend (`AuditReviewPage.tsx`) already constructs these URLs from 
`VITE_SUPABASE_URL`, so no additional env vars are needed in Vercel.
