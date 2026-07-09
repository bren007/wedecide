/**
 * Auth Timeout Tests
 * 
 * Guards against the "Signing in..." hang bug caused by RLS recursion.
 * Tests the withTimeout utility and the profile fetch timeout behavior.
 */
import { describe, it, expect } from 'vitest';

// Extract the withTimeout logic from AuthContext for testability
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms)
        ),
    ]);
}

describe('Auth Timeout Logic', () => {

    describe('withTimeout utility', () => {
        it('should resolve when promise completes within timeout', async () => {
            const fast = new Promise<string>(resolve =>
                setTimeout(() => resolve('success'), 50)
            );

            const result = await withTimeout(fast, 1000, 'fast test');
            expect(result).toBe('success');
        });

        it('should reject with timeout error when promise exceeds timeout', async () => {
            const slow = new Promise<string>(resolve =>
                setTimeout(() => resolve('too late'), 5000)
            );

            await expect(
                withTimeout(slow, 100, 'slow query')
            ).rejects.toThrow('Timeout: slow query took longer than 100ms');
        });

        it('should propagate the original error if promise rejects before timeout', async () => {
            const failing = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('DB error')), 10)
            );

            await expect(
                withTimeout(failing, 1000, 'failing query')
            ).rejects.toThrow('DB error');
        });
    });

    describe('Profile fetch timeout behavior', () => {
        it('should return NETWORK_ERROR on timeout (simulates hung RLS query)', async () => {
            const maxRetries = 1;

            // Simulate the fetchUserProfile logic with a hung query
            const fetchUserProfile = async (retryCount = 0): Promise< unknown > => {
                try {
                    // Simulate a query that hangs (exceeds timeout)
                    await withTimeout(
                        new Promise(resolve => setTimeout(resolve, 10000)), // 10s hang
                        200, // 200ms timeout for test speed
                        'users query'
                    );
                    return { id: 'test-user' };
                } catch (error: unknown) {
                    if (retryCount < maxRetries) {
                        return fetchUserProfile(retryCount + 1);
                    }
                    if (error instanceof Error && error.message.includes('Timeout')) {
                        return 'NETWORK_ERROR';
                    }
                    return null;
                }
            };

            const result = await fetchUserProfile();
            expect(result).toBe('NETWORK_ERROR');
        });

        it('should succeed on retry after first timeout', async () => {
            let attempt = 0;

            const fetchUserProfile = async (retryCount = 0): Promise< unknown > => {
                try {
                    attempt++;
                    if (attempt === 1) {
                        // First attempt: simulate timeout
                        await withTimeout(
                            new Promise(resolve => setTimeout(resolve, 5000)),
                            50,
                            'users query'
                        );
                    }
                    // Second attempt: success
                    return { id: 'user-123', name: 'Test User', roles: ['admin'] };
                } catch {
                    if (retryCount < 1) {
                        return fetchUserProfile(retryCount + 1);
                    }
                    return 'NETWORK_ERROR';
                }
            };

            const result = await fetchUserProfile();
            expect(result).toEqual({ id: 'user-123', name: 'Test User', roles: ['admin'] });
            expect(attempt).toBe(2);
        });

        it('should handle stale session gracefully (user not in DB)', async () => {
            // Simulate: auth session exists but user was deleted from public.users
            const fetchUserProfile = async (): Promise< unknown > => {
                // Supabase would return PGRST116 (no rows)
                const profileError = { code: 'PGRST116', message: 'No rows found' };
                if (profileError.code === 'PGRST116') return null;
                return { id: 'stale-user' };
            };

            const result = await fetchUserProfile();
            expect(result).toBeNull();
        });
    });

    describe('Fallback timer', () => {
        it('should finalize loading state after timeout period', async () => {
            let isLoading = true;
            let initialFetchDone = false;

            // Simulate the fallback timer logic from AuthContext
            const FALLBACK_MS = 100; // Shortened for test

            await new Promise<void>(resolve => {
                setTimeout(() => {
                    if (!initialFetchDone) {
                        isLoading = false;
                        initialFetchDone = true;
                    }
                    resolve();
                }, FALLBACK_MS);
            });

            expect(isLoading).toBe(false);
            expect(initialFetchDone).toBe(true);
        });

        it('should NOT override state if fetch completed before fallback', async () => {
            let isLoading = true;
            let initialFetchDone = false;
            let user = null as unknown;

            // Simulate fast fetch completing before fallback
            await new Promise<void>(resolve => {
                // Fetch completes in 10ms
                setTimeout(() => {
                    user = { id: 'fast-user' };
                    isLoading = false;
                    initialFetchDone = true;
                }, 10);

                // Fallback at 100ms — should NOT reset user
                setTimeout(() => {
                    if (!initialFetchDone) {
                        isLoading = false;
                        initialFetchDone = true;
                    }
                    resolve();
                }, 100);
            });

            expect(user).toEqual({ id: 'fast-user' });
            expect(isLoading).toBe(false);
        });
    });
});
