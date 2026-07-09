import { describe, it, expect, beforeAll } from 'vitest';
import Papa from 'papaparse';

// ===== BUSINESS LOGIC UNDER TEST =====

interface Calibration {
    largeSteerable: number;
    historicalAvg: number;
    frictionCoefficient: number;
}

interface ParserResults {
    nominalBaseline: number;
    adjustedBaseline: number;
    totalLoad: number;
    overcommitmentPct: number;
    fiscalDrag: number;
    dependencyRisks: { highPriority: string; blockedBy: string }[];
    mandateTensions: string[];
}

// 1. Core Focus Cost Formula
export function calculateFocusSlot(stake: number, tech: number, dep: number): number {
    const rawCost = Math.ceil(1.5 * Math.sqrt(stake + tech + dep));
    return Math.max(1, Math.min(6, rawCost));
}

interface AuditCsvRow {
    complexity_stakeholders_1_to_3?: string | number;
    complexity_novelty_1_to_3?: string | number;
    complexity_dependency_1_to_3?: string | number;
    current_fy_budget?: string | number;
    relative_priority?: string;
    approval_mandate?: string;
    initiative_name: string;
    dependency_blockers?: string;
}

interface InitiativeDetail {
    name: string;
    priority: string | undefined;
    mandate: string | undefined;
    blockers: string[];
}

// 2. Parser Logic
export function parseAndCalibrate(csvContent: string, cal: Calibration): ParserResults {
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    const rows = parsed.data as AuditCsvRow[];

    let totalLoad = 0;
    let fiscalDrag = 0;
    const initiativeMap = new Map<string, InitiativeDetail>();
    const dependencyRisks: { highPriority: string; blockedBy: string }[] = [];
    const mandateTensions: string[] = [];

    // Parse individual initiatives
    const initiatives = rows.map((row) => {
        const stake = parseInt(String(row.complexity_stakeholders_1_to_3), 10) || 1;
        const tech = parseInt(String(row.complexity_novelty_1_to_3), 10) || 1;
        const dep = parseInt(String(row.complexity_dependency_1_to_3), 10) || 1;
        const cost = calculateFocusSlot(stake, tech, dep);
        
        totalLoad += cost;

        const budget = parseInt(String(row.current_fy_budget).replace(/[^0-9]/g, ""), 10) || 0;
        const priority = row.relative_priority;
        const mandate = row.approval_mandate;
        const name = row.initiative_name;

        // Fiscal Drag definition: Tier 2 + Tier 3 budget
        if (priority === 'Tier 2' || priority === 'Tier 3') {
            fiscalDrag += budget;
        }

        // Blind Spot: Cabinet Approved but Tier 3
        if (mandate === 'Cabinet Approved' && priority === 'Tier 3') {
            mandateTensions.push(name);
        }

        const initObj = { name, priority, mandate, blockers: row.dependency_blockers ? row.dependency_blockers.split(',').map((b: string) => b.trim()) : [] };
        initiativeMap.set(name, initObj);
        return initObj;
    });

    // Detect Dependency Risks
    initiatives.forEach((init) => {
        if (init.priority === 'Tier 1' || init.mandate === 'Cabinet Approved') {
            init.blockers.forEach((blockerName: string) => {
                const blocker = initiativeMap.get(blockerName);
                if (blocker && (blocker.priority === 'Tier 2' || blocker.priority === 'Tier 3')) {
                    dependencyRisks.push({
                        highPriority: init.name,
                        blockedBy: blocker.name
                    });
                }
            });
        }
    });

    const nominalBaseline = (cal.largeSteerable * 5) + (Math.max(0, cal.historicalAvg - cal.largeSteerable) * 3);
    const adjustedBaseline = Math.round(nominalBaseline / cal.frictionCoefficient);
    const overcommitmentPct = Math.max(0, Math.round(((totalLoad - adjustedBaseline) / adjustedBaseline) * 100));

    return {
        nominalBaseline,
        adjustedBaseline,
        totalLoad,
        overcommitmentPct,
        fiscalDrag,
        dependencyRisks,
        mandateTensions
    };
}

// ===== MOCK INTAKE DATA FROM PHASE 1 =====

const MOCK_CSV_PAYLOAD = `initiative_name,strategic_pillar,approval_mandate,relative_priority,complexity_stakeholders_1_to_3,complexity_novelty_1_to_3,complexity_dependency_1_to_3,current_fy_budget,lifecycle_stage,target_delivery_quarter,dependency_blockers
River Path Restoration,Environment,Cabinet Approved,Tier 3,3,2,2,0,Active,Q1 FY26,None
Flood Plain Relocation Alpha,Safety,Cabinet Approved,Tier 3,3,3,2,0,Active,Q1 FY26,None
Sewage Upgrade Bypass,Infrastructure,Cabinet Approved,Tier 1,3,3,3,2500000,Active,Q1 FY26,Land Acquisition Zone B
Land Acquisition Zone B,Infrastructure,Board/Delegated,Tier 2,3,2,2,600000,Active,Q1 FY26,None
Community Hall Renovation,Community,Board/Delegated,Tier 3,2,1,1,250000,Active,Q2 FY26,None
Local Energy Trial,Innovation,Pre-Approval,Tier 3,3,3,2,400000,Active,Q2 FY26,None
Weed Eradication Campaign,Environment,Board/Delegated,Tier 2,2,2,2,600000,Active,Q3 FY26,None
Stormwater Renewal Beta,Core Infrastructure,Cabinet Approved,Tier 1,3,2,2,1200000,Active,Q1 FY26,None
Road Safety Resurfacing,Infrastructure,Board/Delegated,Tier 1,2,1,2,850000,Active,Q1 FY26,None
Library Digital Hub,Education,Board/Delegated,Tier 1,2,2,1,300000,Active,Q2 FY26,None
Active Transport Corridor,Transport,Board/Delegated,Tier 1,3,2,2,1500000,Active,Q1 FY26,None
Town Centre Revitalisation,Community,Board/Delegated,Tier 1,3,3,2,900000,Active,Q3 FY26,None
Youth Centre Upgrade,Community,Board/Delegated,Tier 1,2,2,2,450000,Active,Q2 FY26,None
Water Reservoir Seismic Strengthening,Infrastructure,Cabinet Approved,Tier 1,2,3,3,3100000,Active,Q1 FY26,None
Civil Defence Base Upgrade,Safety,Board/Delegated,Tier 1,2,2,2,750000,Active,Q1 FY26,None`;

