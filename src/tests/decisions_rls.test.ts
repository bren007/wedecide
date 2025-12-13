import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

describe('Decision RLS Security (SQL Simulation)', () => {
    let client: Client;
    let orgA_id: string, userA_id: string, userB_id: string;
    let orgC_id: string, userC_id: string;
    let decision_id: string;

    beforeAll(async () => {
        client = new Client({
            connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        // Setup Test Data
        orgA_id = randomUUID();
        userA_id = randomUUID(); // Owner
        userB_id = randomUUID(); // Member
        orgC_id = randomUUID();
        userC_id = randomUUID(); // Outsider

        // Create Orgs
        await client.query(`INSERT INTO organizations (id, name, slug, updated_at) VALUES ($1, 'Org A', $2, NOW())`, [orgA_id, `org-a-${randomUUID()}`]);
        await client.query(`INSERT INTO organizations (id, name, slug, updated_at) VALUES ($1, 'Org C', $2, NOW())`, [orgC_id, `org-c-${randomUUID()}`]);

        // Create Users
        await client.query(`INSERT INTO users (id, email, name, organization_id, updated_at) VALUES ($1, $2, 'User A', $3, NOW())`, [userA_id, `a-${randomUUID()}@test.com`, orgA_id]);
        await client.query(`INSERT INTO users (id, email, name, organization_id, updated_at) VALUES ($1, $2, 'User B', $3, NOW())`, [userB_id, `b-${randomUUID()}@test.com`, orgA_id]);
        await client.query(`INSERT INTO users (id, email, name, organization_id, updated_at) VALUES ($1, $2, 'User C', $3, NOW())`, [userC_id, `c-${randomUUID()}@test.com`, orgC_id]);

        // Create Decision for User A
        decision_id = randomUUID();
        await client.query(`INSERT INTO decisions (id, title, owner_id, organization_id, status, updated_at) VALUES ($1, 'Top Secret Plan', $2, $3, 'draft', NOW())`, [decision_id, userA_id, orgA_id]);
    });

    afterAll(async () => {
        // Cleanup
        try {
            await client.query('DELETE FROM stakeholders WHERE decision_id = $1', [decision_id]);
            await client.query('DELETE FROM decisions WHERE organization_id IN ($1, $2)', [orgA_id, orgC_id]);
            await client.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [userA_id, userB_id, userC_id]);
            await client.query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgA_id, orgC_id]);
        } catch (e) {
            console.error('Cleanup failed:', e);
        } finally {
            await client.end();
        }
    });

    // Helper to simulate session
    const runAsUser = async (userId: string, query: string, params: any[] = []) => {
        try {
            await client.query('BEGIN');
            await client.query(`SET LOCAL ROLE authenticated`);
            await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: userId })]);
            const res = await client.query(query, params);
            await client.query('COMMIT');
            await client.query('RESET ROLE');
            return { success: true, rows: res.rows, rowCount: res.rowCount };
        } catch (e: any) {
            await client.query('ROLLBACK');
            await client.query('RESET ROLE');
            return { success: false, error: e.message };
        }
    };

    it('should NOT allow an outsider (User C) to read Decision A', async () => {
        const res = await runAsUser(userC_id, 'SELECT * FROM decisions WHERE id = $1', [decision_id]);
        expect(res.rowCount).toBe(0);
    });

    it('should allow a member (User B) to read Decision A', async () => {
        const res = await runAsUser(userB_id, 'SELECT * FROM decisions WHERE id = $1', [decision_id]);
        expect(res.rowCount).toBe(1);
    });

    it('should NOT allow a member (User B) to UPDATE Decision A', async () => {
        // USING policy should filter out rows, resulting in 0 updates, OR WITH CHECK might throw
        const res = await runAsUser(userB_id, "UPDATE decisions SET title = 'Hacked' WHERE id = $1", [decision_id]);
        // Expecting 0 rows updated because the USING policy likely restricts UPDATE to owner only?
        // Let's verify our policy assumption. Usually "owner only" for update means rowCount 0.
        expect(res.rowCount).toBe(0);
    });

    it('should allow the owner (User A) to UPDATE Decision A', async () => {
        const res = await runAsUser(userA_id, "UPDATE decisions SET title = 'Updated Title' WHERE id = $1", [decision_id]);
        expect(res.rowCount).toBe(1);
    });

    it('should NOT allow a member (User B) to add a stakeholder', async () => {
        const res = await runAsUser(userB_id,
            `INSERT INTO stakeholders (id, decision_id, user_id, name, email) VALUES ($1, $2, $3, 'User C', 'c@test.com')`,
            [randomUUID(), decision_id, userC_id]
        );
        // Expecting failure due to WITH CHECK or RLS
        expect(res.success).toBe(false);
    });

    it('should allow the owner (User A) to add a stakeholder', async () => {
        const res = await runAsUser(userA_id,
            `INSERT INTO stakeholders (id, decision_id, user_id, name, email) VALUES ($1, $2, $3, 'User B', 'b@test.com')`,
            [randomUUID(), decision_id, userB_id]
        );
        expect(res.success).toBe(true);
    });
});
