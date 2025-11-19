/**
 * ============================================================================
 * TEST UTILS
 * ============================================================================
 *
 * Utilitaires de test réutilisables
 * - Render avec providers
 * - Mock hooks
 * - Helpers
 */

import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import type { ReactElement, ReactNode } from 'react';

/**
 * Wrapper avec tous les providers nécessaires
 */
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>{children}</ThemeProvider>
    </BrowserRouter>
  );
};

/**
 * Render custom avec providers
 */
export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Re-export tout de testing-library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Helper pour attendre un temps donné
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper pour créer un mock de Firestore Timestamp
 */
export const mockTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
});

/**
 * Helper pour créer un user mock
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'manager',
  establishmentIds: ['test-establishment'],
  currentEstablishmentId: 'test-establishment',
  status: 'active',
  isActive: true,
  emailVerified: true,
  createdAt: mockTimestamp(),
  updatedAt: mockTimestamp(),
  ...overrides,
});

/**
 * Helper pour créer une intervention mock
 */
export const createMockIntervention = (overrides = {}) => ({
  id: 'test-intervention-id',
  establishmentId: 'test-establishment',
  title: 'Test Intervention',
  description: 'Test description',
  type: 'maintenance' as const,
  priority: 'medium' as const,
  status: 'open' as const,
  roomId: 'room-101',
  createdBy: 'test-user-id',
  createdAt: mockTimestamp(),
  updatedAt: mockTimestamp(),
  ...overrides,
});
