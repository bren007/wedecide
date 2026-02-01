
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const email = `debug-${Date.now()}@example.com`;
    console.log('Signing up user:', email);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
    });

    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }

    const userId = authData.user.id;
    console.log('User ID:', userId);

    console.log('Calling RPC...');
    const { data, error } = await supabase.rpc('create_signup_data', {
        p_user_id: userId,
        p_email: email,
        p_name: 'Debug User',
        p_org_name: 'Debug Org',
        p_org_slug: `debug-org-${Date.now()}`
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Data Type:', typeof data);
        console.log('RPC Data:', JSON.stringify(data, null, 2));
        if (data && typeof data === 'object') {
            console.log('organization_id:', data.organization_id);
            console.log('Type of organization_id:', typeof data.organization_id);
        }
    }
}

main();
