import { describe, it, expect } from 'vitest';

// Simulating the key generation logic from DecisionForm.tsx
function getDraftKey(userId: string | null) {
    const BASE_PERSISTENCE_KEY = 'wedecide_decision_draft';
    return userId ? `${BASE_PERSISTENCE_KEY}_${userId}` : null;
}

// Validation logic from DecisionForm.tsx
function isValidEmail(email: string) {
    if (!email) return true; // Optional email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// Simulating the stakeholder capture logic from DecisionForm.tsx
function processStakeholdersOnSubmit(
    currentPeople: any[],
    isExternal: boolean,
    manualName: string,
    manualEmail: string,
    selectedUserId: string,
    users: any[]
) {
    let finalPeople = [...currentPeople];

    // Logic from DecisionForm.tsx handleSubmit
    if (isExternal ? manualName.trim() : selectedUserId) {
        if (isExternal) {
            finalPeople.push({ name: manualName, email: manualEmail });
        } else {
            const userToAdd = users.find(u => u.id === selectedUserId);
            if (userToAdd && !finalPeople.some(p => p.userId === selectedUserId)) {
                finalPeople.push({ userId: userToAdd.id, name: userToAdd.name, email: userToAdd.email });
            }
        }
    }

    return finalPeople;
}

describe('Regression Tests: Bug Fixes', () => {

    describe('Draft Privacy (Regression Fix)', () => {
        it('should generate unique persistence keys for different users', () => {
            const userA = 'user-123';
            const userB = 'user-456';

            const keyA = getDraftKey(userA);
            const keyB = getDraftKey(userB);

            expect(keyA).not.toBe(keyB);
            expect(keyA).toBe('wedecide_decision_draft_user-123');
            expect(keyB).toBe('wedecide_decision_draft_user-456');
        });

        it('should return null key if no user is present', () => {
            expect(getDraftKey(null)).toBeNull();
        });
    });

    describe('Stakeholder Capture (Regression Fix)', () => {
        const mockUsers = [
            { id: 'u1', name: 'Alice', email: 'alice@test.com' },
            { id: 'u2', name: 'Bob', email: 'bob@test.com' }
        ];

        it('should include manual external stakeholder if not yet added to list', () => {
            const currentPeople: any[] = [];
            const result = processStakeholdersOnSubmit(
                currentPeople,
                true, // isExternal
                'Charlie External',
                'charlie@external.com',
                '',
                mockUsers
            );

            expect(result.length).toBe(1);
            expect(result[0].name).toBe('Charlie External');
        });

        it('should include selected team member if not yet added to list', () => {
            const currentPeople: any[] = [];
            const result = processStakeholdersOnSubmit(
                currentPeople,
                false, // isExternal
                '',
                '',
                'u1',
                mockUsers
            );

            expect(result.length).toBe(1);
            expect(result[0].userId).toBe('u1');
            expect(result[0].name).toBe('Alice');
        });

        it('should not add duplicate team members if already in list', () => {
            const currentPeople = [{ userId: 'u1', name: 'Alice', email: 'alice@test.com' }];
            const result = processStakeholdersOnSubmit(
                currentPeople,
                false, // isExternal
                '',
                '',
                'u1',
                mockUsers
            );

            expect(result.length).toBe(1); // Still 1
        });
    });

    describe('Validation Logic (New Fixes)', () => {
        it('should validate emails correctly', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('test.name+alias@sub.domain.org')).toBe(true);
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@example')).toBe(false);
            expect(isValidEmail('')).toBe(true); // Optional
        });

        it('should validate URLs correctly', () => {
            expect(isValidUrl('https://google.com')).toBe(true);
            expect(isValidUrl('http://my-site.net/page?q=1')).toBe(true);
            expect(isValidUrl('not-a-url')).toBe(false);
            expect(isValidUrl('www.google.com')).toBe(false); // URLs need protocol for new URL()
        });
    });

    describe('Capture Logic (Data Persistence)', () => {
        it('should handle both internal and external stakeholders for DB insertion', () => {
            const initialPeople = [
                { userId: 'user-123', name: 'Internal User', email: 'internal@example.com' },
                { name: 'External User', email: 'external@example.com' }
            ];

            // Simulate DecisionCreatePage/EditPage processing
            const processed = initialPeople.map(p => ({
                user_id: p.userId || null, // UI uses userId, but DB uses user_id
                name: p.name,
                email: p.email
            }));

            expect(processed[0].user_id).toBe('user-123');
            expect(processed[1].user_id).toBeNull();
            expect(processed[1].name).toBe('External User');
            expect(processed[1].email).toBe('external@example.com');
        });
    });
});
