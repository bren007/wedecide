import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from './helpers/setup';

describe('Invitation System (invite_user RPC)', () => {
    let globalAdminUser: any;
    let orgChair: any;
    let orgMember: any;
    let testOrgId: string;
    let testOrg2Id: string;

    beforeAll(async () => {
        // Find existing users from your standard test seed data
        const { data: users } = await supabase.from('users').select('*, user_roles(*)');
        
        // Setup identifiers to run realistic tests
        orgChair = users?.find(u => u.user_roles?.some((r: any) => r.role === 'chair' || r.role === 'admin') && !u.is_global_admin);
        orgMember = users?.find(u => u.user_roles?.some((r: any) => r.role === 'member') && !u.is_global_admin);
        globalAdminUser = users?.find(u => u.is_global_admin);

        testOrgId = orgChair?.organization_id;
        testOrg2Id = users?.find(u => u.organization_id !== testOrgId)?.organization_id;
    });

    it('should allow an org Chair to generate an invite for their own organization', async () => {
        if (!orgChair) return;

        // Impersonate Chair
        const { data: { session } } = await supabase.auth.signInWithPassword({
            email: orgChair.email,
            password: 'password123' 
        });

        const { data: invite, error } = await supabase.rpc('invite_user', {
            p_email: 'new_hire@example.com',
            p_role: 'member'
        });

        expect(error).toBeNull();
        expect(invite.success).toBe(true);
        expect(invite.token).toBeDefined();

        // Verify the record was inserted into the invitations table with 7 day expiry
        const { data: record } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', invite.token)
            .single();

        expect(record).toBeDefined();
        expect(record.email).toBe('new_hire@example.com');
        expect(record.organization_id).toBe(orgChair.organization_id);
    });

    it('should NOT allow a regular member to generate an invite', async () => {
        if (!orgMember) return;

        // Impersonate Member
        const { data: { session } } = await supabase.auth.signInWithPassword({
            email: orgMember.email,
            password: 'password123'
        });

        const { data: invite, error } = await supabase.rpc('invite_user', {
            p_email: 'hacker@example.com',
            p_role: 'admin'
        });

        expect(error).toBeDefined();
        expect(error?.message).toContain('Unauthorized: Only admins or chairs can invite users.');
        expect(invite).toBeNull();
    });
});
