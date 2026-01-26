const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaChanges() {
    console.log('🚀 Applying schema changes for decision form enhancements...\n');

    try {
        // 1. Add reversibility_type to decisions
        console.log('📝 Step 1: Adding reversibility_type to decisions table...');
        const { error: reversibilityError } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE decisions 
        ADD COLUMN IF NOT EXISTS reversibility_type TEXT 
        CHECK (reversibility_type IN ('type1_irreversible', 'type2_reversible'));
        
        CREATE INDEX IF NOT EXISTS idx_decisions_reversibility ON decisions(reversibility_type);
      `
        });

        if (reversibilityError) {
            // Try direct query if RPC doesn't exist
            const fs = require('fs');
            const sql = fs.readFileSync('./add_reversibility_to_decisions.sql', 'utf8');
            console.log('   Using direct SQL execution...');

            // Note: This requires running the SQL file manually via Supabase dashboard
            console.log('   ⚠️  Please run add_reversibility_to_decisions.sql in Supabase SQL Editor');
        } else {
            console.log('   ✅ Reversibility type added successfully');
        }

        // 2. Create meeting_groups table
        console.log('\n📝 Step 2: Creating meeting_groups table...');
        console.log('   ⚠️  Please run meeting_groups_schema.sql in Supabase SQL Editor');

        // 3. Create decision_rapid_roles table
        console.log('\n📝 Step 3: Creating decision_rapid_roles table...');
        console.log('   ⚠️  Please run decision_rapid_roles_schema.sql in Supabase SQL Editor');

        console.log('\n✅ Schema change instructions prepared!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open Supabase Dashboard → SQL Editor');
        console.log('   2. Run add_reversibility_to_decisions.sql');
        console.log('   3. Run meeting_groups_schema.sql');
        console.log('   4. Run decision_rapid_roles_schema.sql');
        console.log('   5. Verify tables are created with: SELECT * FROM meeting_groups LIMIT 1;');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

applySchemaChanges();
