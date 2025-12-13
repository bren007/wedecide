import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Document {
    id: string;
    decision_id: string;
    name: string;
    type: string;
    url: string;
    uploaded_by: string;
    created_at: string;
}

export function useDocuments(decisionId: string | undefined) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (decisionId && user?.organization_id) {
            fetchDocuments();
        }
    }, [decisionId, user?.organization_id]);

    async function fetchDocuments() {
        if (!decisionId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('decision_id', decisionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function addDocument(name: string, url: string, type: string) {
        if (!decisionId || !user?.organization_id) return;
        try {
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    decision_id: decisionId,
                    organization_id: user.organization_id,
                    uploaded_by: user.id,
                    name,
                    url,
                    type,
                    is_part_of_meeting_pack: false
                })
                .select()
                .single();

            if (error) throw error;
            setDocuments([data, ...documents]);
            return data;
        } catch (e) {
            throw e;
        }
    }

    async function deleteDocument(id: string) {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setDocuments(documents.filter(d => d.id !== id));
        } catch (e) {
            throw e;
        }
    }

    return {
        documents,
        loading,
        error,
        addDocument,
        deleteDocument,
        refresh: fetchDocuments
    };
}
