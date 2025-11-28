/**
 * Tests pour les types de statut, priorité et workflow des interventions
 */

import { describe, it, expect } from 'vitest';
import {
  InterventionStatus,
  InterventionPriority,
  InterventionType,
  InterventionCategory,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_VALUES,
  INTERVENTION_TYPE_LABELS,
  CATEGORY_LABELS,
  ALLOWED_STATUS_TRANSITIONS,
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  FINAL_STATUSES,
} from '../status.types';

describe('InterventionStatus enum', () => {
  it('should have all expected statuses', () => {
    expect(InterventionStatus.DRAFT).toBe('draft');
    expect(InterventionStatus.PENDING).toBe('pending');
    expect(InterventionStatus.ASSIGNED).toBe('assigned');
    expect(InterventionStatus.IN_PROGRESS).toBe('in_progress');
    expect(InterventionStatus.ON_HOLD).toBe('on_hold');
    expect(InterventionStatus.COMPLETED).toBe('completed');
    expect(InterventionStatus.VALIDATED).toBe('validated');
    expect(InterventionStatus.CANCELLED).toBe('cancelled');
  });

  it('should have 8 statuses', () => {
    const statusCount = Object.values(InterventionStatus).length;
    expect(statusCount).toBe(8);
  });
});

describe('InterventionPriority enum', () => {
  it('should have all expected priorities', () => {
    expect(InterventionPriority.LOW).toBe('low');
    expect(InterventionPriority.NORMAL).toBe('normal');
    expect(InterventionPriority.HIGH).toBe('high');
    expect(InterventionPriority.URGENT).toBe('urgent');
    expect(InterventionPriority.CRITICAL).toBe('critical');
  });

  it('should have 5 priorities', () => {
    const priorityCount = Object.values(InterventionPriority).length;
    expect(priorityCount).toBe(5);
  });
});

describe('InterventionType enum', () => {
  it('should have expected types', () => {
    expect(InterventionType.PLUMBING).toBe('plumbing');
    expect(InterventionType.ELECTRICITY).toBe('electricity');
    expect(InterventionType.OTHER).toBe('other');
  });

  it('should have at least 10 types', () => {
    const typeCount = Object.values(InterventionType).length;
    expect(typeCount).toBeGreaterThanOrEqual(10);
  });
});

describe('STATUS_LABELS', () => {
  it('should have a label for every status', () => {
    Object.values(InterventionStatus).forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe('string');
    });
  });

  it('should have correct French labels', () => {
    expect(STATUS_LABELS[InterventionStatus.DRAFT]).toBe('Brouillon');
    expect(STATUS_LABELS[InterventionStatus.PENDING]).toBe('En attente');
    expect(STATUS_LABELS[InterventionStatus.COMPLETED]).toBe('Terminée');
  });
});

describe('STATUS_COLORS', () => {
  it('should have a color for every status', () => {
    Object.values(InterventionStatus).forEach((status) => {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(typeof STATUS_COLORS[status]).toBe('string');
    });
  });

  it('should use Tailwind CSS classes', () => {
    Object.values(STATUS_COLORS).forEach((color) => {
      expect(color).toMatch(/bg-/);
      expect(color).toMatch(/text-/);
    });
  });
});

describe('STATUS_ICONS', () => {
  it('should have an icon for every status', () => {
    Object.values(InterventionStatus).forEach((status) => {
      expect(STATUS_ICONS[status]).toBeDefined();
      expect(typeof STATUS_ICONS[status]).toBe('string');
    });
  });
});

describe('PRIORITY_LABELS', () => {
  it('should have a label for every priority', () => {
    Object.values(InterventionPriority).forEach((priority) => {
      expect(PRIORITY_LABELS[priority]).toBeDefined();
      expect(typeof PRIORITY_LABELS[priority]).toBe('string');
    });
  });
});

describe('PRIORITY_COLORS', () => {
  it('should have a color for every priority', () => {
    Object.values(InterventionPriority).forEach((priority) => {
      expect(PRIORITY_COLORS[priority]).toBeDefined();
    });
  });
});

