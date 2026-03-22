import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'Missing Supabase environment variables. Please check your production environment.'
        );
    } else {
        console.warn('⚠️ Missing Supabase environment variables. Database features will be unavailable.');
    }
}

import type { Database } from '../types/supabase';

declare global {
    var _supabaseInstance: ReturnType<typeof createClient<Database>> | undefined;
}

export const supabase = globalThis._supabaseInstance || createClient<Database>(supabaseUrl, supabaseAnonKey);
if (process.env.NODE_ENV !== 'production') {
    globalThis._supabaseInstance = supabase;
}
