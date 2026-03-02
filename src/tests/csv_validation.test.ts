/**
 * CSV Validation Tests
 * 
 * Tests the audit data validation logic used in SecureDropPage.
 * Ensures the required headers and row-level validation rules
 * are correctly enforced before data reaches Supabase.
 */
import { describe, it, expect } from 'vitest';

// ===== EXTRACTED VALIDATION LOGIC FROM SecureDropPage.tsx =====

const REQUIRED_HEADERS = [
    'initiative_name', 'strategic_pillar', 'priority_tier',
    'complexity_stakeholders_1_to_3', 'complexity_novelty_1_to_3',
    'complexity_dependency_1_to_3', 'current_fy_budget',
    'lifecycle_stage', 'next_milestone_date', 'dependency_blockers'
];

const VALID_PRIORITY_TIERS = ['Ministerial (New)', 'High', 'Medium', 'Low'];

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

    if (!row.initiative_name) {
        errors.push(`Row ${rowIndex + 1}: Missing required field [initiative_name].`);
    }

    if (!row.priority_tier) {
        errors.push(`Row ${rowIndex + 1}: Missing required field [priority_tier].`);
    } else if (!VALID_PRIORITY_TIERS.includes(row.priority_tier)) {
        errors.push(`Row ${rowIndex + 1}: Invalid priority_tier [${row.priority_tier}]. Must be Ministerial (New), High, Medium, or Low.`);
    }

    const validateScore = (val: string, field: string) => {
        if (!val) {
            errors.push(`Row ${rowIndex + 1}: Missing required field [${field}].`);
            return;
        }
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 3) {
            errors.push(`Row ${rowIndex + 1}: Invalid ${field} (must be 1-3)`);
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

describe('CSV Validation (Audit SecureDrop)', () => {

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
            const partial = ['initiative_name', 'priority_tier'];
            const result = validateHeaders(partial);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
            expect(result.errors[0]).toContain('strategic_pillar');
        });

        it('should reject completely empty headers', () => {
            const result = validateHeaders([]);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
        });
    });

    describe('Row Validation', () => {
        const validRow: Record<string, string> = {
            initiative_name: 'Digital Transformation',
            strategic_pillar: 'Innovation',
            priority_tier: 'High',
            complexity_stakeholders_1_to_3: '2',
            complexity_novelty_1_to_3: '3',
            complexity_dependency_1_to_3: '1',
            current_fy_budget: '150000',
            lifecycle_stage: 'Design',
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

        it('should reject missing priority_tier', () => {
            const row = { ...validRow, priority_tier: '' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('priority_tier'));
        });

        it('should reject invalid priority_tier values', () => {
            const row = { ...validRow, priority_tier: 'Critical' };
            const errors = validateRow(row, 0);
            expect(errors).toContainEqual(expect.stringContaining('Invalid priority_tier'));
        });

        it('should accept all valid priority tiers', () => {
            for (const tier of VALID_PRIORITY_TIERS) {
                const row = { ...validRow, priority_tier: tier };
                const errors = validateRow(row, 0);
                expect(errors).toHaveLength(0);
            }
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

        it('should reject missing complexity scores', () => {
            const row = {
                ...validRow,
                complexity_stakeholders_1_to_3: '',
                complexity_novelty_1_to_3: '',
                complexity_dependency_1_to_3: '',
            };
            const errors = validateRow(row, 0);
            expect(errors).toHaveLength(3); // All three missing
        });

        it('should report correct row number in error messages', () => {
            const row = { ...validRow, initiative_name: '' };
            const errors = validateRow(row, 4); // 5th row (0-indexed)
            expect(errors[0]).toContain('Row 5');
        });
    });

    describe('Full CSV Validation', () => {
        it('should validate a complete valid dataset', () => {
            const rows = [
                {
                    initiative_name: 'Project Alpha',
                    strategic_pillar: 'Growth',
                    priority_tier: 'High',
                    complexity_stakeholders_1_to_3: '2',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '3',
                    current_fy_budget: '200000',
                    lifecycle_stage: 'Build',
                    next_milestone_date: '2026-09-01',
                    dependency_blockers: 'None',
                },
                {
                    initiative_name: 'Project Beta',
                    strategic_pillar: 'Efficiency',
                    priority_tier: 'Low',
                    complexity_stakeholders_1_to_3: '1',
                    complexity_novelty_1_to_3: '1',
                    complexity_dependency_1_to_3: '1',
                    current_fy_budget: '50000',
                    lifecycle_stage: 'Plan',
                    next_milestone_date: '2026-12-01',
                    dependency_blockers: 'Budget approval pending',
                },
            ];

            const result = validateCsvData(REQUIRED_HEADERS, rows);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should catch multiple row errors in a single pass', () => {
            const rows = [
                {
                    initiative_name: '',
                    strategic_pillar: 'Growth',
                    priority_tier: 'Invalid',
                    complexity_stakeholders_1_to_3: '5',
                    complexity_novelty_1_to_3: '',
                    complexity_dependency_1_to_3: '2',
                    current_fy_budget: '0',
                    lifecycle_stage: 'Build',
                    next_milestone_date: '2026-09-01',
                    dependency_blockers: '',
                },
            ];

            const result = validateCsvData(REQUIRED_HEADERS, rows);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3); // name, tier, stakeholders, novelty
        });

        it('should fail fast on bad headers before checking rows', () => {
            const badHeaders = ['wrong_column'];
            const result = validateCsvData(badHeaders, []);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Missing headers');
        });
    });
});
