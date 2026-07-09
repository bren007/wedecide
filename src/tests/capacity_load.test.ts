/**
 * Capacity Load Calculation Tests
 * 
 * Tests the core business logic from useSandboxState:
 * - Focus load aggregation
 * - CAPEX/OPEX budget calculations
 * - Over-capacity detection
 * - Status filtering (only 'active'/'approved' count towards load)
 */
import { describe, it, expect } from 'vitest';

// ===== EXTRACTED TYPES & LOGIC FROM useSandboxState.ts =====

interface CapacitySettings {
    total_focus_slots: number;
    total_capex_limit: number;
    total_opex_limit: number;
}

interface Initiative {
    id: string;
    title: string;
    status: 'proposed' | 'approved' | 'active' | 'paused' | 'archived' | 'completed';
    focus_slots: number;
    capex_current_fy: number;
    opex_current_fy: number;
    future_annual_opex: number;
    total_initiative_cost: number;
    is_multi_year: boolean;
}

function calculateLoad(settings: CapacitySettings | null, initiatives: Initiative[]) {
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
    };

    // Only count 'active' or 'approved' items towards load
    const activeItems = initiatives.filter(i => ['active', 'approved'].includes(i.status));

    const currentFocusLoad = activeItems.reduce((sum, init) => sum + (init.focus_slots || 0), 0);
    const currentCapexLoad = activeItems.reduce((sum, init) => sum + (Number(init.capex_current_fy) || 0), 0);
    const currentOpexLoad = activeItems.reduce((sum, init) => sum + (Number(init.opex_current_fy) || 0), 0);
    const currentFutureOpexLoad = activeItems.reduce((sum, init) => sum + (Number(init.future_annual_opex) || 0), 0);

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
    };
}

// ===== HELPER =====

function makeInitiative(overrides: Partial<Initiative>): Initiative {
    return {
        id: `init-${Math.random().toString(36).substring(7)}`,
        title: 'Test Initiative',
        status: 'active',
        focus_slots: 1,
        capex_current_fy: 100000,
        opex_current_fy: 50000,
        future_annual_opex: 20000,
        total_initiative_cost: 170000,
        is_multi_year: false,
        ...overrides,
    };
}

const DEFAULT_SETTINGS: CapacitySettings = {
    total_focus_slots: 10,
    total_capex_limit: 500000,
    total_opex_limit: 200000,
};

// ===== TESTS =====

