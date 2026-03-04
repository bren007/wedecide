---
description: How to deploy to staging/production, test, and fix issues safely without environment drift
---

# WeDecide Deploy & Test/Fix Lifecycle

This workflow ensures all environments (dev → staging → production) stay aligned.
The core rule: **all fixes flow through dev first, never patch staging or production directly.**

---

## Pre-Deploy Checklist

Before deploying to any non-dev environment, verify these:

1. **All changes are committed to Git**
   ```powershell
   git status
   ```
   If there are uncommitted changes, commit them first. Deployments should always be traceable to a commit.

2. **Unit tests pass locally**
   // turbo
   ```powershell
   npm run test:unit
   ```

3. **Integration tests pass against dev**
   // turbo
   ```powershell
   npm run test:int
   ```

4. **Build succeeds**
   // turbo
   ```powershell
   npm run build
   ```

---

## Phase 1: Deploy to Staging

### Step 1: Preview what will be applied
// turbo
```powershell
npm run deploy:staging:dry
```
Review the pending migrations listed. If nothing is pending, the environments are already in sync.

### Step 2: Check for schema drift before deploying
// turbo
```powershell
npm run deploy:staging:compare
```
This compares dev and staging schemas side-by-side. If drift is detected:
- **DO NOT** write a `fix_staging_*.sql` script
- Instead, write a proper migration in `supabase/migrations/` that fixes the drift idempotently
- Apply it to dev first (`npm run deploy:dev`), then re-run this step

### Step 3: Apply migrations to staging
```powershell
npm run deploy:staging
```
The deploy script will:
- Only apply migrations not yet tracked in `_migration_history`
- Run each migration in a transaction (automatic rollback on failure)
- Record successful migrations with a checksum

### Step 4: Tag the deploy
```powershell
git tag staging-deploy-$(Get-Date -Format "yyyy-MM-dd-HHmm")
git push --tags
```
This gives you a rollback point if anything goes wrong.

---

## Phase 2: Test in Staging

### What to test (in order of priority)

#### Layer 1: Schema & Data Integrity
// turbo
```powershell
npm run deploy:staging:compare
```
Should report "No schema drift detected."

#### Layer 2: Auth Flow
1. Open the staging app URL
2. Sign in with a test account
3. Verify:
   - Login completes (no hanging on "Signing in...")
   - Correct org data loads
   - Token refresh works (wait 5+ minutes, then navigate)

#### Layer 3: RLS Policies
Test as different roles (chair, admin, member):
- Can see only their org's decisions, meetings, initiatives
- Can/cannot edit based on role
- Anonymous users are fully blocked

#### Layer 4: Core Features
- Create a decision → verify it appears in the list
- Schedule a meeting → verify attendees see it
- Upload CSV for audit → verify data processes correctly
- Generate audit report → verify AI pipeline works end-to-end

#### Layer 5: Edge Functions
- Trigger `generate-audit-report` → check response
- Trigger `send-preflight-email` → check email delivery

#### Layer 6: UI/UX
- All pages render without console errors
- Navigation works correctly
- Responsive layout on mobile viewport

---

## Phase 3: Fix Issues Found in Staging

> ⚠️ **CRITICAL RULE: Never fix staging directly.**

### The Fix Lifecycle

```
Issue found in staging
        │
        ▼
┌─ Is it a schema/RLS issue? ──────────────────────────┐
│   YES: Write a new migration file in                  │
│         supabase/migrations/YYYYMMDDHHMMSS_fix_xxx.sql│
│   NO:  Fix in the application code (src/, server/)    │
└───────────────────────────────────────────────────────┘
        │
        ▼
  Test the fix in DEV
        │
        ▼
  Commit the fix to Git
        │
        ▼
  Re-deploy to staging (Phase 1, Steps 1-4)
        │
        ▼
  Re-test the specific issue in staging
        │
        ▼
  Run full regression test (Phase 2)
```

### How to write a proper fix migration

```sql
-- File: supabase/migrations/20260304_fix_missing_column.sql

-- Always use IF NOT EXISTS / IF EXISTS for idempotency
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS reversibility TEXT DEFAULT 'medium';

-- For RLS fixes, always drop-then-create
DROP POLICY IF EXISTS "View decisions" ON decisions;
CREATE POLICY "View decisions" ON decisions
  FOR SELECT
  USING (org_id = get_auth_user_org_id());
```

### What NOT to do

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `fix_staging_schema_drift.sql` (staging-only script) | Migration in `supabase/migrations/` |
| Fix RLS in Supabase Dashboard | Migration with `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| Hardcode a connection string in a one-off script | Use `npm run deploy:staging` |
| Skip testing in dev ("it's just a small fix") | Always test in dev first, no exceptions |
| Apply a fix and move on | Tag the commit, re-run full regression |

---

## Phase 4: Deploy to Production

### Pre-production gate
All of the following must be true:
- [ ] Staging has been running with zero issues for the agreed stabilization period
- [ ] All integration tests pass against staging
- [ ] Schema comparison between dev and staging shows zero drift
- [ ] The deploy commit is tagged (e.g., `staging-deploy-2026-03-04-2030`)
- [ ] Product owner has signed off on staging behavior

### Production deploy
```powershell
npm run deploy:production
```
The `--confirm` flag is built into the npm script. The deploy tool will refuse to run against production without it.

### Post-production verification
1. Run the same test checklist from Phase 2
2. Monitor for errors in the first 30 minutes
3. Tag the production deploy:
   ```powershell
   git tag production-deploy-$(Get-Date -Format "yyyy-MM-dd-HHmm")
   git push --tags
   ```

---

## Rollback Procedure

If a deploy causes critical issues:

### Option A: Fix Forward (preferred)
1. Write a migration that reverses the breaking change
2. Follow the standard Fix Lifecycle (Phase 3)

### Option B: Revert to Last Known Good
1. Find the last good tag:
   ```powershell
   git tag -l "staging-deploy-*" --sort=-creatordate | Select-Object -First 5
   ```
2. Check out that commit:
   ```powershell
   git checkout <tag-name>
   ```
3. Re-deploy the known-good migrations:
   ```powershell
   npm run deploy:staging
   ```
4. Create a revert commit on main and push

---

## Environment Variables Setup

Ensure `.env.local` has separate connection strings per environment:

```env
# Dev Supabase (default for local development)
DEV_DATABASE_URL=postgresql://postgres.[dev-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[dev-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Staging Supabase
STAGING_DATABASE_URL=postgresql://postgres.[staging-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Production Supabase (add when ready)
# PROD_DATABASE_URL=postgresql://postgres.[prod-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# App-level (Vite injects these to the frontend)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

> **Note:** The deploy script falls back to `DIRECT_URL` / `DATABASE_URL` for dev
> if `DEV_DATABASE_URL` is not set, maintaining backward compatibility.

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run deploy:dev` | Apply pending migrations to dev |
| `npm run deploy:staging` | Apply pending migrations to staging |
| `npm run deploy:staging:dry` | Preview what would be applied to staging |
| `npm run deploy:staging:compare` | Detect schema drift between dev and staging |
| `npm run deploy:production` | Apply pending migrations to production |
| `node scripts/deploy.js --help` | Show full help with all options |
| `node scripts/deploy.js --env staging --migration <file>` | Apply a single specific migration |
