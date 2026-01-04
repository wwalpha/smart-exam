import type { ApiStatus } from '@/stores/store.types';

export const withStatus = async <T>(
  setStatus: (status: Partial<ApiStatus>) => void,
  fn: () => Promise<T>,
  errorMessage: string,
  options?: {
    fallback?: T;
    rethrow?: boolean;
  }
): Promise<T> => {
  setStatus({ isLoading: true, error: null });
  try {
    const result = await fn();
    return result;
  } catch (error) {
    console.error(error);
    setStatus({ error: errorMessage });
    if (options?.rethrow) throw error;
    return options?.fallback as T;
  } finally {
    setStatus({ isLoading: false });
  }
};
