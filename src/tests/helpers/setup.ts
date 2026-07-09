/**
 * Shared test helpers for WeDecide / AlturaGov test suites.
 * 
 * Provides:
 * - DB connection factory (uses DATABASE_URL since DIRECT_URL is stale)
 * - Supabase client factory
 * - Graceful skip if DB is unreachable
 * - Test data cleanup utilities
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Environment variables
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
// Transaction mode (port 6543, PgBouncer) — good for general queries but does NOT persist session state.
export const DB_CONNECTION_STRING = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
// Session mode (port 5432, direct) — required for SET ROLE / set_config() / statement_timeout tests.
export const DB_SESSION_CONNECTION_STRING = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

/**
 * Create a fresh Supabase client (no session persistence).
 * Each test suite should create its own to avoid cross-contamination.
 */
export function createTestSupabaseClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
    });
}

/**
 * Create an authenticated Supabase client with a specific access token.
 */
export function createAuthenticatedClient(accessToken: string): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
        auth: { persistSession: false },
    });
}

/**
 * Create and connect a pg Client.
 * Tests should call `await client.end()` in afterAll.
 */
export async function createPgClient(): Promise<Client> {
    const client = new Client({
        connectionString: DB_CONNECTION_STRING,
        connectionTimeoutMillis: 5000, // Fail fast — don't hang if host is unreachable
        // pgbouncer=true is already in the URL for transaction mode
    });
    await client.connect();
    return client;
}

/**
 * Try to connect to the DB. If it fails, return null (for graceful skip logic).
 */
export async function tryCreatePgClient(): Promise<Client | null> {
    try {
        return await createPgClient();
    } catch (_e: unknown) {
        console.warn(`⚠️ DB connection failed: ${(_e as Error).message}. Integration tests will be skipped.`);
        return null;
    }
}

/**
 * Check if all required environment variables are present.
 */
export function hasRequiredEnv(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY && DB_CONNECTION_STRING);
}

/**
 * Clean up all test data created by a specific test organization.
 */
export async function cleanupTestOrg(pgClient: Client, orgId: string): Promise<void> {
    try {
        // Delete in FK order
        await pgClient.query("DELETE FROM meeting_attendees WHERE meeting_id IN (SELECT id FROM meetings WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM agenda_items WHERE meeting_id IN (SELECT id FROM meetings WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM meeting_groups WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM meetings WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM decision_feedback WHERE decision_id IN (SELECT id FROM decisions WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM stakeholders WHERE decision_id IN (SELECT id FROM decisions WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM affected_parties WHERE decision_id IN (SELECT id FROM decisions WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM documents WHERE decision_id IN (SELECT id FROM decisions WHERE organization_id = $1)", [orgId]);
        await pgClient.query("DELETE FROM decisions WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM initiatives WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM user_roles WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM users WHERE organization_id = $1", [orgId]);
        await pgClient.query("DELETE FROM organizations WHERE id = $1", [orgId]);
    } catch (_e: unknown) {
        // Some tables may not exist - that's fine
        if (!(_e as Error).message.includes('does not exist')) {
            console.warn('⚠️ Partial cleanup error:', (_e as Error).message);
        }
    }
}

/**
 * Clean up a test user from auth.users by email.
 */
export async function cleanupAuthUser(pgClient: Client, email: string): Promise<void> {
    try {
        await pgClient.query("DELETE FROM auth.users WHERE email = $1", [email]);
    } catch (_e: unknown) {
        console.warn('⚠️ Auth user cleanup failed:', (_e as Error).message);
    }
}
