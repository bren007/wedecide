const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
            -- Allow Chairs to update decisions in their organization
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'decisions' AND policyname = 'Chairs can update decisions in their organization'
                ) THEN
                    CREATE POLICY "Chairs can update decisions in their organization"
                    ON decisions FOR UPDATE
                    TO authenticated
                    USING (
                        EXISTS (
                            SELECT 1 FROM user_roles
                            WHERE user_id = auth.uid()::text
                            AND organization_id = decisions.organization_id
                            AND role = 'chair'
                        )
                    )
                    WITH CHECK (
                        EXISTS (
                            SELECT 1 FROM user_roles
                            WHERE user_id = auth.uid()::text
                            AND organization_id = decisions.organization_id
                            AND role = 'chair'
                        )
                    );
                END IF;
            END $$;
        `;

        await client.query(sql);
        console.log('RLS policy for Chairs added successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
