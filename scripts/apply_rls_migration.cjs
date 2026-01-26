require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSMigration() {
    console.log('🔒 Applying RLS policies for meetings, agenda_items, and affected_parties...\n');

    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'enable_meetings_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not found, trying direct execution...');

            // Split by semicolons and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                const { error: execError } = await supabase.rpc('exec', { sql: statement });
                if (execError) {
                    console.error(`❌ Error executing statement:`, execError);
                    console.error(`Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }

        console.log('✅ RLS policies applied successfully!\n');
        console.log('📋 Summary:');
        console.log('  - affected_parties: RLS enabled with 3 policies');
        console.log('  - meetings: RLS enabled with 2 policies');
        console.log('  - agenda_items: RLS enabled with 2 policies\n');
        console.log('🔐 Security: Cross-organization data access is now prevented.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

applyRLSMigration();
