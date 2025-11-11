/**
 * ============================================================================
 * USER DELETE DIALOG COMPONENT - VERSION CORRIGÉE
 * ============================================================================
 *
 * Corrections :
 * - ✅ Suppression de AlertDialogDescription (génère un <p>)
 * - ✅ Structure HTML valide (pas de <div>, <p>, <ul> dans un <p>)
 * - ✅ Contenu dans un simple <div>
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { UserAvatar } from './UserAvatar';
import type { User } from '../types/user.types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface UserDeleteDialogProps {
  /** Dialog ouvert */
  open: boolean;
  /** Utilisateur à supprimer */
  user: User | null;
  /** En cours de suppression */
  isDeleting?: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Callback confirmation */
  onConfirm: () => void;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  open,
  user,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl">Supprimer l'utilisateur</AlertDialogTitle>
          </div>

          {/* ✅ CORRECTION : Utiliser un <div> au lieu de AlertDialogDescription */}
          {/* AlertDialogDescription génère un <p> qui ne peut pas contenir de <div>, <p>, <ul> */}
          <div className="text-sm text-muted-foreground text-left space-y-4 pt-4">
            {/* Utilisateur */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UserAvatar photoURL={user.photoURL} displayName={user.displayName} size="md" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {user.displayName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
              </div>
            </div>

            {/* Avertissement */}
            <div className="space-y-2">
              <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
              <p className="text-red-600 dark:text-red-400 font-medium">
                Cette action est irréversible et entraînera :
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>La désactivation immédiate du compte</li>
                <li>La perte d'accès à toutes les ressources</li>
                <li>L'anonymisation des données personnelles</li>
              </ul>
              <p className="text-sm text-gray-500 mt-3">
                Note : Les interventions et actions effectuées par cet utilisateur seront conservées
                pour l'historique.
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
