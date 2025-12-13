import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Stakeholder {
    id: string;
    decision_id: string;
    user_id: string;
    name: string;
    email: string;
    created_at: string;
}

export function useStakeholders(decisionId: string | undefined) {
    const { user } = useAuth();
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (decisionId && user?.organization_id) {
            fetchStakeholders();
        }
    }, [decisionId, user?.organization_id]);

    async function fetchStakeholders() {
        if (!decisionId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stakeholders')
                .select('*')
                .eq('decision_id', decisionId);

            if (error) throw error;
            setStakeholders(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function addStakeholder(userId: string, name: string, email: string) {
        if (!decisionId) return;
        try {
            const { data, error } = await supabase
                .from('stakeholders')
                .insert({
                    decision_id: decisionId,
                    user_id: userId,
                    name: name,
                    email: email
                })
                .select()
                .single();

            if (error) throw error;
            setStakeholders([...stakeholders, data]);
            return data;
        } catch (e) {
            throw e;
        }
    }

    async function removeStakeholder(stakeholderId: string) {
        try {
            const { error } = await supabase
                .from('stakeholders')
                .delete()
                .eq('id', stakeholderId);

            if (error) throw error;
            setStakeholders(stakeholders.filter(s => s.id !== stakeholderId));
        } catch (e) {
            throw e;
        }
    }

    return {
        stakeholders,
        loading,
        error,
        addStakeholder,
        removeStakeholder,
        refresh: fetchStakeholders
    };
}
