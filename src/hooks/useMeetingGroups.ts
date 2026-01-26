import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface MeetingGroup {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export function useMeetingGroups() {
    const { user } = useAuth();
    const [meetingGroups, setMeetingGroups] = useState<MeetingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (user?.organization_id) {
            fetchMeetingGroups();
        }
    }, [user?.organization_id]);

    async function fetchMeetingGroups() {
        try {
            if (!user?.organization_id) {
                console.log('⏭️ [fetchMeetingGroups] Skipping - no organization_id');
                return;
            }

            setLoading(true);

            const { data, error } = await supabase
                .from('meeting_groups')
                .select('*')
                .eq('organization_id', user.organization_id)
                .order('name', { ascending: true });

            if (error) throw error;

            console.log(`✅ [fetchMeetingGroups] Loaded ${data?.length || 0} meeting groups`);
            setMeetingGroups(data || []);

        } catch (e: any) {
            console.error('❌ [fetchMeetingGroups] Failed:', e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    async function createMeetingGroup(data: { name: string; description?: string }) {
        try {
            if (!user?.organization_id) throw new Error('No organization found');

            const { data: meetingGroup, error } = await supabase
                .from('meeting_groups')
                .insert({
                    name: data.name,
                    description: data.description || null,
                    organization_id: user.organization_id
                })
                .select()
                .single();

            if (error) throw error;

            setMeetingGroups(prev => [...prev, meetingGroup].sort((a, b) => a.name.localeCompare(b.name)));
            return meetingGroup;
        } catch (e) {
            throw e;
        }
    }

    async function updateMeetingGroup(id: string, updates: Partial<MeetingGroup>) {
        const { data, error } = await supabase
            .from('meeting_groups')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        setMeetingGroups(prev =>
            prev.map(mg => mg.id === id ? { ...mg, ...data } : mg)
                .sort((a, b) => a.name.localeCompare(b.name))
        );
        return data as MeetingGroup;
    }

    async function deleteMeetingGroup(id: string) {
        if (!user?.organization_id) return;

        const { error } = await supabase
            .from('meeting_groups')
            .delete()
            .eq('id', id)
            .eq('organization_id', user.organization_id);

        if (error) throw error;

        setMeetingGroups(prev => prev.filter(mg => mg.id !== id));
    }

    return {
        meetingGroups,
        loading,
        error,
        createMeetingGroup,
        updateMeetingGroup,
        deleteMeetingGroup,
        refresh: fetchMeetingGroups
    };
}
