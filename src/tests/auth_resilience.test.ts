import { describe, it, expect } from 'vitest';

describe('Auth Resilience Logic (SWR)', () => {
    it('should return NETWORK_ERROR on timeout instead of null', async () => {
        let fetchCount = 0;
        const profileFetchRef = { current: null as any };

        const fetchUserProfile = async (userId: string, retryCount = 0): Promise<any> => {
            if (profileFetchRef.current && retryCount === 0) return profileFetchRef.current;

            const fetchPromise = (async () => {
                fetchCount++;
                // Simulate timeout error
                throw new Error('Profile fetch timeout');
            })().catch(async (err) => {
                if (retryCount < 1) { // 1 retry for test speed
                    return fetchUserProfile(userId, retryCount + 1);
                }
                // The new behavior:
                if (err.message.includes('timeout')) return 'NETWORK_ERROR';
                return null;
            }).finally(() => {
                if (profileFetchRef.current === trackedPromise) profileFetchRef.current = null;
            });

            const trackedPromise = fetchPromise;
            if (retryCount === 0) profileFetchRef.current = trackedPromise;
            return trackedPromise;
        };

        const result = await fetchUserProfile('user-1');
        expect(fetchCount).toBe(2);
        expect(result).toBe('NETWORK_ERROR');
    });

    it('should share result between parallel calls during retry chain', async () => {
        let fetchCount = 0;
        const profileFetchRef = { current: null as any };

        const fetchUserProfile = async (userId: string, retryCount = 0): Promise<any> => {
            if (profileFetchRef.current && retryCount === 0) return profileFetchRef.current;

            const fetchPromise = (async () => {
                fetchCount++;
                if (retryCount < 1) throw new Error('timeout');
                return { id: userId, name: 'Success' };
            })().catch(async () => {
                if (retryCount < 1) return fetchUserProfile(userId, retryCount + 1);
                return 'NETWORK_ERROR';
            }).finally(() => {
                if (profileFetchRef.current === trackedPromise) profileFetchRef.current = null;
            });

            const trackedPromise = fetchPromise;
            if (retryCount === 0) profileFetchRef.current = trackedPromise;
            return trackedPromise;
        };

        const [res1, res2] = await Promise.all([
            fetchUserProfile('user-1'),
            fetchUserProfile('user-1')
        ]);

        expect(fetchCount).toBe(2);
        expect(res1.name).toBe('Success');
        expect(res1).toBe(res2);
    });
});
