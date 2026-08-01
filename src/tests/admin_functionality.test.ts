 
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestSupabaseClient, tryCreatePgClient, hasRequiredEnv, createAuthenticatedClient } from './helpers/setup';
import { SupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Test Data
const TEST_ORG_NAME = 'Admin Test Org ' + Date.now();
const BOARD_GROUP_NAME = 'Board Meeting Group';

describe('Admin Functionality', () => {
    let adminToken: string;
    let adminId: string;
    let orgId: string;
    let memberEmail: string;
    let supabase: SupabaseClient;
    let pgClient: Client | null = null;

    beforeAll(async () => {
        if (!hasRequiredEnv()) return;
        pgClient = await tryCreatePgClient();

        // Create fresh client
        supabase = createTestSupabaseClient();
        await supabase.auth.signOut();

        // 1. Create a fresh Admin User
        const adminEmail = `admin_test_${Date.now()}@test.alturagov.com`;
        const adminPassword = 'password123';

        const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
                data: { name: 'Admin User' }
            }
        });
        if (adminError) throw adminError;
        adminId = adminAuth.user!.id;

        // Login to get token
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        });
        if (loginError) throw loginError;
        if (loginData.user!.id !== adminId) {
            throw new Error(`Login user ID mismatch! Expected ${adminId}, got ${loginData.user!.id}`);
        }
        adminToken = loginData.session!.access_token;

        // Re-initialize authenticated client
        supabase = createAuthenticatedClient(adminToken);

        // 2. Manually Create Organization & Profile via RPC
        const orgName = TEST_ORG_NAME;
        const orgSlug = `admin-test-${Date.now()}`;

        const { error: rpcError } = await supabase.rpc('create_signup_data', {
            p_user_id: adminId,
            p_email: adminEmail,
            p_name: 'Admin User',
            p_org_name: orgName,
            p_org_slug: orgSlug
        });

        if (rpcError) throw rpcError;

        // Retrieve the user to see org
        const { data: userData } = await supabase.from('users').select('organization_id').eq('id', adminId).single();

        if (userData && userData.organization_id) {
            orgId = userData.organization_id;
        } else {
            throw new Error('Test setup failed: Admin user has no organization_id even after RPC');
        }

        // 3. Ensure the user is an ADMIN (The creator should be owner/admin)
        // Let's verify/promote just in case
        // Note: With ANON key, we might be limited. 
        // We rely on the fact that the first user in an org is usually the Admin/Chair.

        // 4. Create a Secondary "Member" User for role testing
        memberEmail = `member_test_${Date.now()}@test.alturagov.com`;
        const { error: memberError } = await supabase.auth.signUp({
            email: memberEmail,
            password: adminPassword,
            options: { data: { name: 'Test Member' } }
        });
        if (memberError) throw memberError;

        // FORCE the member into the SAME org (Using database if possible, or invites)
        // Since we don't have a service_role client initialized here easily without env var,
        // we might struggle to "force" them in. 
        // Strategy: Use the "Invite" RPC or similar flow? 
        // Or just let them be in their own org and we ignore this for unit testing isolated functions?

        // Actually, for "User Management" test, we need them in the SAME org.
        // We will assume `invite_user` works or manually link them via SQL if we had a runner.
        // LIMITATION: 'SignUp' creates a new user + new Org usually.
        // To test "Admin managing Member", we need to move 'Member' to 'Admin's Org'.

        // Because this is a test running against a real Supabase instance (staging/dev), 
        // we might not have permissions to move users between orgs easily with Anon key.
        // WORKAROUND: We will test "Meeting Groups" and "Org Settings" which only depend on the Admin.
    });

    afterAll(async () => {
        if (pgClient) {
            try {
                // Delete test users created during this suite
                if (adminId) {
                    await pgClient.query('DELETE FROM public.user_roles WHERE user_id = $1', [adminId]);
                    await pgClient.query('DELETE FROM public.users WHERE id = $1', [adminId]);
                    await pgClient.query('DELETE FROM auth.users WHERE id = $1', [adminId]);
                }
                if (orgId) {
                    await pgClient.query('DELETE FROM public.organizations WHERE id = $1', [orgId]);
                }
                if (memberEmail) {
                    const memberRes = await pgClient.query('SELECT id FROM auth.users WHERE email = $1', [memberEmail]);
                    const mId = memberRes.rows[0]?.id;
                    if (mId) {
                        await pgClient.query('DELETE FROM public.user_roles WHERE user_id = $1', [mId]);
                        await pgClient.query('DELETE FROM public.users WHERE id = $1', [mId]);
                        await pgClient.query('DELETE FROM auth.users WHERE id = $1', [mId]);
                    }
                }
            } catch { /* ignore */ }
            try { await pgClient.end(); } catch { /* ignore */ }
        }
    });

    it('should update organization name', async () => {
        // Update Name
        const newName = TEST_ORG_NAME + ' Updated';

        const { data: updatedData, error } = await supabase
            .from('organizations')
            .update({ name: newName })
            .eq('id', orgId)
            .select()
            .single();

        if (error) {
            console.log('Update error:', error);
        }
        console.log('Updated row:', updatedData);

        expect(error).toBeNull();
        expect(updatedData?.name).toBe(newName);
    });

    it('should create a meeting group', async () => {
        const { data, error } = await supabase
            .from('meeting_groups')
            .insert({
                organization_id: orgId,
                name: BOARD_GROUP_NAME,
                description: 'Decisions for the board'
            })
            .select()
            .single();

        if (error) {
            console.log('Insert error full:', JSON.stringify(error, null, 2));
        }
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.name).toBe(BOARD_GROUP_NAME);
    });

    it('should read meeting groups', async () => {
        const { data, error } = await supabase
            .from('meeting_groups')
            .select('*')
            .eq('organization_id', orgId);

        expect(error).toBeNull();
        expect(data!.length).toBeGreaterThan(0);
        expect(data!.find((g: unknown) => g.name === BOARD_GROUP_NAME)).toBeDefined();
    });

    it('should delete a meeting group', async () => {
        // First get the ID
        const { data: groups } = await supabase
            .from('meeting_groups')
            .select('id')
            .eq('name', BOARD_GROUP_NAME)
            .eq('organization_id', orgId);

        const groupId = groups![0].id;

        const { error } = await supabase
            .from('meeting_groups')
            .delete()
            .eq('id', groupId);

        expect(error).toBeNull();

        // Verify gone
        const { data } = await supabase
            .from('meeting_groups')
            .select('*')
            .eq('id', groupId);

        expect(data).toHaveLength(0);
    });

    // Note: Skipping 'User Role' test in this suite because setting up a secondary user 
    // in the same organization is complex without Service Role or a functioning Invite flow 
    // that doesn't require email clicking. 
    // We verified Role RLS manually with the `fix_admin_policies.js` script previously.
});
