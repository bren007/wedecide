import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AffectedParty {
    id: string;
    decision_id: string;
    name: string;
    created_at: string;
}

export interface Decision {
    id: string;
    title: string;
    decision: string | null;
    description: string | null;
    status: 'draft' | 'active' | 'completed';
    decision_type: 'approve' | 'note' | null;
    owner_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
    agenda_item_id?: string | null;
    // Relations
    stakeholders?: any[];
    documents?: any[];
    affected_parties?: any[];
}


export function useDecisions() {
    const { user } = useAuth();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (user?.organization_id) {
            fetchDecisions();
        }
    }, [user?.organization_id]);

    async function fetchDecisions() {
        try {
            if (!user?.organization_id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('organization_id', user?.organization_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDecisions(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function createDecision(data: { title: string; decision?: string; description?: string; decision_type?: 'approve' | 'note' | null }) {
        try {
            if (!user?.organization_id) throw new Error('No organization found');

            const { data: decision, error } = await supabase
                .from('decisions')
                .insert({
                    title: data.title,
                    decision: data.decision,
                    description: data.description,
                    decision_type: data.decision_type || 'approve',
                    organization_id: user.organization_id,
                    owner_id: user.id,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;
            setDecisions([decision, ...decisions]);
            return decision;
        } catch (e) {
            throw e;
        }
    }

    async function getDecision(id: string) {
        if (!user?.organization_id) return null;

        const { data, error } = await supabase
            .from('decisions')
            .select(`
                *,
                stakeholders (*),
                documents (*),
                affected_parties (*)
            `)
            .eq('id', id)
            .eq('organization_id', user.organization_id)
            .single();

        if (error) throw error;
        return data;
    }


    async function updateDecision(id: string, updates: Partial<Decision>) {
        const { data, error } = await supabase
            .from('decisions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update local state if the decision is in the list
        setDecisions(decisions.map(d => d.id === id ? data : d));
        return data as Decision;
    }

    async function deleteDecision(id: string) {
        if (!user?.organization_id) return;

        const { error } = await supabase
            .from('decisions')
            .delete()
            .eq('id', id)
            .eq('organization_id', user.organization_id);

        if (error) throw error;

        // Remove from local state
        setDecisions(decisions.filter(d => d.id !== id));
    }

    return {
        decisions,
        loading,
        error,
        createDecision,
        getDecision,
        updateDecision,
        deleteDecision,
        refresh: fetchDecisions
    };
}
