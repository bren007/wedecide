
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Meeting {
    id: string;
    organization_id: string;
    title: string;
    started_at: string | null;
    ended_at: string | null;
}

export const useMeetingState = () => {
    const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for active meeting on mount
    const fetchActiveMeeting = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            // Not authenticated yet — expected during auth boot, return silently
            if (!user) {
                setCurrentMeeting(null);
                return;
            }

            // Get org_id (helper func or query)
            // Simplified: fetch user's org
            const { data: userData } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
            const orgId = userData?.organization_id;

            if (!orgId) throw new Error("No Organization");

            // Find meeting that started but not ended
            const { data } = await supabase
                .from('meetings')
                .select('*')
                .eq('organization_id', orgId)
                .not('started_at', 'is', null)
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setCurrentMeeting(data as unknown as Meeting);
            } else {
                setCurrentMeeting(null);
            }
        } catch (err) {
            const errorObj = err as { code?: string; message?: string };
            // PGRST116 means no rows, which is fine
            if (errorObj.code !== 'PGRST116') {
                console.error("Error fetching meeting:", err);
            }
            setCurrentMeeting(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveMeeting();
    }, [fetchActiveMeeting]);

    const startMeeting = async (title: string = "Ad-hoc Strategic Session") => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { data: userData } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
            const orgId = userData?.organization_id;
            if (!orgId) throw new Error("No Organization");

            // 1. Capture Snapshot (Initiatives + Capacity)
            const { data: initiatives } = await supabase.from('initiatives').select('*').eq('org_id', orgId);
            const { data: capacity } = await supabase.from('capacity_settings').select('*').eq('org_id', orgId).single();

            // 2. Create Meeting
            const { data: meeting, error: startError } = await supabase.from('meetings').insert({
                organization_id: orgId,
                title,
                status: 'in_progress' as const,
                started_at: new Date().toISOString(),
                snapshot_start: { initiatives, capacity }
            }).select().single();

            if (startError) throw startError;
            setCurrentMeeting(meeting as unknown as Meeting);
            return meeting;

        } catch (err) {
            const errorObj = err as Error;
            console.error("Start Meeting Failed:", errorObj);
            setError(errorObj.message);
        } finally {
            setLoading(false);
        }
    };

    const endMeeting = async () => {
        if (!currentMeeting) return;
        setLoading(true);
        try {
            // 1. Capture Final Snapshot
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");
            const { data: userData } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
            const orgId = userData?.organization_id;
            if (!orgId) throw new Error("No Organization");

            const { data: initiatives } = await supabase.from('initiatives').select('*').eq('org_id', orgId);
            const { data: capacity } = await supabase.from('capacity_settings').select('*').eq('org_id', orgId).single();

            // 2. Update Meeting
            const { error: endError } = await supabase.from('meetings').update({
                ended_at: new Date().toISOString(),
                status: 'completed',
                snapshot_end: { initiatives, capacity }
            }).eq('id', currentMeeting.id);

            if (endError) throw endError;
            setCurrentMeeting(null);

        } catch (err) {
            const errorObj = err as Error;
            console.error("End Meeting Failed:", errorObj);
            setError(errorObj.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        currentMeeting,
        loading,
        error,
        startMeeting,
        endMeeting,
        refreshMeeting: fetchActiveMeeting
    };
};
