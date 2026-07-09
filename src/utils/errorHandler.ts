/**
 * Shared async error handler.
 * Wraps an async function, logs any error and re-throws it for
 * callers to handle (e.g. setting error state).
 */
export const handleAsyncError = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (err) {
        console.error(err);
        throw err;
    }
};
