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
    complexity_stakeholder?: number;
    complexity_tech?: number;
    complexity_dependency?: number;
    dependency_count?: number;
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

            const rawInits = (initiativesData as any[]) || [];
            const inits: Initiative[] = rawInits.map(raw => ({
                ...raw,
                // Primary mapping: Use DB names (required) for frontend display (current_fy)
                capex_current_fy: Number(raw.capex_required ?? 0),
                opex_current_fy: Number(raw.opex_required ?? 0),
                total_initiative_cost: Number(raw.total_initiative_cost ?? 0),
                is_multi_year: Boolean(raw.is_multi_year),
                future_annual_opex: Number(raw.future_annual_opex ?? 0),
                current_fy_budget: Number(raw.current_fy_budget ?? 0),
            }));
            
            setDbInitiatives(inits);
            setLocalInitiatives(inits); 

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
                    if (!original) return null;
                    const statusChanged = original.status !== local.status;
                    const quarterChanged = original.target_delivery_quarter !== local.target_delivery_quarter;
                    if (!statusChanged && !quarterChanged) return null;
                    return { local, original, statusChanged, quarterChanged };
                })
                .filter(Boolean) as { local: Initiative, original: Initiative, statusChanged: boolean, quarterChanged: boolean }[];

            if (changes.length === 0) return;

            // Process updates and ledger entries
            for (const { local, original, statusChanged, quarterChanged } of changes) {
                // 1. Update Initiative Status and Quarter
                const { error: updateError } = await supabase
                    .from('initiatives' as any)
                    .update({
                        status: local.status,
                        target_delivery_quarter: local.target_delivery_quarter
                    })
                    .eq('id', local.id);

                if (updateError) throw updateError;

                // 2. Determine Action Type
                let actionType = 'update';
                if (statusChanged) {
                    if (original.status === 'proposed' && local.status === 'active') actionType = 'approve';
                    else if (original.status === 'active' && local.status === 'paused') actionType = 'pause';
                    else if (original.status === 'paused' && local.status === 'active') actionType = 'resume';
                } else if (quarterChanged) {
                    actionType = 'resequence';
                }

                // 3. Log to Strategic Ledger
                if (user) {
                    let finalRationale = rationale || '';
                    if (!finalRationale) {
                        if (statusChanged && quarterChanged) {
                            finalRationale = `Changed status from ${original.status} to ${local.status} and sequenced to ${local.target_delivery_quarter}`;
                        } else if (statusChanged) {
                            finalRationale = `Changed status from ${original.status} to ${local.status}`;
                        } else if (quarterChanged) {
                            finalRationale = `Sequenced to ${local.target_delivery_quarter}`;
                        }
                    }

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

    // Direct detail updates (no commit required)
    const updateInitiativeDetails = async (id: string, updates: Partial<Initiative>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const original = dbInitiatives.find(init => init.id === id);

            if (original) {
                // Determine if complexity changed and recalculate focus_slots
                const newStakeholder = updates.complexity_stakeholder ?? (original as any).complexity_stakeholder ?? 0;
                const newTech = updates.complexity_tech ?? (original as any).complexity_tech ?? 0;
                const newDependency = updates.complexity_dependency ?? (original as any).complexity_dependency ?? 0;

                const score = newStakeholder + newTech + newDependency;
                const computedSlots = score <= 5 ? 1 : score <= 10 ? 3 : 5;

                if (computedSlots !== original.focus_slots) {
                    updates.focus_slots = computedSlots;
                }
            }

            const { error: updateError } = await supabase
                .from('initiatives' as any)
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            // Log to Strategic Ledger if there are meaningful changes
            if (user && original) {
                const { data: userData } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
                const orgId = userData?.organization_id;

                const changes = [];
                if (updates.title && updates.title !== original.title) changes.push(`Title changed`);
                if (updates.strategic_pillar_id !== undefined && updates.strategic_pillar_id !== original.strategic_pillar_id) changes.push(`Pillar reassigned`);
                if (updates.focus_slots && updates.focus_slots !== original.focus_slots) changes.push(`Capacity footprint recalculated to ${updates.focus_slots} Focus Slots due to complexity update`);
                if (updates.capex_current_fy !== undefined && updates.capex_current_fy !== original.capex_current_fy) changes.push(`CAPEX updated`);
                if (updates.opex_current_fy !== undefined && updates.opex_current_fy !== original.opex_current_fy) changes.push(`OPEX updated`);
                if (updates.target_delivery_quarter !== undefined && updates.target_delivery_quarter !== original.target_delivery_quarter) changes.push(`Sequenced to ${updates.target_delivery_quarter}`);

                if (changes.length > 0) {
                    const { error: ledgerError } = await supabase.from('strategic_ledger' as any).insert({
                        org_id: orgId,
                        initiative_id: id,
                        chair_id: user.id,
                        action_type: 'update',
                        rationale: `Metadata updated: ${changes.join(', ')}`,
                        replaced_ids: []
                    });
                    if (ledgerError) console.error("Failed to write to ledger:", ledgerError);
                }
            }

            // Update both states so it doesn't trigger 'hasChanges'
            setDbInitiatives(prev => prev.map(init => init.id === id ? { ...init, ...updates } : init));
            setLocalInitiatives(prev => prev.map(init => init.id === id ? { ...init, ...updates } : init));
        } catch (err: any) {
            console.error('Failed to update initiative details:', err);
            throw err;
        }
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
        updateInitiativeDetails,
        commitChanges,
        refresh: fetchData,
        isAdmin: true // Mocking admin capability for now
    };
}
