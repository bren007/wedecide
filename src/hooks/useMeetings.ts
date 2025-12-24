import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AgendaItem {
    id: string;
    meeting_id: string;
    title: string;
    description: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
    decision?: any; // To include linked decision
}

export interface Meeting {
    id: string;
    organization_id: string;
    title: string;
    description: string | null;
    scheduled_at: string;
    location: string | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    agenda_items?: AgendaItem[];
}

export function useMeetings() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (user?.organization_id) {
            fetchMeetings();
        }
    }, [user?.organization_id]);

    async function fetchMeetings() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('organization_id', user?.organization_id)
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setMeetings(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function getMeeting(id: string) {
        if (!user?.organization_id) return null;

        const { data, error } = await supabase
            .from('meetings')
            .select(`
                *,
                agenda_items (*)
            `)
            .eq('id', id)
            .eq('organization_id', user.organization_id)
            .single();

        if (error) throw error;

        // If agenda items exist, fetch decisions linked to them
        if (data.agenda_items && data.agenda_items.length > 0) {
            const agendaItemIds = data.agenda_items.map((i: any) => i.id);
            const { data: decisions, error: decisionsError } = await supabase
                .from('decisions')
                .select('*')
                .in('agenda_item_id', agendaItemIds);

            if (!decisionsError && decisions) {
                data.agenda_items = data.agenda_items.map((item: any) => ({
                    ...item,
                    decision: decisions.find(d => d.agenda_item_id === item.id)
                })).sort((a: any, b: any) => a.order_index - b.order_index);
            }
        }

        return data as Meeting;
    }

    async function createMeeting(data: { title: string; scheduled_at: string; description?: string; location?: string }) {
        if (!user?.organization_id) throw new Error('No organization found');

        const { data: meeting, error } = await supabase
            .from('meetings')
            .insert({
                ...data,
                organization_id: user.organization_id,
                status: 'scheduled'
            })
            .select()
            .single();

        if (error) throw error;
        setMeetings(prev => [...prev, meeting].sort((a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        ));
        return meeting;
    }

    async function updateMeeting(id: string, updates: Partial<Meeting>) {
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        setMeetings(meetings.map(m => m.id === id ? data : m));
        return data;
    }

    async function deleteMeeting(id: string) {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) throw error;
        setMeetings(meetings.filter(m => m.id !== id));
    }

    async function createAgendaItem(meetingId: string, item: { title: string; description?: string; order_index?: number }) {
        const { data, error } = await supabase
            .from('agenda_items')
            .insert({
                ...item,
                meeting_id: meetingId,
                order_index: item.order_index || 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function updateAgendaItem(id: string, updates: Partial<AgendaItem>) {
        const { data, error } = await supabase
            .from('agenda_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function deleteAgendaItem(id: string) {
        const { error } = await supabase
            .from('agenda_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async function linkDecisionToAgendaItem(decisionId: string, agendaItemId: string | null) {
        const { data, error } = await supabase
            .from('decisions')
            .update({ agenda_item_id: agendaItemId })
            .eq('id', decisionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    return {
        meetings,
        loading,
        error,
        fetchMeetings,
        getMeeting,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        createAgendaItem,
        updateAgendaItem,
        deleteAgendaItem,
        linkDecisionToAgendaItem,
        refresh: fetchMeetings
    };
}
