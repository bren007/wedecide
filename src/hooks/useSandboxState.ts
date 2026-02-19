import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Define types (Interfaces)
export interface CapacitySettings {
    total_focus_slots: number;
    total_capex_limit: number;
    total_opex_limit: number;
}

export interface Initiative {
    id: string;
    focus_slots: number;
    capex_required: number;
    opex_required: number;
    title: string;
    status: 'proposed' | 'approved' | 'active' | 'paused' | 'archived' | 'completed';
    strategic_pillar_id?: string;
    short_term_win?: boolean;
}

// SandboxState removed as it is unused

// Hook
export function useSandboxState() {
    const [settings, setSettings] = useState<CapacitySettings | null>(null);
    // dbInitiatives: Source of truth from DB
    const [dbInitiatives, setDbInitiatives] = useState<Initiative[]>([]);
    // localInitiatives: The simulation state
    const [localInitiatives, setLocalInitiatives] = useState<Initiative[]>([]);
    // pillarsMap: ID -> Title
    const [pillarsMap, setPillarsMap] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('capacity_settings' as any)
                .select('*')
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
            setSettings(settingsData as unknown as CapacitySettings);

            // Fetch Initiatives (all relevant statuses)
            const { data: initiativesData, error: initiativesError } = await supabase
                .from('initiatives' as any)
                .select('*')
                .in('status', ['approved', 'active', 'proposed', 'paused']);

            if (initiativesError) throw initiativesError;

            // Fetch Pillars
            const { data: pillarsData, error: pillarsError } = await supabase
                .from('strategic_pillars' as any)
                .select('id, title');

            if (pillarsError) {
                console.warn('Error fetching pillars (might be none yet):', pillarsError);
            } else {
                const pMap: Record<string, string> = {};
                (pillarsData as any[] || []).forEach(p => pMap[p.id] = p.title);
                setPillarsMap(pMap);
            }

            const inits = (initiativesData as unknown as Initiative[]) || [];
            setDbInitiatives(inits);
            setLocalInitiatives(inits); // Reset simulation to DB state

        } catch (err: any) {
            console.error('Error fetching sandbox state:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Simulation Logic
    const moveInitiative = (id: string, newStatus: Initiative['status']) => {
        setLocalInitiatives(prev => prev.map(init =>
            init.id === id ? { ...init, status: newStatus } : init
        ));
    };

    const hasChanges = JSON.stringify(dbInitiatives) !== JSON.stringify(localInitiatives);

    const commitChanges = async () => {
        setSaving(true);
        try {
            // Find changed initiatives
            const changes = localInitiatives.filter(local => {
                const original = dbInitiatives.find(db => db.id === local.id);
                return original && original.status !== local.status;
            });

            if (changes.length === 0) return;

            // Update each changed initiative
            for (const item of changes) {
                const { error } = await supabase
                    .from('initiatives' as any)
                    .update({ status: item.status })
                    .eq('id', item.id);
                if (error) throw error;
            }

            // Refresh data from DB to confirm and reset
            await fetchData();
        } catch (err: any) {
            console.error('Error committing changes:', err);
            setError('Failed to commit changes.');
        } finally {
            setSaving(false);
        }
    };

    // Calculation Logic
    const calculateLoad = () => {
        if (!settings) return {
            currentFocusLoad: 0,
            currentCapexLoad: 0,
            currentOpexLoad: 0,
            focusLimit: 0,
            capexLimit: 0,
            opexLimit: 0,
            isOverFocus: false,
            isOverCapex: false,
            isOverOpex: false,
        };

        // Only count 'active' or 'approved' items towards load. 
        // 'proposed' and 'paused' are zero load.
        // The User said: "The 'Proposed' Gate: ... They consume zero capacity"
        const activeItems = localInitiatives.filter(i => ['active', 'approved'].includes(i.status));

        const currentFocusLoad = activeItems.reduce((sum, init) => sum + (init.focus_slots || 0), 0);
        const currentCapexLoad = activeItems.reduce((sum, init) => sum + (Number(init.capex_required) || 0), 0);
        const currentOpexLoad = activeItems.reduce((sum, init) => sum + (Number(init.opex_required) || 0), 0);

        return {
            currentFocusLoad,
            currentCapexLoad,
            currentOpexLoad,
            focusLimit: settings.total_focus_slots,
            capexLimit: Number(settings.total_capex_limit),
            opexLimit: Number(settings.total_opex_limit),
            isOverFocus: currentFocusLoad > settings.total_focus_slots,
            isOverCapex: currentCapexLoad > settings.total_capex_limit,
            isOverOpex: currentOpexLoad > settings.total_opex_limit,
        };
    };

    return {
        ...calculateLoad(),
        initiatives: localInitiatives, // Return the SIMULATED list
        pillarsMap, // Return the pillars map
        loading,
        error,
        saving,
        hasChanges,
        moveInitiative,
        commitChanges,
        refresh: fetchData,
        isAdmin: true // Mocking admin capability for now
    };
}
