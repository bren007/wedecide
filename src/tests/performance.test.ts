import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markPerformance, measurePerformance, PerformanceMarkers } from '../utils/performance';

describe('Performance Monitoring Utility', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset performance marks/entries if possible, or just mock them
        // @ts-ignore
        global.performance = {
            mark: vi.fn(),
            measure: vi.fn(),
            getEntriesByName: vi.fn().mockReturnValue([{ duration: 123.45 }])
        };
    });

    it('should call performance.mark with the correct name', () => {
        markPerformance(PerformanceMarkers.AUTH_INIT_START);
        expect(performance.mark).toHaveBeenCalledWith(PerformanceMarkers.AUTH_INIT_START);
    });

    it('should call performance.measure and return duration', () => {
        const duration = measurePerformance(
            'Test Measure',
            PerformanceMarkers.AUTH_INIT_START,
            PerformanceMarkers.AUTH_INIT_END
        );

        expect(performance.measure).toHaveBeenCalledWith(
            'Test Measure',
            PerformanceMarkers.AUTH_INIT_START,
            PerformanceMarkers.AUTH_INIT_END
        );
        expect(duration).toBe(123.45);
    });

    it('should handle missing marks gracefully', () => {
        // @ts-ignore
        performance.getEntriesByName = vi.fn().mockReturnValue([]);

        const duration = measurePerformance(
            'Test Measure',
            'missing-start',
            'missing-end'
        );

        expect(duration).toBeNull();
    });
});
