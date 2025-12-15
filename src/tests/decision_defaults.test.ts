
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

describe('Decision Creation & Schema Defaults', () => {
    let client: Client;
    let orgId: string;
    let userId: string;

    beforeAll(async () => {
        client = new Client({
            connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        // Setup User/Org
        orgId = randomUUID();
        userId = randomUUID();

        // Create Org (minimal fields)
        await client.query(`INSERT INTO organizations (id, name, slug) VALUES ($1, 'Test Org Defaults', $2)`, [orgId, `test-defaults-${randomUUID()}`]);

        // Create User
        await client.query(`INSERT INTO users (id, email, name, organization_id) VALUES ($1, $2, 'Test User', $3)`, [userId, `test-defaults-${randomUUID()}@example.com`, orgId]);
    });

    afterAll(async () => {
        try {
            await client.query('DELETE FROM decisions WHERE organization_id = $1', [orgId]);
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            await client.query('DELETE FROM organizations WHERE id = $1', [orgId]);
        } catch (e) {
            console.error('Cleanup failed:', e);
        } finally {
            await client.end();
        }
    });

    it('should create a decision successfully relying on database defaults for ID and timestamps', async () => {
        // We insert WITHOUT providing id, created_at, or updated_at
        // This validates that the database has the correct DEFAULT values configured
        const res = await client.query(`
            INSERT INTO decisions (title, owner_id, organization_id, status)
            VALUES ('Default Value Test', $1, $2, 'draft')
            RETURNING id, created_at, updated_at, status
        `, [userId, orgId]);

        const decision = res.rows[0];

        expect(decision.id).toBeDefined();
        expect(typeof decision.id).toBe('string');
        expect(decision.created_at).toBeDefined();
        expect(decision.updated_at).toBeDefined();
        expect(decision.status).toBe('draft');
    });

    it('should fail if required fields are missing', async () => {
        try {
            await client.query(`
                INSERT INTO decisions (owner_id, organization_id)
                VALUES ($1, $2)
            `, [userId, orgId]);
            expect(true).toBe(false); // Should not reach here
        } catch (e: any) {
            expect(e).toBeDefined();
            // Expecting NOT NULL violation for 'title'
            expect(e.message).toContain('title');
        }
    });
});