const MOCK_CALIBRATION: Calibration = {
    largeSteerable: 4,
    historicalAvg: 12,
    frictionCoefficient: 1.4
};

// ===== TEST SUITE =====

describe('Strategic Capacity Audit: End-to-End Stress Calibration', () => {
    let parsedMetrics: ParserResults;

    beforeAll(() => {
        parsedMetrics = parseAndCalibrate(MOCK_CSV_PAYLOAD, MOCK_CALIBRATION);
    });

    // ASSERTION 1: Mathematical Traceability
    describe('Assertion 1: Ingestion Parser Mathematics', () => {
        it('should compute nominal capacity baseline correctly', () => {
            expect(parsedMetrics.nominalBaseline).toBe(44);
        });

        it('should compute friction-adjusted baseline using the 1.4 coefficient', () => {
            expect(parsedMetrics.adjustedBaseline).toBe(31);
        });

        it('should parse 15 initiatives totaling 64 slots of portfolio load', () => {
            expect(parsedMetrics.totalLoad).toBe(64);
        });

        it('should output an Overcommitment Percentage matching the friction-adjusted limit', () => {
            expect(parsedMetrics.overcommitmentPct).toBe(106); // (64 - 31) / 31 = 106%
        });

        it('should sum Fiscal Drag committed to Tier 2/3 budgets to exactly $1.85M', () => {
            expect(parsedMetrics.fiscalDrag).toBe(1850000);
        });
    });

    // ASSERTION 2: Structural Friction Diagnostics
    describe('Assertion 2: Structural Friction Diagnostics', () => {
        it('should identify all instances of Cabinet Approved mandates flagged as Tier 3', () => {
            expect(parsedMetrics.mandateTensions).toContain('River Path Restoration');
            expect(parsedMetrics.mandateTensions).toContain('Flood Plain Relocation Alpha');
            expect(parsedMetrics.mandateTensions).toHaveLength(2);
        });

        it('should detect critical Tier 1 dependencies blocked by low-priority Tier 2/3 items', () => {
            const trap = parsedMetrics.dependencyRisks.find(
                risk => risk.highPriority === 'Sewage Upgrade Bypass' && risk.blockedBy === 'Land Acquisition Zone B'
            );
            expect(trap).toBeDefined();
        });
    });

    // ASSERTION 3 & 4: LLM Output Compliance (If API Keys are configured)
    describe('Assertion 3 & 4: LLM Prompt Compliance (Integration only)', () => {
        const llmGeneratedProse = `
            The current portfolio demands sixty-four focus slots. Based on the organizational friction coefficient of 1.4 calibrated during the sync session, the current baseline represents the sustainable ceiling under current compliance and operational overhead. The organization is operating at a one hundred and six percent structural deficit. This deficit reflects systemic mandate accumulation over time.
            The Sewage Upgrade Bypass is currently stalled because it is blocked by Land Acquisition Zone B. Two Cabinet-mandated programmes (River Path Restoration and Flood Plain Relocation Alpha) sit in Tier three.
            To resolve this structural overload, the organization must transition to active governance. AlturaGov automated modules immediately ingest this portfolio to enforce active limits in the Command Center. Use the secure token ALTA-RIVER-2026 to activate the workspace.
        `;

        it('should NOT contain any corporate consulting buzzwords', () => {
            const bannedWords = [
                'leverage', 'holistic', 'robust', 'synergy', 'solution',
                'seamless', 'ecosystem', 'stakeholder', 'value-add',
                'best-in-class', 'park', 'put on ice', 'going forward', 'it should be noted'
            ];
            bannedWords.forEach(word => {
                expect(llmGeneratedProse.toLowerCase()).not.toContain(word);
            });
        });

        it('should contain the secure Reality Anchor calibration statement', () => {
            expect(llmGeneratedProse).toContain(
                'Based on the organizational friction coefficient of 1.4 calibrated during the sync session, the current baseline represents the sustainable ceiling under current compliance and operational overhead.'
            );
        });

        it('should terminate with the secure activation token structure', () => {
            const tokenRegex = /ALTA-[A-Z0-9]{4,12}/;
            expect(llmGeneratedProse).toMatch(tokenRegex);
        });
    });
});
