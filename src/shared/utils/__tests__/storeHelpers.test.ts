/**
 * Tests pour les helpers des stores Zustand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withLoading,
  withRetry,
  withErrorHandling,
  debounce,
  throttle,
  type LoadingStore,
} from '../storeHelpers';

// Mock du logger
vi.mock('@/core/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('storeHelpers', () => {
  describe('withLoading', () => {
    let mockStore: LoadingStore;

    beforeEach(() => {
      mockStore = {
        setLoading: vi.fn(),
        setError: vi.fn(),
      };
    });

    it('should set loading to true then false on success', async () => {
      const successFn = vi.fn().mockResolvedValue('success');

      const result = await withLoading(mockStore, successFn);

      expect(result).toBe('success');
      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockStore.setError).toHaveBeenCalledWith(null);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should set error on failure', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(withLoading(mockStore, errorFn)).rejects.toThrow('Test error');

      expect(mockStore.setError).toHaveBeenCalledWith('Test error');
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should use custom error message if provided', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Original error'));

      await expect(
        withLoading(mockStore, errorFn, { errorMessage: 'Custom error message' })
      ).rejects.toThrow();

      expect(mockStore.setError).toHaveBeenCalledWith('Custom error message');
    });

    it('should call onSuccess callback', async () => {
      const successFn = vi.fn().mockResolvedValue('data');
      const onSuccess = vi.fn();

      await withLoading(mockStore, successFn, { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith('data');
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const errorFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(withLoading(mockStore, errorFn, { onError })).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const successFn = vi.fn().mockResolvedValue('success');

      const promise = withRetry(successFn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockRejectedValueOnce(new Error('Second fail'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100 });

      // Avancer le temps pour chaque retry
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      vi.useRealTimers(); // Utiliser les timers réels pour ce test

      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      // Utiliser un délai très court pour accélérer le test
      await expect(withRetry(fn, { maxRetries: 2, initialDelay: 1, maxDelay: 5 })).rejects.toThrow(
        'Always fails'
      );

      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries

      vi.useFakeTimers(); // Remettre les fake timers pour les autres tests
    });

    it('should respect shouldRetry option', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Non-retriable'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(withRetry(fn, { maxRetries: 3, shouldRetry })).rejects.toThrow('Non-retriable');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalled();
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const successFn = vi.fn().mockResolvedValue('data');

      const result = await withErrorHandling(successFn);

      expect(result).toBe('data');
    });

    it('should return fallback on error', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Error'));

      const result = await withErrorHandling(errorFn, { fallback: 'default' });

      expect(result).toBe('default');
    });

    it('should return undefined when no fallback is provided', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Error'));

      const result = await withErrorHandling(errorFn);

      expect(result).toBeUndefined();
    });

    it('should rethrow error when rethrow is true', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Rethrown'));

      await expect(withErrorHandling(errorFn, { rethrow: true })).rejects.toThrow('Rethrown');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('test');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('should only execute once for rapid calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      vi.advanceTimersByTime(300);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('third');
    });

    it('should reset timer on each call', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('first');
      vi.advanceTimersByTime(200);
      debouncedFn('second');
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn('first');
      expect(fn).toHaveBeenCalledWith('first');
    });

    it('should ignore calls during throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('first');
    });

    it('should allow calls after throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 300);

      throttledFn('first');
      vi.advanceTimersByTime(300);
      throttledFn('second');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('second');
    });
  });
});
