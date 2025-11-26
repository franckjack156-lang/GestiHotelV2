/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
/**
 * ============================================================================
 * PROFILE SECTION - Tests
 * ============================================================================
 *
 * Tests complets pour le composant ProfileSection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
  createMockUser,
} from '@/tests/test-utils';
import { ProfileSection } from '../ProfileSection';
import * as sonner from 'sonner';

// Mock du toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfileSection', () => {
  const mockUser = createMockUser({
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+33612345678',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDER TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render the profile section with user data', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+33612345678')).toBeInTheDocument();
    });

    it('should render with empty values when user has no data', () => {
      const emptyUser = createMockUser({
        displayName: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
      });

      renderWithProviders(<ProfileSection user={emptyUser} />);

      // Les champs existent mais sont vides
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should render with null user', () => {
      renderWithProviders(<ProfileSection user={null} />);

      expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
    });

    it('should show all form sections', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      expect(screen.getByText('Informations principales')).toBeInTheDocument();
      expect(screen.getByText('Coordonnées professionnelles')).toBeInTheDocument();
    });

    it('should disable email field', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      const emailInput = screen.getByDisplayValue('john.doe@example.com');
      expect(emailInput).toBeDisabled();
    });

    it('should show lock icon on email field', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      // Vérifier que le texte d'aide indique que l'email ne peut pas être modifié
      expect(screen.getByText("L'email ne peut pas être modifié")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM INTERACTION TESTS
  // ============================================================================

  describe('Form Interactions', () => {
    it('should allow editing displayName field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      expect(displayNameInput).toHaveValue('Jane Smith');
    });

    it('should allow editing firstName field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      expect(firstNameInput).toHaveValue('Jane');
    });

    it('should allow editing lastName field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const lastNameInput = screen.getByDisplayValue('Doe');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Smith');

      expect(lastNameInput).toHaveValue('Smith');
    });

    it('should allow editing phoneNumber field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const phoneInput = screen.getByDisplayValue('+33612345678');
      await user.clear(phoneInput);
      await user.type(phoneInput, '+33698765432');

      expect(phoneInput).toHaveValue('+33698765432');
    });

    it('should show unsaved changes indicator when form is dirty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      // Initialement pas de badge "modifications non enregistrées"
      expect(screen.queryByText('Modifications non enregistrées')).not.toBeInTheDocument();

      // Modifier un champ
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      // Le badge devrait apparaître
      await waitFor(() => {
        expect(screen.getByText('Modifications non enregistrées')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================

  describe('Form Submission', () => {
    it('should disable submit button when form is not dirty', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      const submitButton = screen.getByRole('button', { name: /enregistrer/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is dirty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      const submitButton = screen.getByRole('button', { name: /enregistrer/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      // Modifier un champ
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      // Soumettre
      const submitButton = screen.getByRole('button', { name: /enregistrer/i });
      await user.click(submitButton);

      // Vérifier l'état de chargement
      expect(screen.getByText(/enregistrement/i)).toBeInTheDocument();
    });

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      // Modifier un champ
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      // Soumettre
      const submitButton = screen.getByRole('button', { name: /enregistrer/i });
      await user.click(submitButton);

      // Attendre le toast de succès
      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Profil mis à jour avec succès',
          expect.objectContaining({
            description: 'Vos informations ont été enregistrées',
          })
        );
      });
    });

    it('should show number of dirty fields in submit button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      // Modifier plusieurs champs
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Smith');

      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      // Le bouton devrait montrer le nombre de champs modifiés
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /enregistrer/i });
        expect(submitButton.textContent).toContain('2');
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      expect(screen.getByLabelText(/nom d'affichage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/poste/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/département/i)).toBeInTheDocument();
    });

    it('should have descriptive help text', () => {
      renderWithProviders(<ProfileSection user={mockUser} />);

      expect(screen.getByText('Visible par tous les utilisateurs')).toBeInTheDocument();
      expect(screen.getByText("L'email ne peut pas être modifié")).toBeInTheDocument();
      expect(
        screen.getByText('Les modifications seront visibles immédiatement')
      ).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle user with jobTitle and department', () => {
      const userWithJob = createMockUser({
        displayName: 'John Doe',
      });
      // Ajouter jobTitle et department via type assertion comme dans le composant
      const extendedUser = {
        ...userWithJob,
        jobTitle: 'Manager',
        department: 'IT',
      };

      renderWithProviders(<ProfileSection user={extendedUser as any} />);

      expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IT')).toBeInTheDocument();
    });

    it('should handle long text values', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const longText = 'A'.repeat(100);
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, longText);

      expect(displayNameInput).toHaveValue(longText);
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSection user={mockUser} />);

      const specialChars = "Jean-François O'Neill";
      const displayNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, specialChars);

      expect(displayNameInput).toHaveValue(specialChars);
    });
  });
});
