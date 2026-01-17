import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface ConsultationMember {
    id: string;
    decision_id: string;
    user_id?: string | null;
    name: string;
    email: string;
    created_at: string;
}


export function useConsultation(decisionId: string | undefined) {
    const { user } = useAuth();
    const [members, setMembers] = useState<ConsultationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (decisionId && user?.organization_id) {
            fetchMembers();
        }
    }, [decisionId, user?.organization_id]);

    async function fetchMembers() {
        if (!decisionId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stakeholders') // Keeping table name for now
                .select('*')
                .eq('decision_id', decisionId);

            if (error) throw error;
            setMembers(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function addMember(userId: string | undefined, name: string, email: string) {

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
            setMembers([...members, data]);
            return data;
        } catch (e) {
            throw e;
        }
    }

    async function removeMember(memberId: string) {
        try {
            const { error } = await supabase
                .from('stakeholders')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            setMembers(members.filter(m => m.id !== memberId));
        } catch (e) {
            throw e;
        }
    }

    return {
        members,
        loading,
        error,
        addMember,
        removeMember,
        refresh: fetchMembers
    };
}
