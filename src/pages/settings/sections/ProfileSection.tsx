/**
 * ============================================================================
 * PROFILE SECTION - Settings
 * ============================================================================
 *
 * Section pour gérer les informations personnelles de l'utilisateur
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Save,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { toast } from 'sonner';
import type { User as UserData } from '@/features/users/types/user.types';
import userService from '@/features/users/services/userService';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileSectionProps {
  user: UserData | null;
}

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProfileSection = ({ user }: ProfileSectionProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      jobTitle: (user as { jobTitle?: string })?.jobTitle || '',
      department: (user as { department?: string })?.department || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setIsUpdating(true);
    try {
      await userService.updateUser(user.id, {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        jobTitle: data.jobTitle || undefined,
        department: data.department || undefined,
      });

      // Mettre à jour displayName si changé
      if (data.displayName && data.displayName !== user.displayName) {
        await userService.updateUser(user.id, {
          firstName: data.displayName.split(' ')[0] || data.firstName,
          lastName: data.displayName.split(' ').slice(1).join(' ') || data.lastName,
        });
      }

      toast.success('Profil mis à jour avec succès', {
        description: 'Vos informations ont été enregistrées',
      });

      // Réinitialiser le formulaire avec les nouvelles valeurs
      form.reset(data);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour', {
        description: error instanceof Error ? error.message : 'Veuillez réessayer',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3 px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm flex-shrink-0">
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-2xl truncate">Informations personnelles</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">
              Gérez vos informations de profil et vos coordonnées
            </CardDescription>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
                <span className="hidden sm:inline">Modifications non enregistrées</span>
                <span className="sm:hidden">Non enregistré</span>
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          {/* Informations principales */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-muted-foreground">
                Informations principales
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 group">
                <Label
                  htmlFor="displayName"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Nom d'affichage
                </Label>
                <Input
                  id="displayName"
                  {...register('displayName')}
                  placeholder="Comment souhaitez-vous être appelé ?"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">Visible par tous les utilisateurs</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />
                  Email
                </Label>
                <div className="relative">
                  <Input value={user?.email} disabled className="bg-muted/50 cursor-not-allowed" />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Votre prénom"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Votre nom"
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées professionnelles */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-muted-foreground">
                Coordonnées professionnelles
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Phone className="h-3.5 w-3.5 text-green-500" />
                  Téléphone
                </Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="+33 6 12 34 56 78"
                  className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                  Poste
                </Label>
                <Input
                  id="jobTitle"
                  {...register('jobTitle')}
                  placeholder="Votre fonction"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-3.5 w-3.5 text-orange-500" />
                  Département
                </Label>
                <Input
                  id="department"
                  {...register('department')}
                  placeholder="Votre département ou service"
                  className="transition-all duration-200 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Les modifications seront visibles immédiatement</span>
              <span className="sm:hidden">Visibles immédiatement</span>
            </p>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              size="lg"
              className="relative overflow-hidden group w-full sm:w-auto sm:min-w-[160px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  <span className="hidden sm:inline">Enregistrement...</span>
                  <span className="sm:hidden">Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2 transition-transform group-hover:scale-110" />
                  Enregistrer
                  {isDirty && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {Object.keys(form.formState.dirtyFields).length}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
