/**
 * CSV Validation Tests — Ambition vs. Reality Schema
 * 
 * Tests the audit data validation logic used in SecureDropPage.
 * Ensures the required headers and row-level validation rules
 * are correctly enforced before data reaches Supabase.
 */
import { describe, it, expect } from 'vitest';

// ===== EXTRACTED VALIDATION LOGIC FROM SecureDropPage.tsx =====

const REQUIRED_HEADERS = [
    'initiative_name', 'strategic_pillar', 'approval_mandate',
    'relative_priority', 'complexity_stakeholders_1_to_3',
    'complexity_novelty_1_to_3', 'complexity_dependency_1_to_3',
    'current_fy_budget', 'lifecycle_stage', 'target_delivery_quarter',
    'next_milestone_date', 'dependency_blockers'
];

const VALID_APPROVAL_MANDATES = ['Cabinet Approved', 'Ministerial Approved', 'Board/Delegated', 'Pre-Approval'];
const VALID_RELATIVE_PRIORITIES = ['Tier 1', 'Tier 2', 'Tier 3'];

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

function validateHeaders(headers: string[]): ValidationResult {
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        return {
            valid: false,
            errors: [`Invalid Template. Missing headers: ${missing.join(', ')}`]
        };
    }
    return { valid: true, errors: [] };
}

function validateRow(row: Record<string, string>, rowIndex: number): string[] {
    const errors: string[] = [];
    const initName = row.initiative_name || `(Row ${rowIndex + 1})`;

    if (!row.initiative_name) {
        errors.push(`Row ${rowIndex + 1}: Missing required field [initiative_name].`);
    }

    if (!row.approval_mandate) {
        errors.push(`Row ${rowIndex + 1} [${initName}]: Missing required field [approval_mandate].`);
    } else if (!VALID_APPROVAL_MANDATES.includes(row.approval_mandate)) {
        errors.push(`Row ${rowIndex + 1} [${initName}]: Invalid approval_mandate [${row.approval_mandate}]. Must be one of: ${VALID_APPROVAL_MANDATES.join(', ')}.`);
    }

    if (!row.relative_priority) {
        errors.push(`Row ${rowIndex + 1} [${initName}]: Missing required field [relative_priority].`);
    } else if (!VALID_RELATIVE_PRIORITIES.includes(row.relative_priority)) {
        errors.push(`Row ${rowIndex + 1} [${initName}]: Invalid relative_priority [${row.relative_priority}]. Must be one of: ${VALID_RELATIVE_PRIORITIES.join(', ')}.`);
    }

    if (!row.target_delivery_quarter) {
        errors.push(`Row ${rowIndex + 1} [${initName}]: Missing required field [target_delivery_quarter].`);
    }

    const validateScore = (val: string, field: string) => {
        if (!val) {
            errors.push(`Row ${rowIndex + 1} [${initName}]: Missing required field [${field}].`);
            return;
        }
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 3) {
            errors.push(`Row ${rowIndex + 1} [${initName}]: Invalid ${field} (must be 1-3).`);
        }
    };

    validateScore(row.complexity_stakeholders_1_to_3, 'complexity_stakeholders_1_to_3');
    validateScore(row.complexity_novelty_1_to_3, 'complexity_novelty_1_to_3');
    validateScore(row.complexity_dependency_1_to_3, 'complexity_dependency_1_to_3');

    return errors;
}

function validateCsvData(headers: string[], rows: Record<string, string>[]): ValidationResult {
    const headerResult = validateHeaders(headers);
    if (!headerResult.valid) return headerResult;

    const allErrors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
        allErrors.push(...validateRow(rows[i], i));
    }

    return {
        valid: allErrors.length === 0,
        errors: allErrors,
    };
}

// ===== TESTS =====

