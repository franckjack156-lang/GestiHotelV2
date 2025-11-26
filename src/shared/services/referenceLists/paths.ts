/**
 * ============================================================================
 * REFERENCE LISTS - PATHS
 * ============================================================================
 *
 * Chemins Firestore pour les listes de référence
 */

import { doc, collection } from 'firebase/firestore';
import { db } from '@/core/config/firebase';

export const getListsDocPath = (establishmentId: string) =>
  doc(db, 'establishments', establishmentId, 'config', 'reference-lists');

export const getAuditCollectionPath = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'audit');

export const getVersionsCollectionPath = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'config', 'reference-lists-versions');

export const getDraftsCollectionPath = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'config', 'reference-lists-drafts');
