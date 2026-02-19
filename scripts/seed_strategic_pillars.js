
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const pillars = [
    { title: 'Growth & Innovation', target_weight: 40 },
    { title: 'Operational Excellence', target_weight: 30 },
    { title: 'Customer Experience', target_weight: 20 },
    { title: 'ESG & Compliance', target_weight: 10 }
];

async function main() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Get ALL unique Organization IDs from users
        const orgRes = await client.query('SELECT DISTINCT organization_id FROM users WHERE organization_id IS NOT NULL');

        if (orgRes.rows.length === 0) {
            console.error('❌ No organizations found.');
            process.exit(1);
        }

        const orgIds = orgRes.rows.map(row => row.organization_id);
        console.log(`Found ${orgIds.length} unique Organization IDs.`);

        // 2. Iterate and seed for each
        for (const orgId of orgIds) {
            // Check for existing pillars
            const checkRes = await client.query('SELECT count(*) FROM strategic_pillars WHERE org_id = $1', [orgId]);
            const count = parseInt(checkRes.rows[0].count);

            if (count > 0) {
                console.log(`ℹ️  Organization ${orgId} already has pillars. Skipping.`);
                continue;
            }

            console.log(`🌱 Seeding pillars for Organization ${orgId}...`);
            for (const p of pillars) {
                await client.query(
                    'INSERT INTO strategic_pillars (org_id, title, target_weight) VALUES ($1, $2, $3)',
                    [orgId, p.title, p.target_weight]
                );
            }
            console.log(`   ✅ Seeded.`);
        }

        console.log('🎉 Seeding complete for all organizations!');

    } catch (err) {
        console.error('❌ Error seeding pillars:', err);
    } finally {
        await client.end();
    }
}

main();
