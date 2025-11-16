/**
 * Tests for ThemeToggle component
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/tests/test-utils';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Check for theme options
    expect(screen.getByText('Clair')).toBeInTheDocument();
    expect(screen.getByText('Sombre')).toBeInTheDocument();
    expect(screen.getByText('Système')).toBeInTheDocument();
  });

  it('should change theme when option is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click on Dark theme
    const darkOption = screen.getByText('Sombre');
    await user.click(darkOption);

    // Verify HTML has dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should persist theme selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    // Open and select dark theme
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Sombre'));

    // Check localStorage
    expect(localStorage.getItem('gestihotel-theme')).toBe('dark');
  });
});
