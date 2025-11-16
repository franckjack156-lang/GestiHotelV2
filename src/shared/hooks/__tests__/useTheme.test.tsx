/**
 * Tests for useTheme hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, ThemeProvider } from '@/shared/contexts/ThemeContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with system theme by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
  });

  it('should toggle between light and dark themes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Set to light explicitly
    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');
    expect(result.current.actualTheme).toBe('light');

    // Toggle should switch to dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.actualTheme).toBe('dark');

    // Toggle again should switch to light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.actualTheme).toBe('light');
  });

  it('should persist theme in localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem('gestihotel-theme')).toBe('dark');
  });

  it('should load theme from localStorage on mount', () => {
    localStorage.setItem('gestihotel-theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
  });

  it('should handle all theme modes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Light
    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.actualTheme).toBe('light');

    // Dark
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.actualTheme).toBe('dark');

    // System (will depend on matchMedia mock, defaults to light)
    act(() => {
      result.current.setTheme('system');
    });
    expect(result.current.theme).toBe('system');
    expect(['light', 'dark']).toContain(result.current.actualTheme);
  });
});
