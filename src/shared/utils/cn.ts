/**
 * cn - Utility function for merging Tailwind classes
 *
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // => conditional
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
