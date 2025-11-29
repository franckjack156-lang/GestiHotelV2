/**
 * Test Setup File
 *
 * Configuration globale pour tous les tests Vitest
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase modules
vi.mock('@/core/config/firebase', () => ({
  db: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  storage: {},
  messaging: null,
}));

// Mock permissionService
vi.mock('@/core/services/permissionService', () => ({
  permissionService: {
    hasPermission: vi.fn(() => false),
    isAdmin: vi.fn(() => false),
    isSuperAdmin: vi.fn(() => false),
    canAccessEstablishment: vi.fn(() => true),
    canManageUser: vi.fn(() => false),
    canAssignRole: vi.fn(() => false),
  },
}));

// Mock window.matchMedia (utilisé par shadcn/ui)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
