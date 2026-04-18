/**
 * WeDecide Staging Validation Script
 *
 * Performs a suite of checks against the staging environment:
 * 1. Database Connectivity & Table Health
 * 2. RLS Performance (Recursion/Timeout Regression)
 * 3. Multi-Tenant Isolation (Cross-org data leak check)
 * 4. Supabase API Anon Key Health
 *
 * Usage:
 *   node scripts/validate-staging.js
 *
 * Requires: STAGING_DATABASE_URL in .env.local
 */

import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env.local') });

const STAGING_DB_URL = process.env.STAGING_DATABASE_URL;
const STAGING_SUPABASE_URL = 'https://bxiylyhkxdyreveervhj.supabase.co';
const STAGING_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aXlseWhreGR5cmV2ZWVydmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjE5MTQsImV4cCI6MjA4MDUzNzkxNH0.BuZd4UNjOkGW0dMsuRIYg1tokdXm3r83mogFI7ffuqE';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Run a callback as a simulated Supabase authenticated user.
 *
 * Supabase/PostgREST always wraps requests in a transaction and sets:
 *   - request.jwt.claims  (LOCAL — scoped to the TX)
 *   - ROLE authenticated  (LOCAL — scoped to the TX)
 *
 * We replicate the same pattern here so RLS policies behave identically
 * to how they do in the real app.
 */
async function asAuthenticatedUser(pgClient, userId, orgId, callback) {
    // Build claims that match what PostgREST injects
    const claims = JSON.stringify({
        sub: userId,
        role: 'authenticated',
        // include org_id if your JWT extension exposes it; harmless if not
        org_id: orgId ?? undefined,
    });

    await pgClient.query('BEGIN');
    try {
        // LOCAL means the setting is scoped to this transaction only — exactly
        // what PostgREST does. This avoids session bleed between tests.
        await pgClient.query(
            `SELECT set_config('request.jwt.claims', $1, true)`,
            [claims]
        );
        await pgClient.query('SET LOCAL ROLE authenticated');
        await pgClient.query('SET LOCAL statement_timeout = 3000'); // 3s guard

        const result = await callback(pgClient);

        await pgClient.query('COMMIT');
        return result;
    } catch (err) {
        await pgClient.query('ROLLBACK');
        throw err;
    }
}

let passed = 0;
let failed = 0;
let warned = 0;

