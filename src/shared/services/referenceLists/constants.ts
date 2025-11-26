/**
 * ============================================================================
 * REFERENCE LISTS - CONSTANTS
 * ============================================================================
 *
 * Constantes et règles de validation
 */

export const DEFAULT_VALIDATION_RULES = {
  value: {
    pattern: /^[a-z0-9_]+$/,
    minLength: 2,
    maxLength: 50,
    reserved: ['id', 'name', 'type', 'value', 'label'],
  },
  label: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  color: {
    allowed: ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'],
  },
  description: {
    maxLength: 500,
  },
};
