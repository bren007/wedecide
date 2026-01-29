import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DECISION_CACHE_KEY = 'wedecide_decisions_cache_v1';

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
    status: 'draft' | 'submitted' | 'active' | 'completed' | 'rejected';
    decision_type: 'approve' | 'note' | null;
    reversibility_type: 'type1_irreversible' | 'type2_reversible' | null;
    owner_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
    agenda_item_id?: string | null;
    // Relations
    stakeholders?: any[];
    documents?: any[];
    affected_parties?: any[];
    feedback?: any[];
    owner?: {
        name: string;
        email: string;
    };
}


export function useDecisions() {
    const { user } = useAuth();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const fetchRef = useRef<Promise<void> | null>(null);

    // 1. Instant Boot: Load from cache on initialization
    useEffect(() => {
        if (user?.id) {
            const cached = localStorage.getItem(`${DECISION_CACHE_KEY}_${user.id}`);
            if (cached) {
                console.log('⚡ [useDecisions] Instant Boot: Loaded decisions from cache');
                setDecisions(JSON.parse(cached));
                setLoading(false); // Can stop loading if we have cache, or keep it true for background fetch
            }
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.organization_id) {
            fetchDecisions();
        }
    }, [user?.organization_id]);

    // Helper to update cache
    const updateCache = (newData: Decision[]) => {
        if (user?.id) {
            localStorage.setItem(`${DECISION_CACHE_KEY}_${user.id}`, JSON.stringify(newData));
        }
    };

    async function fetchDecisions() {
        const timerLabel = `📡 [fetchDecisions] ${Date.now()}`;

        // Deduplication: prevent concurrent identical fetches
        if (fetchRef.current) {
            console.log('🔗 [fetchDecisions] Sharing existing fetch promise');
            return fetchRef.current;
        }

        const fetchPromise = (async () => {
            try {
                if (!user?.organization_id) {
                    console.log('⏭️ [fetchDecisions] Skipping - no organization_id');
                    return;
                }

                // Only show loading if we haven't already populated from cache
                if (decisions.length === 0) {
                    setLoading(true);
                }

                console.time(timerLabel);

                // Add a timeout to the query - increased to 5s for reliability
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('fetchDecisions timeout')), 5000)
                );

                const query = supabase
                    .from('decisions')
                    .select('*, owner:users(name, email)') // Correctly join with users table
                    .eq('organization_id', user.organization_id)
                    .order('created_at', { ascending: false });

                const { data, error } = await Promise.race([
                    query as any,
                    timeoutPromise as any
                ]);

                if (error) throw error;

                console.timeEnd(timerLabel);
                console.log(`✅ [fetchDecisions] Success: Loaded ${data?.length || 0} decisions`);

                setDecisions(data || []);
                updateCache(data || []);

            } catch (e: any) {
                console.timeEnd(timerLabel);
                if (e.message?.includes('timeout')) {
                    console.warn('📡 [fetchDecisions] Background refresh timed out (Expected during flaky network)');
                } else {
                    console.error('❌ [fetchDecisions] Failed:', e);
                }
                setError(e as Error);
            } finally {
                setLoading(false);
                fetchRef.current = null;
            }
        })();

        fetchRef.current = fetchPromise;
        return fetchPromise;
    }

    async function createDecision(data: {
        title: string;
        decision?: string;
        description?: string;
        decision_type?: 'approve' | 'note' | null;
        reversibility_type?: 'type1_irreversible' | 'type2_reversible' | null;
    }) {
        try {
            if (!user?.organization_id) throw new Error('No organization found');

            const { data: decision, error } = await supabase
                .from('decisions')
                .insert({
                    title: data.title,
                    decision: data.decision,
                    description: data.description,
                    decision_type: data.decision_type || 'approve',
                    reversibility_type: data.reversibility_type || null,
                    organization_id: user.organization_id,
                    owner_id: user.id,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;
            setDecisions(prev => {
                const newList = [decision, ...prev];
                updateCache(newList);
                return newList;
            });
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
                affected_parties (*),
                feedback:decision_feedback (*)
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
        setDecisions(prev => {
            const newList = prev.map(d => d.id === id ? { ...d, ...data } : d);
            updateCache(newList);
            return newList;
        });
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
        setDecisions(prev => {
            const newList = prev.filter(d => d.id !== id);
            updateCache(newList);
            return newList;
        });
    }

    async function submitDecision(id: string) {
        return updateDecision(id, { status: 'submitted' });
    }

    async function approveDecision(id: string) {
        return updateDecision(id, { status: 'active' });
    }

    async function rejectDecision(id: string, feedback: string) {
        if (!user?.id) throw new Error('User not found');

        // 1. Create Feedback
        const { error: feedbackError } = await supabase
            .from('decision_feedback')
            .insert({
                decision_id: id,
                user_id: user.id,
                content: feedback
            });

        if (feedbackError) throw feedbackError;

        // 2. Update Status to Rejected
        return updateDecision(id, { status: 'rejected' });
    }

    return {
        decisions,
        loading,
        error,
        createDecision,
        getDecision,
        updateDecision,
        deleteDecision,
        submitDecision,
        approveDecision,
        rejectDecision,
        refresh: fetchDecisions
    };
}
