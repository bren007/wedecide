
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LedgerEntry {
    id: string;
    action_type: string;
    rationale: string;
    created_at: string;
    initiative_id: string;
    chair_id: string;
    committed_outside_meeting?: boolean;
    initiatives?: {
        title: string;
        approval_mandate?: string;
        relative_priority?: string;
    };
    users?: { email: string }; // We only have email in simple schema usually
}

export const useStrategicLedger = () => {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('strategic_ledger')
                .select(`
                    *,
                    initiatives (title, approval_mandate, relative_priority),
                    users (email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data as unknown as LedgerEntry[]);
        } catch (err: unknown) {
            console.error("Error fetching ledger:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    return { entries, loading, error, refresh: fetchLedger };
};
