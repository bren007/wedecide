import { describe, it, expect } from 'vitest';

// We need a way to test the logic inside AuthContext without mounting the whole provider
// I'll create a minimal version of the fetchUserProfile logic to verify the ref-based singleton pattern
describe('Auth Singleton Logic', () => {
    it('should only fire one network request when multiple fetches happen in parallel', async () => {
        let fetchCount = 0;
        const profileFetchRef = { current: null as any };

        const fetchUserProfile = async (userId: string) => {
            if (profileFetchRef.current) {
                return profileFetchRef.current;
            }

            const fetchPromise = (async () => {
                fetchCount++;
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 50));
                return { id: userId, name: 'Test User' };
            })().finally(() => {
                profileFetchRef.current = null;
            });

            profileFetchRef.current = fetchPromise;
            return fetchPromise;
        };

        // Fire 5 requests in parallel
        const results = await Promise.all([
            fetchUserProfile('user-1'),
            fetchUserProfile('user-1'),
            fetchUserProfile('user-1'),
            fetchUserProfile('user-1'),
            fetchUserProfile('user-1'),
        ]);

        expect(fetchCount).toBe(1);
        expect(results).toHaveLength(5);
        expect(results.every(r => r.id === 'user-1')).toBe(true);
    });

    it('should allow a new request after the previous one finishes', async () => {
        let fetchCount = 0;
        const profileFetchRef = { current: null as any };

        const fetchUserProfile = async (userId: string) => {
            if (profileFetchRef.current) return profileFetchRef.current;

            const fetchPromise = (async () => {
                fetchCount++;
                return { id: userId };
            })().finally(() => {
                profileFetchRef.current = null;
            });

            profileFetchRef.current = fetchPromise;
            return fetchPromise;
        };

        await fetchUserProfile('user-1');
        await fetchUserProfile('user-1');

        expect(fetchCount).toBe(2);
    });
});
