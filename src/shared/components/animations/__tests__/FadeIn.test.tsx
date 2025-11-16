/**
 * Tests for FadeIn animation component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FadeIn } from '../FadeIn';

describe('FadeIn', () => {
  it('should render children', () => {
    render(
      <FadeIn>
        <div>Test Content</div>
      </FadeIn>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply animation with default props', () => {
    const { container } = render(
      <FadeIn>
        <div>Test</div>
      </FadeIn>
    );

    const animatedDiv = container.firstChild;
    expect(animatedDiv).toBeInTheDocument();
  });

  it('should accept custom delay and duration', () => {
    render(
      <FadeIn delay={0.5} duration={1}>
        <div>Test</div>
      </FadeIn>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should support different directions', () => {
    const directions = ['up', 'down', 'left', 'right', 'none'] as const;

    directions.forEach(direction => {
      const { unmount } = render(
        <FadeIn direction={direction}>
          <div>{direction}</div>
        </FadeIn>
      );

      expect(screen.getByText(direction)).toBeInTheDocument();
      unmount();
    });
  });

  it('should accept custom className', () => {
    const { container } = render(
      <FadeIn className="custom-class">
        <div>Test</div>
      </FadeIn>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
