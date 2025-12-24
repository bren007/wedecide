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

const TEST_EMAIL = `meeting-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_ORG_NAME = 'Meeting Test Org';
const TEST_ORG_SLUG = `meeting-org-${Date.now()}`;

describe('Meetings & Agenda Integration', () => {
    let userId: string;
    let organizationId: string;
    let meetingId: string;
    let agendaItemId: string;
    let decisionId: string;

    beforeAll(async () => {
        await pgClient.connect();

        // 1. Setup User & Org
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });
        if (authError) throw authError;
        userId = authData.user!.id;

        const { data: rpcData, error: rpcError } = await supabase.rpc('create_signup_data', {
            p_user_id: userId,
            p_email: TEST_EMAIL,
            p_name: 'Meeting Chair',
            p_org_name: TEST_ORG_NAME,
            p_org_slug: TEST_ORG_SLUG
        });
        if (rpcError) throw rpcError;
        // @ts-ignore
        organizationId = rpcData.organization_id;

        // Sign in to get session for RLS tests
        await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });
    });

    afterAll(async () => {
        try {
            console.log('🧹 Cleaning up meeting test data...');
            if (organizationId) {
                await pgClient.query("DELETE FROM organizations WHERE id = $1", [organizationId]);
            }
            await pgClient.query("DELETE FROM auth.users WHERE email = $1", [TEST_EMAIL]);
            console.log('✅ Cleanup complete.');
        } catch (e) {
            console.error('⚠️ Cleanup failed:', e);
        } finally {
            await pgClient.end();
        }
    });

    it('should create a meeting', async () => {
        const { data, error } = await supabase
            .from('meetings')
            .insert({
                organization_id: organizationId,
                title: 'Governance Session Q1',
                scheduled_at: new Date(Date.now() + 86400000).toISOString(),
                location: 'Main Hall'
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        meetingId = data.id;
        expect(data.title).toBe('Governance Session Q1');
        console.log('✅ Meeting Created:', meetingId);
    });

    it('should create an agenda item for the meeting', async () => {
        const { data, error } = await supabase
            .from('agenda_items')
            .insert({
                meeting_id: meetingId,
                title: 'Review New Policy',
                order_index: 1
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        agendaItemId = data.id;
        expect(data.meeting_id).toBe(meetingId);
        console.log('✅ Agenda Item Created:', agendaItemId);
    });

    it('should create a decision and link it to the agenda item', async () => {
        // 1. Create Decision
        const { data: decision, error: decError } = await supabase
            .from('decisions')
            .insert({
                organization_id: organizationId,
                owner_id: userId,
                title: 'Policy Alpha Approval',
                status: 'draft',
                decision_type: 'approve'
            })
            .select()
            .single();

        expect(decError).toBeNull();
        decisionId = decision.id;

        // 2. Link to Agenda Item
        const { data: linkedDec, error: linkError } = await supabase
            .from('decisions')
            .update({ agenda_item_id: agendaItemId })
            .eq('id', decisionId)
            .select()
            .single();

        expect(linkError).toBeNull();
        expect(linkedDec.agenda_item_id).toBe(agendaItemId);
        console.log('✅ Decision Linked to Agenda.');
    });

    it('should verify the meeting remains visible to the organization', async () => {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

        expect(error).toBeNull();
        expect(data.id).toBe(meetingId);
    });
});
