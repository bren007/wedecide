
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInitiatives() {
    const { data, error } = await supabase
        .from('initiatives')
        .select('*');

    if (error) {
        console.error('Error fetching initiatives:', error);
        return;
    }

    console.log('Initiatives found:', data.length);
    if (data.length > 0) {
        console.table(data.map(i => ({ title: i.title, status: i.status, id: i.id })));
    } else {
        console.log('No initiatives found.');
    }
}

checkInitiatives();
