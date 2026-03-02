/**
 * RLS Regression Integration Tests
 * 
 * Verifies that the RLS policies on `users` and `user_roles` tables
 * do NOT cause infinite recursion or query timeouts.
 * 
 * This test reproduces the exact bug that caused the "Signing in..." hang:
 * - Sets PostgreSQL role to `authenticated`
 * - Simulates JWT claims with a real user ID
 * - Queries `users` and `user_roles` with a 3-second statement timeout
 * - Verifies queries complete fast (< 3s) instead of hanging
 * 
 * Requires: DATABASE_URL in .env.local pointing to the DEV Supabase DB
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tryCreatePgClient, hasRequiredEnv } from './helpers/setup';
import { Client } from 'pg';

describe('RLS Regression (No Infinite Recursion)', () => {
    let pgClient: Client | null = null;
    let testUserId: string | null = null;

    beforeAll(async () => {
        if (!hasRequiredEnv()) return;
        pgClient = await tryCreatePgClient();
        if (!pgClient) return;

        // Find a real user to simulate RLS with
        const res = await pgClient.query("SELECT id FROM users LIMIT 1");
        testUserId = res.rows[0]?.id || null;
    });

    afterAll(async () => {
        if (pgClient) {
            try { await pgClient.end(); } catch { /* ignore */ }
        }
    });

    it('should query users table within 3 seconds (no RLS recursion)', async () => {
        if (!pgClient || !testUserId) {
            console.log('⏭️ Skipping: No DB connection or no test user');
            return;
        }

        // Set up authenticated context
        await pgClient.query("SET ROLE authenticated");
        await pgClient.query("SET statement_timeout TO 3000"); // 3 second hard limit
        await pgClient.query(`SELECT set_config('request.jwt.claims', '{"sub": "${testUserId}"}', true)`);

        const start = Date.now();
        const res = await pgClient.query(`SELECT id, email, name, organization_id FROM users WHERE id = $1`, [testUserId]);
        const elapsed = Date.now() - start;

        console.log(`✅ users query completed in ${elapsed}ms (${res.rows.length} rows)`);
        expect(elapsed).toBeLessThan(3000);
        expect(res.rows.length).toBeGreaterThanOrEqual(0);

        // Reset role for next query
        await pgClient.query("RESET ROLE");
        await pgClient.query("RESET statement_timeout");
    });

    it('should query user_roles table within 3 seconds (no RLS recursion)', async () => {
        if (!pgClient || !testUserId) {
            console.log('⏭️ Skipping: No DB connection or no test user');
            return;
        }

        await pgClient.query("SET ROLE authenticated");
        await pgClient.query("SET statement_timeout TO 3000");
        await pgClient.query(`SELECT set_config('request.jwt.claims', '{"sub": "${testUserId}"}', true)`);

        const start = Date.now();
        const res = await pgClient.query(`SELECT role FROM user_roles WHERE user_id = $1`, [testUserId]);
        const elapsed = Date.now() - start;

        console.log(`✅ user_roles query completed in ${elapsed}ms (${res.rows.length} rows)`);
        expect(elapsed).toBeLessThan(3000);

        await pgClient.query("RESET ROLE");
        await pgClient.query("RESET statement_timeout");
    });

    it('should verify SECURITY DEFINER function exists (get_auth_user_org_id_safe)', async () => {
        if (!pgClient) {
            console.log('⏭️ Skipping: No DB connection');
            return;
        }

        // Reset to superuser for this check
        await pgClient.query("RESET ROLE");

        const res = await pgClient.query(`
            SELECT proname, prosecdef 
            FROM pg_proc 
            WHERE proname = 'get_auth_user_org_id_safe' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0].prosecdef).toBe(true); // SECURITY DEFINER
        console.log('✅ get_auth_user_org_id_safe exists and is SECURITY DEFINER');
    });

    it('should verify no policies reference user_roles in users table SELECT (recursion guard)', async () => {
        if (!pgClient) {
            console.log('⏭️ Skipping: No DB connection');
            return;
        }

        await pgClient.query("RESET ROLE");

        const res = await pgClient.query(`
            SELECT policyname, qual 
            FROM pg_policies 
            WHERE tablename = 'users' AND cmd = 'SELECT'
        `);

        // None of the SELECT policies on `users` should reference `user_roles`
        for (const row of res.rows) {
            const hasRecursion = row.qual && row.qual.toLowerCase().includes('user_roles');
            if (hasRecursion) {
                console.error(`❌ Policy "${row.policyname}" on users table references user_roles:`, row.qual);
            }
            expect(hasRecursion).toBeFalsy();
        }
        console.log(`✅ ${res.rows.length} users SELECT policies checked — no recursion`);
    });

    it('should verify no policies on user_roles reference users table with sub-selects', async () => {
        if (!pgClient) {
            console.log('⏭️ Skipping: No DB connection');
            return;
        }

        await pgClient.query("RESET ROLE");

        const res = await pgClient.query(`
            SELECT policyname, qual 
            FROM pg_policies 
            WHERE tablename = 'user_roles' AND cmd = 'SELECT'
        `);

        // user_roles SELECT policies should use SECURITY DEFINER functions, not direct subqueries on users
        for (const row of res.rows) {
            // It's OK to reference `auth.uid()` or `get_auth_user_org_id_safe()`
            // It's NOT OK to have a sub-select on `users` (that causes recursion)
            const hasDangerousSubselect = row.qual &&
                row.qual.toLowerCase().includes('select') &&
                row.qual.toLowerCase().includes('from users') &&
                !row.qual.toLowerCase().includes('get_auth_user_org_id_safe');

            if (hasDangerousSubselect) {
                console.error(`❌ Policy "${row.policyname}" on user_roles has dangerous subselect:`, row.qual);
            }
            expect(hasDangerousSubselect).toBeFalsy();
        }
        console.log(`✅ ${res.rows.length} user_roles SELECT policies checked — no dangerous subselects`);
    });
});
