/**
 * ============================================================================
 * SECURITY SECTION - Settings Page
 * ============================================================================
 *
 * Section for managing security settings:
 * - Password change
 * - Password strength validation
 *
 * Extracted from Settings.tsx
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SecuritySection = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<SecurityFormData>();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = form;

  const newPassword = watch('newPassword');

  // Calculer la force du mot de passe
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  // Mettre à jour la force du mot de passe
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword || ''));
  }, [newPassword]);

  const onSubmit = async (data: SecurityFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas', {
        description: 'Veuillez vérifier la confirmation',
      });
      return;
    }

    if (calculatePasswordStrength(data.newPassword) < 3) {
      toast.error('Mot de passe trop faible', {
        description: 'Utilisez au moins 8 caractères avec majuscules, minuscules et chiffres',
      });
      return;
    }

    setIsUpdating(true);
    try {
      // ✅ Mise à jour du mot de passe avec Firebase Auth
      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error('Utilisateur non connecté');
      }

      // 1. Ré-authentifier l'utilisateur (obligatoire pour changer le mot de passe)
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Mettre à jour le mot de passe
      await updatePassword(user, data.newPassword);

      toast.success('Mot de passe modifié avec succès', {
        description: 'Votre nouveau mot de passe est maintenant actif',
      });
      reset();
    } catch (error) {
      logger.error('Erreur lors de la modification du mot de passe:', error);

      // Gestion des erreurs Firebase
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        toast.error('Mot de passe actuel incorrect', {
          description: 'Veuillez vérifier votre mot de passe actuel',
        });
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        toast.error('Session expirée', {
          description: 'Veuillez vous reconnecter et réessayer',
        });
      } else if (firebaseError.code === 'auth/weak-password') {
        toast.error('Mot de passe trop faible', {
          description: 'Utilisez un mot de passe plus robuste',
        });
      } else {
        toast.error('Erreur lors de la modification', {
          description: firebaseError.message || 'Veuillez réessayer',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Faible';
    if (passwordStrength <= 3) return 'Moyen';
    return 'Fort';
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Sécurité</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Gérez votre mot de passe et protégez votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info security */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Conseils pour un mot de passe sécurisé
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Au moins 8 caractères (12 recommandés)</li>
                  <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
                  <li>• Évitez les informations personnelles</li>
                  <li>• N'utilisez pas le même mot de passe ailleurs</li>
                </ul>
              </div>
            </div>

            {/* Mot de passe actuel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Changer le mot de passe
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Mot de passe actuel
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    {...register('currentPassword', { required: true })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe actuel"
                    className={cn(
                      'pr-10 transition-all duration-200',
                      errors.currentPassword && 'border-red-500 focus:ring-red-500/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ce champ est requis
                  </p>
                )}
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    {...register('newPassword', { required: true, minLength: 8 })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Entrez votre nouveau mot de passe"
                    className={cn(
                      'pr-10 transition-all duration-200',
                      errors.newPassword && 'border-red-500 focus:ring-red-500/20'
                    )}
                    onChange={e => setPasswordStrength(calculatePasswordStrength(e.target.value))}
                  />
                </div>
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Force du mot de passe</span>
                      <span
                        className={cn(
                          'font-medium',
                          passwordStrength <= 1 && 'text-red-500',
                          passwordStrength > 1 && passwordStrength <= 3 && 'text-orange-500',
                          passwordStrength > 3 && 'text-green-500'
                        )}
                      >
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-full transition-all duration-300',
                            i < passwordStrength ? getStrengthColor() : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.newPassword.type === 'minLength'
                      ? 'Minimum 8 caractères'
                      : 'Ce champ est requis'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    {...register('confirmPassword', { required: true })}
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Confirmez votre nouveau mot de passe"
                    className={cn(
                      'pr-10 transition-all duration-200',
                      errors.confirmPassword && 'border-red-500 focus:ring-red-500/20'
                    )}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ce champ est requis
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset()}
                disabled={isUpdating || !isDirty}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !isDirty}
                size="lg"
                className="relative overflow-hidden group min-w-[180px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Shield size={16} className="mr-2 transition-transform group-hover:scale-110" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