describe('Capacity Load Calculation (Command Center)', () => {

    describe('Basic Aggregation', () => {
        it('should return zero load with no initiatives', () => {
            const result = calculateLoad(DEFAULT_SETTINGS, []);
            expect(result.currentFocusLoad).toBe(0);
            expect(result.currentCapexLoad).toBe(0);
            expect(result.currentOpexLoad).toBe(0);
        });

        it('should sum focus slots from active initiatives', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 3, status: 'active' }),
                makeInitiative({ focus_slots: 2, status: 'active' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(5);
        });

        it('should sum CAPEX from active initiatives', () => {
            const initiatives = [
                makeInitiative({ capex_current_fy: 150000, status: 'active' }),
                makeInitiative({ capex_current_fy: 200000, status: 'active' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentCapexLoad).toBe(350000);
        });

        it('should sum OPEX from active initiatives', () => {
            const initiatives = [
                makeInitiative({ opex_current_fy: 30000, status: 'active' }),
                makeInitiative({ opex_current_fy: 70000, status: 'approved' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentOpexLoad).toBe(100000);
        });

        it('should sum future OPEX from active initiatives', () => {
            const initiatives = [
                makeInitiative({ future_annual_opex: 15000, status: 'active', is_multi_year: true }),
                makeInitiative({ future_annual_opex: 25000, status: 'active', is_multi_year: true }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFutureOpexLoad).toBe(40000);
        });
    });

    describe('Status Filtering (The Physics of Focus)', () => {
        it('should NOT count proposed initiatives towards load', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 5, capex_current_fy: 300000, status: 'proposed' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(0);
            expect(result.currentCapexLoad).toBe(0);
        });

        it('should NOT count paused initiatives towards load', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 3, status: 'paused' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(0);
        });

        it('should NOT count archived initiatives towards load', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 4, status: 'archived' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(0);
        });

        it('should NOT count completed initiatives towards load', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 2, status: 'completed' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(0);
        });

        it('should count approved initiatives towards load', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 4, status: 'approved' }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(4);
        });

        it('should only count active+approved in mixed portfolio', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 2, status: 'active' }),
                makeInitiative({ focus_slots: 3, status: 'approved' }),
                makeInitiative({ focus_slots: 5, status: 'proposed' }), // should NOT count
                makeInitiative({ focus_slots: 1, status: 'paused' }),   // should NOT count
                makeInitiative({ focus_slots: 4, status: 'archived' }), // should NOT count
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(5); // 2 + 3
        });
    });

    describe('Over-Capacity Detection', () => {
        it('should flag isOverFocus when load exceeds limit', () => {
            const settings = { ...DEFAULT_SETTINGS, total_focus_slots: 3 };
            const initiatives = [
                makeInitiative({ focus_slots: 2, status: 'active' }),
                makeInitiative({ focus_slots: 2, status: 'active' }),
            ];
            const result = calculateLoad(settings, initiatives);
            expect(result.currentFocusLoad).toBe(4);
            expect(result.focusLimit).toBe(3);
            expect(result.isOverFocus).toBe(true);
        });

        it('should NOT flag isOverFocus when load equals limit', () => {
            const settings = { ...DEFAULT_SETTINGS, total_focus_slots: 4 };
            const initiatives = [
                makeInitiative({ focus_slots: 2, status: 'active' }),
                makeInitiative({ focus_slots: 2, status: 'active' }),
            ];
            const result = calculateLoad(settings, initiatives);
            expect(result.isOverFocus).toBe(false);
        });

        it('should flag isOverCapex correctly', () => {
            const settings = { ...DEFAULT_SETTINGS, total_capex_limit: 100000 };
            const initiatives = [
                makeInitiative({ capex_current_fy: 80000, status: 'active' }),
                makeInitiative({ capex_current_fy: 50000, status: 'active' }),
            ];
            const result = calculateLoad(settings, initiatives);
            expect(result.isOverCapex).toBe(true);
        });

        it('should flag isOverOpex correctly', () => {
            const settings = { ...DEFAULT_SETTINGS, total_opex_limit: 100000 };
            const initiatives = [
                makeInitiative({ opex_current_fy: 60000, status: 'active' }),
                makeInitiative({ opex_current_fy: 60000, status: 'active' }),
            ];
            const result = calculateLoad(settings, initiatives);
            expect(result.isOverOpex).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should return zeroes when settings is null', () => {
            const result = calculateLoad(null, [makeInitiative({})]);
            expect(result.currentFocusLoad).toBe(0);
            expect(result.focusLimit).toBe(0);
            expect(result.isOverFocus).toBe(false);
        });

        it('should handle initiatives with missing/zero values', () => {
            const initiatives = [
                makeInitiative({ focus_slots: 0, capex_current_fy: 0, opex_current_fy: 0 }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentFocusLoad).toBe(0);
            expect(result.currentCapexLoad).toBe(0);
            expect(result.currentOpexLoad).toBe(0);
        });

        it('should handle string numbers correctly (DB returns text)', () => {
            const initiatives = [
                makeInitiative({ capex_current_fy: '250000' as unknown as number, opex_current_fy: '100000' as unknown as number }),
            ];
            const result = calculateLoad(DEFAULT_SETTINGS, initiatives);
            expect(result.currentCapexLoad).toBe(250000);
            expect(result.currentOpexLoad).toBe(100000);
        });
    });
});