describe('PRIORITY_VALUES', () => {
  it('should have numeric values for sorting', () => {
    expect(PRIORITY_VALUES[InterventionPriority.LOW]).toBe(1);
    expect(PRIORITY_VALUES[InterventionPriority.NORMAL]).toBe(2);
    expect(PRIORITY_VALUES[InterventionPriority.HIGH]).toBe(3);
    expect(PRIORITY_VALUES[InterventionPriority.URGENT]).toBe(4);
    expect(PRIORITY_VALUES[InterventionPriority.CRITICAL]).toBe(5);
  });

  it('should allow sorting priorities', () => {
    const priorities = [
      InterventionPriority.HIGH,
      InterventionPriority.LOW,
      InterventionPriority.CRITICAL,
      InterventionPriority.NORMAL,
    ];

    const sorted = priorities.sort(
      (a, b) => PRIORITY_VALUES[a] - PRIORITY_VALUES[b]
    );

    expect(sorted[0]).toBe(InterventionPriority.LOW);
    expect(sorted[sorted.length - 1]).toBe(InterventionPriority.CRITICAL);
  });
});

describe('INTERVENTION_TYPE_LABELS', () => {
  it('should have a label for every type', () => {
    Object.values(InterventionType).forEach((type) => {
      expect(INTERVENTION_TYPE_LABELS[type]).toBeDefined();
    });
  });
});

describe('CATEGORY_LABELS', () => {
  it('should have a label for every category', () => {
    Object.values(InterventionCategory).forEach((category) => {
      expect(CATEGORY_LABELS[category]).toBeDefined();
    });
  });
});

describe('ALLOWED_STATUS_TRANSITIONS', () => {
  it('should have transitions defined for every status', () => {
    Object.values(InterventionStatus).forEach((status) => {
      expect(ALLOWED_STATUS_TRANSITIONS[status]).toBeDefined();
      expect(Array.isArray(ALLOWED_STATUS_TRANSITIONS[status])).toBe(true);
    });
  });

  it('should allow DRAFT to go to PENDING or CANCELLED', () => {
    const draftTransitions = ALLOWED_STATUS_TRANSITIONS[InterventionStatus.DRAFT];
    expect(draftTransitions).toContain(InterventionStatus.PENDING);
    expect(draftTransitions).toContain(InterventionStatus.CANCELLED);
  });

  it('should have no transitions from VALIDATED (final state)', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[InterventionStatus.VALIDATED]).toHaveLength(0);
  });

  it('should have no transitions from CANCELLED (final state)', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[InterventionStatus.CANCELLED]).toHaveLength(0);
  });

  it('should allow IN_PROGRESS to go to ON_HOLD, COMPLETED, or CANCELLED', () => {
    const inProgressTransitions = ALLOWED_STATUS_TRANSITIONS[InterventionStatus.IN_PROGRESS];
    expect(inProgressTransitions).toContain(InterventionStatus.ON_HOLD);
    expect(inProgressTransitions).toContain(InterventionStatus.COMPLETED);
    expect(inProgressTransitions).toContain(InterventionStatus.CANCELLED);
  });
});

describe('Status groups', () => {
  describe('ACTIVE_STATUSES', () => {
    it('should contain active statuses', () => {
      expect(ACTIVE_STATUSES).toContain(InterventionStatus.PENDING);
      expect(ACTIVE_STATUSES).toContain(InterventionStatus.ASSIGNED);
      expect(ACTIVE_STATUSES).toContain(InterventionStatus.IN_PROGRESS);
      expect(ACTIVE_STATUSES).toContain(InterventionStatus.ON_HOLD);
    });

    it('should not contain final statuses', () => {
      expect(ACTIVE_STATUSES).not.toContain(InterventionStatus.VALIDATED);
      expect(ACTIVE_STATUSES).not.toContain(InterventionStatus.CANCELLED);
    });
  });

  describe('COMPLETED_STATUSES', () => {
    it('should contain completed and validated', () => {
      expect(COMPLETED_STATUSES).toContain(InterventionStatus.COMPLETED);
      expect(COMPLETED_STATUSES).toContain(InterventionStatus.VALIDATED);
    });

    it('should have exactly 2 statuses', () => {
      expect(COMPLETED_STATUSES).toHaveLength(2);
    });
  });

  describe('FINAL_STATUSES', () => {
    it('should contain validated and cancelled', () => {
      expect(FINAL_STATUSES).toContain(InterventionStatus.VALIDATED);
      expect(FINAL_STATUSES).toContain(InterventionStatus.CANCELLED);
    });

    it('should have exactly 2 statuses', () => {
      expect(FINAL_STATUSES).toHaveLength(2);
    });
  });
});
