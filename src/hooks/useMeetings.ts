import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AgendaItem {
    id: string;
    meeting_id: string;
    title: string;
    description: string | null;
    notes: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
    decision?: any; // To include linked decision
}

export interface MeetingAttendee {
    id: string;
    meeting_id: string;
    user_id: string;
    status: 'invited' | 'accepted' | 'declined' | 'present' | 'absent';
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
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
    attendees?: MeetingAttendee[];
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
            if (!user?.organization_id) return;
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
                agenda_items (*),
                attendees:meeting_attendees (
                    *,
                    user:users (id, name, email)
                )
            `)
            .eq('id', id)
            .eq('organization_id', user.organization_id)
            .single();

        if (error) throw error;

        if (data.agenda_items && data.agenda_items.length > 0) {
            // ... (rest of logic)
        }

        return data as unknown as Meeting;
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

    async function reorderAgendaItem(items: AgendaItem[], itemId: string, direction: 'up' | 'down') {
        const currentIndex = items.findIndex(i => i.id === itemId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const currentItem = items[currentIndex];
        const targetItem = items[targetIndex];

        // Swap order_index locally optimization? 
        // Best approach: Swap their order_index in DB.

        // We assume items are sorted by order_index.
        // We just swap the order_index values.

        const updates = [
            { id: currentItem.id, order_index: targetItem.order_index },
            { id: targetItem.id, order_index: currentItem.order_index }
        ];

        for (const update of updates) {
            const { error } = await supabase
                .from('agenda_items')
                .update({ order_index: update.order_index })
                .eq('id', update.id);
            if (error) throw error;
        }

        // Optimistic update or refresh handled by caller
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

    async function inviteAttendee(meetingId: string, userId: string) {
        // @ts-ignore
        const { data, error } = await supabase
            .from('meeting_attendees')
            .insert({
                meeting_id: meetingId,
                user_id: userId,
                status: 'invited'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function removeAttendee(meetingId: string, userId: string) {
        // @ts-ignore
        const { error } = await supabase
            .from('meeting_attendees')
            .delete()
            .eq('meeting_id', meetingId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async function updateAttendeeStatus(meetingId: string, userId: string, status: string) {
        // @ts-ignore
        const { data, error } = await supabase
            .from('meeting_attendees')
            .update({ status })
            .eq('meeting_id', meetingId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function getOrgUsers() {
        if (!user?.organization_id) return [];
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('organization_id', user.organization_id);

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
        reorderAgendaItem,
        linkDecisionToAgendaItem,
        inviteAttendee,
        removeAttendee,
        updateAttendeeStatus,
        getOrgUsers,
        refresh: fetchMeetings
    };
}
