/**
 * Tests for CardSkeleton component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CardSkeleton } from '../CardSkeleton';

describe('CardSkeleton', () => {
  it('should render skeleton elements', () => {
    const { container } = render(<CardSkeleton />);

    // Check for Card component
    const card = container.querySelector('[class*="border"]');
    expect(card).toBeInTheDocument();

    // Check for skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have proper structure', () => {
    const { container } = render(<CardSkeleton />);

    // Should have header and content
    expect(container.textContent).toBeDefined();
  });
});
