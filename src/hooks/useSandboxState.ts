import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Define types (Interfaces)
export interface CapacitySettings {
    total_focus_slots: number;
    total_capex_limit: number;
    total_opex_limit: number;
    fiscal_drag_threshold?: number | null;
}

export interface Initiative {
    id: string;
    focus_slots: number;
    capex_current_fy: number;
    opex_current_fy: number;
    total_initiative_cost: number;
    is_multi_year: boolean;
    future_annual_opex: number;
    title: string;
    status: 'proposed' | 'approved' | 'active' | 'paused' | 'archived' | 'completed';
    strategic_pillar_id?: string;
    short_term_win?: boolean;
    approval_mandate?: 'Cabinet Approved' | 'Ministerial Approved' | 'Board/Delegated' | 'Pre-Approval';
    relative_priority?: 'Tier 1' | 'Tier 2' | 'Tier 3';
    target_delivery_quarter?: string;
    current_fy_budget?: number;
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
                .maybeSingle();

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

    const commitChanges = async (rationale?: string) => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Find changed initiatives
            const changes = localInitiatives
                .map(local => {
                    const original = dbInitiatives.find(db => db.id === local.id);
                    if (!original || original.status === local.status) return null;
                    return { local, original };
                })
                .filter(Boolean) as { local: Initiative, original: Initiative }[];

            if (changes.length === 0) return;

            // Process updates and ledger entries
            for (const { local, original } of changes) {
                // 1. Update Initiative Status
                const { error: updateError } = await supabase
                    .from('initiatives' as any)
                    .update({ status: local.status })
                    .eq('id', local.id);

                if (updateError) throw updateError;

                // 2. Determine Action Type
                let actionType = 'update';
                if (original.status === 'proposed' && local.status === 'active') actionType = 'approve';
                else if (original.status === 'active' && local.status === 'paused') actionType = 'pause';
                else if (original.status === 'paused' && local.status === 'active') actionType = 'resume';

                // 3. Log to Strategic Ledger
                if (user) {
                    let finalRationale = rationale || `Changed status from ${original.status} to ${local.status}`;

                    // Automated Audit Note if activated with Future OPEX
                    if (actionType === 'approve' || actionType === 'resume') {
                        if (local.future_annual_opex > 0) {
                            finalRationale += `\n[Future Commitment Warning: Adds $${local.future_annual_opex}/yr to OPEX]`;
                        }
                    }

                    const { error: ledgerError } = await supabase
                        .from('strategic_ledger' as any)
                        .insert({
                            org_id: (await supabase.from('users').select('organization_id').eq('id', user.id).single()).data?.organization_id, // Fetch org_id fresh
                            initiative_id: local.id,
                            chair_id: user.id,
                            action_type: actionType,
                            rationale: finalRationale,
                            replaced_ids: [] // Future: Explicit swap logic
                        });

                    if (ledgerError) console.warn('Ledger logging failed:', ledgerError);
                }
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
            currentFutureOpexLoad: 0,
            focusLimit: 0,
            capexLimit: 0,
            opexLimit: 0,
            isOverFocus: false,
            isOverCapex: false,
            isOverOpex: false,
            fiscalDrag: 0,
            fiscalDragThreshold: null as number | null,
            isOverFiscalDrag: false,
        };

        // Only count 'active' or 'approved' items towards load. 
        // 'proposed' and 'paused' are zero load.
        // The User said: "The 'Proposed' Gate: ... They consume zero capacity"
        const activeItems = localInitiatives.filter(i => ['active', 'approved'].includes(i.status));

        // Group Focus Load by Quarter
        const defaultQuarters = ['Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'];
        const quarterlyFocusLoad: Record<string, number> = {};
        let peakFocusLoad = 0;

        defaultQuarters.forEach(q => {
            const load = activeItems
                .filter(i => (i.target_delivery_quarter || 'Q1 FY26') === q)
                .reduce((sum, init) => sum + (init.focus_slots || 0), 0);

            quarterlyFocusLoad[q] = load;
            if (load > peakFocusLoad) peakFocusLoad = load;
        });

        const currentFocusLoad = peakFocusLoad; // Header Gauge measures the Peak Quarter

        const currentCapexLoad = activeItems.reduce((sum, init) => sum + (Number(init.capex_current_fy) || 0), 0);
        const currentOpexLoad = activeItems.reduce((sum, init) => sum + (Number(init.opex_current_fy) || 0), 0);
        const currentFutureOpexLoad = activeItems.reduce((sum, init) => sum + (Number(init.future_annual_opex) || 0), 0);

        // Fiscal Drag: sum of current_fy_budget for Tier 2/3 active initiatives
        const fiscalDrag = activeItems
            .filter(i => i.relative_priority === 'Tier 2' || i.relative_priority === 'Tier 3')
            .reduce((sum, i) => sum + (Number(i.current_fy_budget) || 0), 0);
        const fiscalDragThreshold = settings.fiscal_drag_threshold != null ? Number(settings.fiscal_drag_threshold) : null;
        const isOverFiscalDrag = fiscalDragThreshold != null && fiscalDrag > fiscalDragThreshold;

        return {
            currentFocusLoad,
            currentCapexLoad,
            currentOpexLoad,
            currentFutureOpexLoad,
            focusLimit: settings.total_focus_slots,
            capexLimit: Number(settings.total_capex_limit),
            opexLimit: Number(settings.total_opex_limit),
            isOverFocus: currentFocusLoad > settings.total_focus_slots,
            isOverCapex: currentCapexLoad > settings.total_capex_limit,
            isOverOpex: currentOpexLoad > settings.total_opex_limit,
            fiscalDrag,
            fiscalDragThreshold,
            isOverFiscalDrag,
            quarterlyFocusLoad,
        };
    };

    // Quarter mutation for drag-and-drop sequencing
    const updateInitiativeQuarter = (id: string, newQuarter: string) => {
        setLocalInitiatives(prev => prev.map(init =>
            init.id === id ? { ...init, target_delivery_quarter: newQuarter } : init
        ));
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
        updateInitiativeQuarter,
        commitChanges,
        refresh: fetchData,
        isAdmin: true // Mocking admin capability for now
    };
}
