import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const DB_CONNECTION_STRING = process.env.DIRECT_URL || process.env.DATABASE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const pgClient = new Client({
    connectionString: DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

describe('Decision Creation Integration', () => {
    let testUserId: string;
    let testOrgId: string;

    beforeAll(async () => {
        await pgClient.connect();
        const res = await pgClient.query("SELECT id, email, organization_id FROM users LIMIT 1");
        if (res.rows.length > 0) {
            testUserId = res.rows[0].id;
            testOrgId = res.rows[0].organization_id;
        }
    });

    afterAll(async () => {
        await pgClient.end();
    });

    it('should create a decision with type, and affected parties (Bypassing RLS for Schema Check)', async () => {
        if (!testUserId) return;

        const testTitle = `Test Decision ${Date.now()}`;

        // 1. Create Decision via PG
        const decRes = await pgClient.query(
            "INSERT INTO decisions (title, description, decision_type, owner_id, organization_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [testTitle, 'Test Desc', 'note', testUserId, testOrgId, 'active']
        );
        const decisionId = decRes.rows[0].id;

        // 2. Add Affected Party via PG
        await pgClient.query(
            "INSERT INTO affected_parties (decision_id, name) VALUES ($1, $2)",
            [decisionId, 'Test Team Alpha']
        );

        // 3. Verify
        const partyRes = await pgClient.query("SELECT * FROM affected_parties WHERE decision_id = $1", [decisionId]);
        expect(partyRes.rows.length).toBe(1);
        expect(partyRes.rows[0].name).toBe('Test Team Alpha');

        const decCheck = await pgClient.query("SELECT decision_type FROM decisions WHERE id = $1", [decisionId]);
        expect(decCheck.rows[0].decision_type).toBe('note');

        // Cleanup
        await pgClient.query("DELETE FROM decisions WHERE id = $1", [decisionId]);
    });
});