function ok(msg) {
    console.log(`   ✅ ${msg}`);
    passed++;
}
function fail(msg) {
    console.error(`   ❌ ${msg}`);
    failed++;
}
function warn(msg) {
    console.warn(`   ⚠️  ${msg}`);
    warned++;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function runValidation() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║             WeDecide Staging Validation Utility              ║
╚══════════════════════════════════════════════════════════════╝
`);

    if (!STAGING_DB_URL) {
        console.error('❌ Fatal: STAGING_DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const pgClient = new Client({
        connectionString: STAGING_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('🔌 Connecting to Staging Database...');
        await pgClient.connect();
        console.log('✅ Connected.\n');

        // ── TEST 1: Core Table Health ────────────────────────────────────────
        console.log('🔹 Test 1: Core Table Health');
        const coreTables = [
            'organizations',
            'users',
            'user_roles',
            'decisions',
            'stakeholders',
            'meetings',
        ];
        for (const table of coreTables) {
            try {
                const res = await pgClient.query(
                    `SELECT count(*) FROM ${table}`
                );
                ok(`${table.padEnd(15)}: ${res.rows[0].count} rows`);
            } catch (err) {
                fail(`${table.padEnd(15)}: ${err.message}`);
            }
        }
        console.log('');

        // ── TEST 2: RLS Performance (Recursion Guard) ────────────────────────
        console.log('🔹 Test 2: RLS Performance (Recursion / Timeout Check)');

        // Fetch a real user+org pair using the superuser (postgres) role
        const userRes = await pgClient.query(
            `SELECT u.id AS user_id, u.email, u.organization_id
             FROM users u
             WHERE u.organization_id IS NOT NULL
             LIMIT 1`
        );

        if (userRes.rows.length === 0) {
            warn('Skipping RLS check: no users with an organization found in staging.');
        } else {
            const { user_id, email, organization_id } = userRes.rows[0];
            console.log(`   Simulating login for: ${email}`);

            // Query 1: users table
            const t1Start = Date.now();
            await asAuthenticatedUser(pgClient, user_id, organization_id, async (pg) => {
                return pg.query(`SELECT id FROM users WHERE id = $1`, [user_id]);
            });
            const t1Elapsed = Date.now() - t1Start;

            if (t1Elapsed < 3000) {
                ok(`users query completed in ${t1Elapsed}ms (limit: 3000ms)`);
            } else {
                fail(`users query timed out or exceeded 3s (${t1Elapsed}ms) — possible RLS recursion!`);
            }

            // Query 2: user_roles table
            const t2Start = Date.now();
            await asAuthenticatedUser(pgClient, user_id, organization_id, async (pg) => {
                return pg.query(`SELECT role FROM user_roles WHERE user_id = $1`, [user_id]);
            });
            const t2Elapsed = Date.now() - t2Start;

            if (t2Elapsed < 3000) {
                ok(`user_roles query completed in ${t2Elapsed}ms (limit: 3000ms)`);
            } else {
                fail(`user_roles query timed out or exceeded 3s (${t2Elapsed}ms) — possible RLS recursion!`);
            }
        }
        console.log('');

        // ── TEST 3: Multi-Tenant Isolation ───────────────────────────────────
        console.log('🔹 Test 3: Multi-Tenant Isolation (Cross-Org Leak Check)');
        const orgsRes = await pgClient.query(
            `SELECT DISTINCT organization_id FROM users WHERE organization_id IS NOT NULL LIMIT 2`
        );

        if (orgsRes.rows.length < 2) {
            warn('Skipping isolation check: fewer than 2 organisations with users found.');
        } else {
            const orgA = orgsRes.rows[0].organization_id;
            const orgB = orgsRes.rows[1].organization_id;

            const userARes = await pgClient.query(
                `SELECT id FROM users WHERE organization_id = $1 LIMIT 1`,
                [orgA]
            );

            if (userARes.rows.length === 0) {
                warn(`Skipping isolation check: no user found in Org A (${orgA}).`);
            } else {
                const userA = userARes.rows[0].id;

                const leakRes = await asAuthenticatedUser(
                    pgClient,
                    userA,
                    orgA,
                    async (pg) =>
                        pg.query(
                            `SELECT id FROM decisions WHERE organization_id = $1`,
                            [orgB]
                        )
                );

                if (leakRes.rows.length === 0) {
                    ok(`Isolation passed: User in Org A cannot see decisions from Org B.`);
                } else {
                    fail(
                        `LEAK DETECTED: User in Org A saw ${leakRes.rows.length} decision(s) from Org B!`
                    );
                }
            }
        }
        console.log('');

        // ── TEST 4: Supabase API Anon Key ────────────────────────────────────
        console.log('🔹 Test 4: Supabase API — Anon Key Security');
        const sb = createClient(STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY);
        const { data: anonData, error: anonError } = await sb
            .from('organizations')
            .select('id')
            .limit(1);

        if (anonError && (anonError.code === '42501' || anonError.code === 'PGRST301')) {
            ok('Anon key correctly blocked from reading organisations.');
        } else if (anonData && anonData.length > 0) {
            fail(`Anon key returned ${anonData.length} organisation row(s) — RLS may be missing!`);
        } else {
            // Empty result with no error = RLS returned 0 rows (also acceptable)
            ok('Anon key returned 0 rows from organisations (RLS active).');
        }
        console.log('');

        // ── TEST 5: Orphaned Auth Users ──────────────────────────────────────
        console.log('🔹 Test 5: Orphaned Auth Users (signup integrity)');
        const orphanRes = await pgClient.query(`
            SELECT au.id::text, au.email
            FROM auth.users au
            LEFT JOIN users u ON u.id::text = au.id::text
            WHERE u.id IS NULL
            ORDER BY au.created_at
        `);

        if (orphanRes.rows.length === 0) {
            ok('All auth users have a corresponding public profile.');
        } else {
            fail(
                `${orphanRes.rows.length} auth user(s) have NO public profile (broken signup):\n` +
                orphanRes.rows.map(r => `      - ${r.email} (${r.id})`).join('\n')
            );
        }
        console.log('');

        // ── Summary ──────────────────────────────────────────────────────────
        console.log('══════════════════════════════════════════════════════════');
        console.log(`  Results: ✅ ${passed} passed  ❌ ${failed} failed  ⚠️  ${warned} skipped`);
        console.log('══════════════════════════════════════════════════════════\n');

        if (failed > 0) {
            console.error('❌ Validation FAILED — see errors above.');
            process.exit(1);
        } else {
            console.log('🎉 Staging Validation Complete — no regressions detected.');
        }
    } catch (err) {
        console.error('\n❌ Validation unexpectedly failed:', err.message);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

runValidation();
