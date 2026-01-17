import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DB_CONNECTION_STRING = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DB_CONNECTION_STRING) {
    throw new Error('Missing environment variables. Check .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const pgClient = new Client({
    connectionString: DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

const TEST_EMAIL = `auto-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_ORG_NAME = 'Automated Test Org';
const TEST_ORG_SLUG = `auto-org-${Date.now()}`;

describe('Auth & Signup Integration Flow', () => {

    beforeAll(async () => {
        await pgClient.connect();
    });

    afterAll(async () => {
        // Clean up test data directly from DB
        try {
            console.log('🧹 Cleaning up integration test data...');

            // 1. Find the organization ID
            const res = await pgClient.query("SELECT organization_id FROM users WHERE email = $1", [TEST_EMAIL]);
            const orgId = res.rows[0]?.organization_id;

            if (orgId) {
                // Delete in order to satisfy FK constraints
                await pgClient.query("DELETE FROM user_roles WHERE organization_id = $1", [orgId]);
                await pgClient.query("DELETE FROM decisions WHERE organization_id = $1", [orgId]);
                await pgClient.query("DELETE FROM meetings WHERE organization_id = $1", [orgId]);
                await pgClient.query("DELETE FROM users WHERE organization_id = $1", [orgId]);
                await pgClient.query("DELETE FROM organizations WHERE id = $1", [orgId]);
            }

            // 2. Delete from auth.users
            await pgClient.query("DELETE FROM auth.users WHERE email = $1", [TEST_EMAIL]);

            console.log('✅ Cleanup complete.');
        } catch (e) {
            console.error('⚠️ Cleanup failed (non-critical for dev):', e);
        } finally {
            await pgClient.end();
        }
    });

    it('should successfully sign up a new user and create organization data', async () => {
        // 1. Sign Up (Auth)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (authError) console.error('❌ Auth Error:', authError);
        expect(authError).toBeNull();
        expect(authData.user).toBeDefined();
        const userId = authData.user?.id;

        if (!userId) throw new Error('User ID is null');
        console.log('✅ Auth Signup Successful. User ID:', userId);

        // 2. Call RPC to create Organization & Profile
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_signup_data', {
            p_user_id: userId,
            p_email: TEST_EMAIL,
            p_name: 'Test User',
            p_org_name: TEST_ORG_NAME,
            p_org_slug: TEST_ORG_SLUG
        });

        if (rpcError) {
            console.error('❌ RPC Error:', JSON.stringify(rpcError, null, 2));
        }
        expect(rpcError).toBeNull();
        expect(rpcData).toBeDefined();
        // @ts-ignore
        expect(rpcData.success).toBe(true);
        // @ts-ignore
        expect(rpcData.organization_id).toBeDefined();

        console.log('✅ RPC Execution Successful.');
    }, 15000);

    it('should allow the new user to sign in immediately', async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (error) console.error('❌ Sign In Error:', error);
        expect(error).toBeNull();
        expect(data.session).toBeDefined();
        expect(data.user?.email).toBe(TEST_EMAIL);
        console.log('✅ Login Successful.');
    });

    it('should have created the correct database records', async () => {
        const userRes = await pgClient.query("SELECT * FROM users WHERE email = $1", [TEST_EMAIL]);
        expect(userRes.rows.length).toBe(1);
        const user = userRes.rows[0];
        expect(user.name).toBe('Test User');

        const orgRes = await pgClient.query("SELECT * FROM organizations WHERE id = $1", [user.organization_id]);
        expect(orgRes.rows.length).toBe(1);
        expect(orgRes.rows[0].name).toBe(TEST_ORG_NAME);

        const roleRes = await pgClient.query("SELECT * FROM user_roles WHERE user_id = $1", [user.id]);
        expect(roleRes.rows.length).toBe(1);
        expect(roleRes.rows[0].role).toBe('admin');

        console.log('✅ Database Records Verified.');
    });
});
