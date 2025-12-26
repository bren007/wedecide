import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AffectedParty {
    id: string;
    decision_id: string;
    name: string;
    created_at: string;
}

export function useAffectedParties(decisionId: string | undefined) {
    const { user } = useAuth();
    const [parties, setParties] = useState<AffectedParty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (decisionId && user?.organization_id) {
            fetchParties();
        }
    }, [decisionId, user?.organization_id]);

    async function fetchParties() {
        if (!decisionId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('affected_parties')
                .select('*')
                .eq('decision_id', decisionId);

            if (error) throw error;
            setParties(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function addParty(name: string) {
        if (!decisionId) return;
        try {
            const { data, error } = await supabase
                .from('affected_parties')
                .insert({
                    decision_id: decisionId,
                    name: name
                })
                .select()
                .single();

            if (error) throw error;
            setParties([...parties, data]);
            return data;
        } catch (e) {
            throw e;
        }
    }

    async function removeParty(partyId: string) {
        try {
            const { error } = await supabase
                .from('affected_parties')
                .delete()
                .eq('id', partyId);

            if (error) throw error;
            setParties(parties.filter(p => p.id !== partyId));
        } catch (e) {
            throw e;
        }
    }

    return {
        parties,
        loading,
        error,
        addParty,
        removeParty,
        refresh: fetchParties
    };
}
