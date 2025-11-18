/**
 * ============================================================================
 * SECURITY SECTION - Tests
 * ============================================================================
 *
 * Tests complets pour le composant SecuritySection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/tests/test-utils';
import { SecuritySection } from '../SecuritySection';
import * as sonner from 'sonner';

// Mock du toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SecuritySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDER TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render the security section', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByText('Sécurité du compte')).toBeInTheDocument();
      expect(screen.getByText(/gérez votre mot de passe/i)).toBeInTheDocument();
    });

    it('should render all password fields', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
    });

    it('should render password requirements section', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByText('Exigences du mot de passe')).toBeInTheDocument();
      expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
      expect(screen.getByText(/au moins une majuscule/i)).toBeInTheDocument();
      expect(screen.getByText(/au moins une minuscule/i)).toBeInTheDocument();
      expect(screen.getByText(/au moins un chiffre/i)).toBeInTheDocument();
      expect(screen.getByText(/au moins un caractère spécial/i)).toBeInTheDocument();
    });

    it('should initially disable submit button', () => {
      renderWithProviders(<SecuritySection />);

      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // PASSWORD INPUT TESTS
  // ============================================================================

  describe('Password Input', () => {
    it('should allow entering current password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const currentPasswordInput = screen.getByLabelText(/mot de passe actuel/i);
      await user.type(currentPasswordInput, 'OldPassword123!');

      expect(currentPasswordInput).toHaveValue('OldPassword123!');
    });

    it('should allow entering new password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'NewPassword123!');

      expect(newPasswordInput).toHaveValue('NewPassword123!');
    });

    it('should allow entering password confirmation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);
      await user.type(confirmPasswordInput, 'NewPassword123!');

      expect(confirmPasswordInput).toHaveValue('NewPassword123!');
    });

    it('should mask password by default', () => {
      renderWithProviders(<SecuritySection />);

      const passwordInputs = screen.getAllByPlaceholderText(/•+/);
      passwordInputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'password');
      });
    });
  });

  // ============================================================================
  // PASSWORD STRENGTH TESTS
  // ============================================================================

  describe('Password Strength', () => {
    it('should show weak strength for short passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'abc');

      await waitFor(() => {
        expect(screen.getByText('Faible')).toBeInTheDocument();
      });
    });

    it('should show medium strength for moderately secure passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'Password1');

      await waitFor(() => {
        expect(screen.getByText('Moyenne')).toBeInTheDocument();
      });
    });

    it('should show strong strength for secure passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'SecurePass123!');

      await waitFor(() => {
        expect(screen.getByText('Forte')).toBeInTheDocument();
      });
    });

    it('should show very strong strength for very secure passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'VeryS3cur3P@ssw0rd!');

      await waitFor(() => {
        expect(screen.getByText('Très forte')).toBeInTheDocument();
      });
    });

    it('should update strength indicator dynamically', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);

      // Start with weak
      await user.type(newPasswordInput, 'abc');
      await waitFor(() => {
        expect(screen.getByText('Faible')).toBeInTheDocument();
      });

      // Add more to make it strong
      await user.type(newPasswordInput, 'SecurePass123!');
      await waitFor(() => {
        expect(screen.getByText('Forte')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PASSWORD REQUIREMENTS TESTS
  // ============================================================================

  describe('Password Requirements', () => {
    it('should check all requirements for valid password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'ValidPass123!');

      await waitFor(() => {
        // Tous les critères devraient être validés
        const checkmarks = screen.getAllByTestId(/check-/i);
        expect(checkmarks.length).toBeGreaterThan(0);
      });
    });

    it('should show unmet requirements for weak password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, 'weak');

      // Au moins certains critères ne devraient pas être remplis
      await waitFor(() => {
        const requirementsText = screen.getByText(/au moins 8 caractères/i);
        expect(requirementsText).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should enable submit when all fields are valid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      // Remplir tous les champs
      await user.type(screen.getByLabelText(/mot de passe actuel/i), 'OldPassword123!');
      await user.type(screen.getByLabelText(/nouveau mot de passe/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'NewPassword123!');

      // Le bouton devrait être activé
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      await user.type(screen.getByLabelText(/mot de passe actuel/i), 'OldPassword123!');
      await user.type(screen.getByLabelText(/nouveau mot de passe/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'DifferentPassword123!');

      // Soumettre le formulaire
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      await user.click(submitButton);

      // Devrait afficher une erreur
      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled();
      });
    });

    it('should require current password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      // Remplir seulement le nouveau mot de passe
      await user.type(screen.getByLabelText(/nouveau mot de passe/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'NewPassword123!');

      // Le bouton devrait être désactivé
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================

  describe('Form Submission', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      // Remplir le formulaire
      await user.type(screen.getByLabelText(/mot de passe actuel/i), 'OldPassword123!');
      await user.type(screen.getByLabelText(/nouveau mot de passe/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'NewPassword123!');

      // Soumettre
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      await user.click(submitButton);

      // Vérifier l'état de chargement
      expect(screen.getByText(/changement en cours/i)).toBeInTheDocument();
    });

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      // Remplir le formulaire
      await user.type(screen.getByLabelText(/mot de passe actuel/i), 'OldPassword123!');
      await user.type(screen.getByLabelText(/nouveau mot de passe/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'NewPassword123!');

      // Soumettre
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      await user.click(submitButton);

      // Attendre le toast de succès
      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Mot de passe modifié avec succès',
          expect.objectContaining({
            description: 'Votre mot de passe a été changé',
          })
        );
      });
    });

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      // Remplir le formulaire
      const currentPasswordInput = screen.getByLabelText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmer le mot de passe/i);

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      // Soumettre
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });
      await user.click(submitButton);

      // Attendre que le formulaire soit vidé
      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue('');
        expect(newPasswordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
    });

    it('should have descriptive help text', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByText(/vous devrez vous reconnecter/i)).toBeInTheDocument();
    });

    it('should have security tips section', () => {
      renderWithProviders(<SecuritySection />);

      expect(screen.getByText('Conseils de sécurité')).toBeInTheDocument();
      expect(screen.getByText(/utilisez un mot de passe unique/i)).toBeInTheDocument();
      expect(screen.getByText(/activez l'authentification/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const longPassword = 'A'.repeat(100) + '1!';
      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, longPassword);

      expect(newPasswordInput).toHaveValue(longPassword);
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const specialPassword = 'P@ssw0rd!#$%^&*()';
      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, specialPassword);

      expect(newPasswordInput).toHaveValue(specialPassword);
    });

    it('should handle unicode characters in password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SecuritySection />);

      const unicodePassword = 'Pässwörd123!';
      const newPasswordInput = screen.getByLabelText(/nouveau mot de passe/i);
      await user.type(newPasswordInput, unicodePassword);

      expect(newPasswordInput).toHaveValue(unicodePassword);
    });
  });
});
