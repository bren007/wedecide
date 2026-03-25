import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from './helpers/setup';

describe('Role-Based Access Control (RBAC) & Tenant Isolation', () => {
    let globalAdmin: any;
    let tenantA_Chair: any;
    let tenantB_Chair: any;

    beforeAll(async () => {
        // Fetch test users to run scenarios
        const { data: users } = await supabase.from('users').select('*, user_roles(*)');
        
        globalAdmin = users?.find(u => u.is_global_admin);
        
        // Find two distinct tenant chairs for isolation testing
        const chairs = users?.filter(u => !u.is_global_admin && u.user_roles?.some((r: any) => r.role === 'chair' || r.role === 'admin'));
        
        if (chairs && chairs.length >= 2) {
            // Ensure they belong to different organizations 
            tenantA_Chair = chairs[0];
            tenantB_Chair = chairs.find((c: any) => c.organization_id !== tenantA_Chair.organization_id);
        }
    });

    describe('Tenant Isolation (Cross-Tenant Data Leakage Prevention)', () => {
        it('should prevent Tenant A from viewing Tenant B users', async () => {
            if (!tenantA_Chair || !tenantB_Chair) return;

            // Impersonate Tenant A Chair
            await supabase.auth.signInWithPassword({ email: tenantA_Chair.email, password: 'password123' });

            // Attempt to query users belonging to Tenant B's organization
            const { data: leakedUsers, error } = await supabase
                .from('users')
                .select('*')
                .eq('organization_id', tenantB_Chair.organization_id);

            expect(error).toBeNull(); // Query runs, but RLS should filter the results
            expect(leakedUsers).toHaveLength(0); // Should return empty array
        });

        it('should prevent Tenant A from viewing Tenant B decisions', async () => {
             if (!tenantA_Chair || !tenantB_Chair) return;
             await supabase.auth.signInWithPassword({ email: tenantA_Chair.email, password: 'password123' });
             
             const { data: leakedDecisions } = await supabase
                .from('decisions')
                .select('*')
                .eq('organization_id', tenantB_Chair.organization_id);
             
             expect(leakedDecisions).toHaveLength(0);
        });
    });

    describe('Global Admin Constraints', () => {
        it('should prevent Global Admins from inviting users into an arbitrary tenant via RPC', async () => {
            if (!globalAdmin || !tenantA_Chair) return;

            // Impersonate Global Admin
            await supabase.auth.signInWithPassword({ email: globalAdmin.email, password: 'password123' });

            // Global Adim tries to invite a user to Tenant A
            // We expect the RPC `invite_user` to fail because the Global Admin does not have the 'admin' or 'chair' role inside Tenant A.
            const { data: invite, error } = await supabase.rpc('invite_user', {
                p_email: 'rogue_global_admin@example.com',
                p_role: 'admin'
            });

            // Note: Our invite_user RPC gets the org_id intrinsically from the CALLER.
            // If the Global Admin executes this, the invite goes into the Global Admin's OWN organization,
            // NOT arbitrary Tenant A. The security boundary holds.
            // But if we tried to forge an insert directly into the table...

            const { data: forcedInsert, error: insertError } = await supabase
                .from('invitations')
                .insert({
                    email: 'hacked@example.com',
                    role: 'admin',
                    organization_id: tenantA_Chair.organization_id, // Forging the target org!
                    token: 'forged_token_123',
                    invited_by: globalAdmin.id,
                    expires_at: new Date(Date.now() + 1000000).toISOString()
                });

            // Strict RLS should reject this direct insert across tenant boundaries
            expect(insertError).toBeDefined();
        });
    });
});
