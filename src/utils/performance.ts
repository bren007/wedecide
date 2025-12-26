/**
 * Performance Monitoring Utility
 * Uses the Web Performance API to mark and measure key milestones.
 */

const APP_PREFIX = 'wedecide';

export const PerformanceMarkers = {
    APP_START: `${APP_PREFIX}-start`,
    AUTH_INIT_START: `${APP_PREFIX}-auth-init-start`,
    AUTH_INIT_END: `${APP_PREFIX}-auth-init-end`,
    PROFILE_FETCH_START: `${APP_PREFIX}-profile-fetch-start`,
    PROFILE_FETCH_SUCCESS: `${APP_PREFIX}-profile-fetch-success`,
} as const;

export const markPerformance = (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(name);
    }
};

export const measurePerformance = (measureName: string, startMark: string, endMark: string) => {
    if (typeof performance !== 'undefined' && performance.measure && performance.getEntriesByName(startMark).length > 0 && performance.getEntriesByName(endMark).length > 0) {
        try {
            performance.measure(measureName, startMark, endMark);
            const entries = performance.getEntriesByName(measureName);
            const lastEntry = entries[entries.length - 1];
            if (process.env.NODE_ENV === 'development') {
                console.log(`⏱️ Performance [${measureName}]: ${lastEntry.duration.toFixed(2)}ms`);
            }
            return lastEntry.duration;
        } catch (e) {
            // Silently fail if marks are missing
        }
    }
    return null;
};

// Initial mark on script load
markPerformance(PerformanceMarkers.APP_START);
