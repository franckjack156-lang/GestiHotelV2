/**
 * Tests for useKeyboardShortcut hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from '../useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  it('should call callback when shortcut is pressed', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'k',
          ctrl: true,
        },
        callback
      )
    );

    // Simulate Ctrl+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when in input field by default', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'k',
          ctrl: true,
        },
        callback
      )
    );

    // Create input element and dispatch event from it
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    input.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should call callback in input when enableInInputs is true', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'Enter',
          ctrl: true,
          enableInInputs: true,
        },
        callback
      )
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      value: input,
      enumerable: true,
    });

    window.dispatchEvent(event);

    // Should be called because enableInInputs is true
    expect(callback).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should handle multiple modifiers', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'k',
          ctrl: true,
          shift: true,
        },
        callback
      )
    );

    // Ctrl+K without Shift should not trigger
    let event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: false,
      bubbles: true,
    });
    window.dispatchEvent(event);
    expect(callback).not.toHaveBeenCalled();

    // Ctrl+Shift+K should trigger
    event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should prevent default behavior', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'k',
          ctrl: true,
        },
        callback
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