describe('CSV Validation (Ambition vs. Reality Schema)', () => {

    describe('Header Validation', () => {
        it('should accept valid headers', () => {
            const result = validateHeaders(REQUIRED_HEADERS);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept headers with extra columns (schema extension)', () => {
            const extended = [...REQUIRED_HEADERS, 'extra_notes', 'owner_email'];
            const result = validateHeaders(extended);
            expect(result.valid).toBe(true);
        });

        it('should reject when required headers are missing', () => {
            const partial = ['initiative_name', 'approval_mandate'];
            const result = validateHeaders(partial);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
            expect(result.errors[0]).toContain('relative_priority');
        });

        it('should reject old priority_tier header (schema migration)', () => {
            const oldHeaders = [
                'initiative_name', 'strategic_pillar', 'priority_tier',
                'complexity_stakeholders_1_to_3', 'complexity_novelty_1_to_3',
                'complexity_dependency_1_to_3', 'current_fy_budget',
                'lifecycle_stage', 'next_milestone_date', 'dependency_blockers'
            ];
            const result = validateHeaders(oldHeaders);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('approval_mandate');
            expect(result.errors[0]).toContain('relative_priority');
            expect(result.errors[0]).toContain('target_delivery_quarter');
        });

        it('should reject completely empty headers', () => {
            const result = validateHeaders([]);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
        });
    });

    describe('Row Validation — approval_mandate', () => {
        const validRow: Record<string, string> = {
            initiative_name: 'Digital Transformation',
            strategic_pillar: 'Innovation',
            approval_mandate: 'Cabinet Approved',
            relative_priority: 'Tier 1',
            complexity_stakeholders_1_to_3: '2',
            complexity_novelty_1_to_3: '3',
            complexity_dependency_1_to_3: '1',
            current_fy_budget: '150000',
            lifecycle_stage: 'Design',
            target_delivery_quarter: 'Q2 FY27',
            next_milestone_date: '2026-06-30',
            dependency_blockers: 'None',
        };

        it('should accept all valid approval_mandate values', () => {
            for (const mandate of VALID_APPROVAL_MANDATES) {
                const row = { ...validRow, approval_mandate: mandate };
                const errors = validateRow(row, 0);
                expect(errors).toHaveLength(0);
            }
        });

        it('should reject invalid approval_mandate values', () => {
            const row = { ...validRow, approval_mandate: 'Approved' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('Invalid approval_mandate'));
        });

        it('should reject missing approval_mandate', () => {
            const row = { ...validRow, approval_mandate: '' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('approval_mandate'));
        });
    });

    describe('Row Validation — relative_priority', () => {
        const validRow: Record<string, string> = {
            initiative_name: 'Digital Transformation',
            strategic_pillar: 'Innovation',
            approval_mandate: 'Cabinet Approved',
            relative_priority: 'Tier 1',
            complexity_stakeholders_1_to_3: '2',
            complexity_novelty_1_to_3: '3',
            complexity_dependency_1_to_3: '1',
            current_fy_budget: '150000',
            lifecycle_stage: 'Design',
            target_delivery_quarter: 'Q2 FY27',
            next_milestone_date: '2026-06-30',
            dependency_blockers: 'None',
        };

        it('should accept all valid relative_priority values', () => {
            for (const tier of VALID_RELATIVE_PRIORITIES) {
                const row = { ...validRow, relative_priority: tier };
                const errors = validateRow(row, 0);
                expect(errors).toHaveLength(0);
            }
        });

        it('should reject invalid relative_priority values', () => {
            const row = { ...validRow, relative_priority: 'High' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('Invalid relative_priority'));
        });

        it('should reject missing relative_priority', () => {
            const row = { ...validRow, relative_priority: '' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('relative_priority'));
        });
    });

    describe('Row Validation — target_delivery_quarter', () => {
        const validRow: Record<string, string> = {
            initiative_name: 'Digital Transformation',
            strategic_pillar: 'Innovation',
            approval_mandate: 'Cabinet Approved',
            relative_priority: 'Tier 1',
            complexity_stakeholders_1_to_3: '2',
            complexity_novelty_1_to_3: '3',
            complexity_dependency_1_to_3: '1',
            current_fy_budget: '150000',
            lifecycle_stage: 'Design',
            target_delivery_quarter: 'Q2 FY27',
            next_milestone_date: '2026-06-30',
            dependency_blockers: 'None',
        };

        it('should accept valid target_delivery_quarter', () => {
            const errors = validateRow(validRow, 0);
            expect(errors).toHaveLength(0);
        });

        it('should reject missing target_delivery_quarter', () => {
            const row = { ...validRow, target_delivery_quarter: '' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('target_delivery_quarter'));
        });
    });

    describe('Row Validation — complexity and general', () => {
        const validRow: Record<string, string> = {
            initiative_name: 'Digital Transformation',
            strategic_pillar: 'Innovation',
            approval_mandate: 'Cabinet Approved',
            relative_priority: 'Tier 1',
            complexity_stakeholders_1_to_3: '2',
            complexity_novelty_1_to_3: '3',
            complexity_dependency_1_to_3: '1',
            current_fy_budget: '150000',
            lifecycle_stage: 'Design',
            target_delivery_quarter: 'Q2 FY27',
            next_milestone_date: '2026-06-30',
            dependency_blockers: 'None',
        };

        it('should accept a fully valid row', () => {
            const errors = validateRow(validRow, 0);
            expect(errors).toHaveLength(0);
        });

        it('should reject missing initiative_name', () => {
            const row = { ...validRow, initiative_name: '' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('initiative_name'));
        });

        it('should reject complexity scores outside 1-3 range', () => {
            const row = { ...validRow, complexity_stakeholders_1_to_3: '5' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('must be 1-3'));
        });

        it('should reject complexity score of 0', () => {
            const row = { ...validRow, complexity_novelty_1_to_3: '0' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('must be 1-3'));
        });

        it('should reject non-numeric complexity scores', () => {
            const row = { ...validRow, complexity_dependency_1_to_3: 'high' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('must be 1-3'));
        });

        it('should report correct row number in error messages', () => {
            const row = { ...validRow, initiative_name: '' };
            const errors = validateRow(row, 4); // 5th row (0-indexed)
            expect(errors[0]).toContain('Row 5');
        });

        it('should include initiative name in error messages', () => {
            const row = { ...validRow, approval_mandate: 'Invalid' };
            const errors = validateRow(row, 0);
            expect(errors[0]).toContain('[Digital Transformation]');
        });
    });

    describe('Full CSV Validation', () => {
        it('should validate a complete valid dataset', () => {
            const rows = [
                {
                    initiative_name: 'Project Alpha',
                    strategic_pillar: 'Growth',
                    approval_mandate: 'Cabinet Approved',
                    relative_priority: 'Tier 1',
                    complexity_stakeholders_1_to_3: '2',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '3',
                    current_fy_budget: '200000',
                    lifecycle_stage: 'Build',
                    target_delivery_quarter: 'Q1 FY27',
                    next_milestone_date: '2026-09-01',
                    dependency_blockers: 'None',
                },
                {
                    initiative_name: 'Project Beta',
                    strategic_pillar: 'Efficiency',
                    approval_mandate: 'Pre-Approval',
                    relative_priority: 'Tier 3',
                    complexity_stakeholders_1_to_3: '1',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '1',
                    current_fy_budget: '50000',
                    lifecycle_stage: 'Plan',
                    target_delivery_quarter: 'Q4 FY27',
                    next_milestone_date: '2026-12-01',
                    dependency_blockers: 'Budget approval pending',
                },
            ];

            const result = validateCsvData(REQUIRED_HEADERS, rows);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should collect ALL row errors across multiple rows (not stop at first)', () => {
            const rows = [
                {
                    initiative_name: 'Project A',
                    strategic_pillar: 'Growth',
                    approval_mandate: 'Invalid',
                    relative_priority: 'Tier 1',
                    complexity_stakeholders_1_to_3: '2',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '3',
                    current_fy_budget: '200000',
                    lifecycle_stage: 'Build',
                    target_delivery_quarter: 'Q1 FY27',
                    next_milestone_date: '2026-09-01',
                    dependency_blockers: 'None',
                },
                {
                    initiative_name: 'Project B',
                    strategic_pillar: 'Efficiency',
                    approval_mandate: 'Pre-Approval',
                    relative_priority: 'Wrong',
                    complexity_stakeholders_1_to_3: '1',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '1',
                    current_fy_budget: '50000',
                    lifecycle_stage: 'Plan',
                    target_delivery_quarter: '',
                    next_milestone_date: '2026-12-01',
                    dependency_blockers: '',
                },
            ];

            const result = validateCsvData(REQUIRED_HEADERS, rows);
            expect(result.valid).toBe(false);
            // Row 1: invalid approval_mandate, Row 2: invalid relative_priority + missing target_delivery_quarter
            expect(result.errors.length).toBe(3);
            expect(result.errors[0]).toContain('Project A');
            expect(result.errors[1]).toContain('Project B');
        });

        it('should fail fast on bad headers before checking rows', () => {
            const badHeaders = ['wrong_column'];
            const result = validateCsvData(badHeaders, []);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
        });
    });
});
