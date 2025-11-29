/**
 * ============================================================================
 * USER FORM COMPONENT
 * ============================================================================
 */

import React, { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { DynamicListMultiSelect } from '@/shared/components/forms/DynamicListMultiSelect';
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../types/role.types';
import type { User, UserProfile, CreateUserData, UpdateUserData } from '../types/user.types';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';
import { toast } from 'sonner';

// Mot de passe pour accéder au rôle éditeur (hash simple - en production, utiliser une solution plus sécurisée)
const EDITOR_PASSWORD = 'GestiHotel2024!';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const userSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .optional()
    .or(z.literal('')),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.nativeEnum(UserRole),
  isTechnician: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  experienceLevel: z.enum(['junior', 'intermediate', 'senior', 'expert']).optional(),
  photoURL: z.string().nullable().optional(),
  sendInvitation: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

interface UserFormProps {
  /** Utilisateur à éditer (undefined = création) */
  user?: User;
  /** Établissements disponibles */
  establishmentIds: string[];
  /** En cours de soumission */
  isSubmitting?: boolean;
  /** Callback soumission */
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  /** Callback annulation */
  onCancel?: () => void;
}

const UserFormComponent: React.FC<UserFormProps> = ({
  user,
  establishmentIds,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const isEditMode = !!user;

  // État pour l'URL de la photo (gérée par AvatarUpload)
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);

  // État pour le dialogue de mot de passe éditeur
  const [showEditorPasswordDialog, setShowEditorPasswordDialog] = useState(false);
  const [editorPassword, setEditorPassword] = useState('');
  const [editorPasswordError, setEditorPasswordError] = useState('');
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isEditorUnlocked, setIsEditorUnlocked] = useState(user?.role === UserRole.EDITOR);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isTechnician: user.isTechnician || false,
          phoneNumber: user.phoneNumber || '',
          jobTitle: (user as UserProfile).jobTitle || '',
          department: (user as UserProfile).department || '',
          skills: (user as UserProfile).skills || [],
          specialties: (user as UserProfile).specialties || [],
          experienceLevel: (user as UserProfile).experienceLevel || undefined,
          photoURL: user.photoURL || null,
        }
      : {
          role: UserRole.TECHNICIAN,
          isTechnician: false,
          sendInvitation: true,
          skills: [],
          specialties: [],
          photoURL: null,
        },
  });

  const selectedRole = watch('role');
  const isTechnician = watch('isTechnician');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  // Handler pour le changement de photo
  const handlePhotoChange = useCallback(
    (url: string | null) => {
      setPhotoURL(url);
      setValue('photoURL', url);
    },
    [setValue]
  );

  // Handler pour le changement de rôle avec vérification du mot de passe pour editor
  const handleRoleChange = useCallback(
    (value: string) => {
      const newRole = value as UserRole;

      // Si on veut passer en editor et qu'on n'a pas encore déverrouillé
      if (newRole === UserRole.EDITOR && !isEditorUnlocked) {
        setPendingRole(newRole);
        setEditorPassword('');
        setEditorPasswordError('');
        setShowEditorPasswordDialog(true);
        return;
      }

      // Sinon, on change directement le rôle
      setValue('role', newRole);
    },
    [isEditorUnlocked, setValue]
  );

  // Valider le mot de passe éditeur
  const handleEditorPasswordValidate = useCallback(() => {
    if (editorPassword === EDITOR_PASSWORD) {
      setIsEditorUnlocked(true);
      setShowEditorPasswordDialog(false);
      if (pendingRole) {
        setValue('role', pendingRole);
        setPendingRole(null);
      }
      toast.success('Rôle éditeur déverrouillé');
    } else {
      setEditorPasswordError('Mot de passe incorrect');
    }
  }, [editorPassword, pendingRole, setValue]);

  // Annuler le dialogue de mot de passe
  const handleEditorPasswordCancel = useCallback(() => {
    setShowEditorPasswordDialog(false);
    setEditorPassword('');
    setEditorPasswordError('');
    setPendingRole(null);
  }, []);

  /**
   * Gérer la soumission - memoized
   */
  const handleFormSubmit = useCallback(
    (data: UserFormData) => {
      if (isEditMode) {
        // Mode édition
        const updateData: UpdateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          phoneNumber: data.phoneNumber || undefined,
          jobTitle: data.jobTitle || undefined,
          department: data.department || undefined,
          skills: data.skills && data.skills.length > 0 ? data.skills : undefined,
          photoURL: data.photoURL || undefined,
          isTechnician: data.isTechnician,
          specialties:
            data.isTechnician && data.specialties && data.specialties.length > 0
              ? data.specialties
              : undefined,
          experienceLevel:
            data.isTechnician && data.experienceLevel ? data.experienceLevel : undefined,
        };

        onSubmit(updateData);
      } else {
        // Mode création
        const createData: CreateUserData = {
          email: data.email,
          password: data.password || 'ChangeMe123!', // Mot de passe par défaut
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          establishmentIds,
          phoneNumber: data.phoneNumber || undefined,
          jobTitle: data.jobTitle || undefined,
          department: data.department || undefined,
          skills: data.skills && data.skills.length > 0 ? data.skills : undefined,
          photoURL: data.photoURL || undefined,
          sendInvitation: data.sendInvitation,
          isTechnician: data.isTechnician,
          specialties:
            data.isTechnician && data.specialties && data.specialties.length > 0
              ? data.specialties
              : undefined,
          experienceLevel:
            data.isTechnician && data.experienceLevel ? data.experienceLevel : undefined,
        };

        onSubmit(createData);
      }
    },
    [isEditMode, establishmentIds, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informations personnelles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations personnelles</h3>

        {/* Photo de profil - en haut du formulaire */}
        {isEditMode && user?.id && (
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <AvatarUpload
              userId={user.id}
              currentPhotoURL={photoURL}
              displayName={`${firstName || ''} ${lastName || ''}`}
              onPhotoChange={handlePhotoChange}
              size="lg"
              disabled={isSubmitting}
            />
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-xs text-gray-500 mt-1">
                Cliquez sur l'avatar pour modifier la photo.
                <br />
                Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prénom */}
          <div>
            <Label htmlFor="firstName">
              Prénom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Jean"
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <Label htmlFor="lastName">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Dupont"
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="jean.dupont@hotel.fr"
            disabled={isEditMode} // Email non modifiable en édition
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {/* Mot de passe (création uniquement) */}
        {!isEditMode && (
          <div>
            <Label htmlFor="password">Mot de passe temporaire</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Min. 8 caractères"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Laisser vide pour générer un mot de passe aléatoire
            </p>
          </div>
        )}

        {/* Téléphone */}
        <div>
          <Label htmlFor="phoneNumber">Téléphone</Label>
          <Input
            id="phoneNumber"
            type="tel"
            {...register('phoneNumber')}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>

      <Separator />

      {/* Rôle et permissions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rôle et permissions</h3>

        {/* Rôle */}
        <div>
          <Label htmlFor="role">
            Rôle <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map(role => (
                <SelectItem key={role} value={role}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium flex items-center gap-1">
                      {role === UserRole.EDITOR && <Shield className="h-3 w-3 text-indigo-600" />}
                      {ROLE_LABELS[role]}
                      {role === UserRole.EDITOR && (
                        <span className="text-[10px] text-indigo-600 ml-1">(protégé)</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>}
        </div>

        {/* Checkbox Technicien */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isTechnician"
            checked={isTechnician}
            onCheckedChange={checked => setValue('isTechnician', checked as boolean)}
          />
          <Label htmlFor="isTechnician" className="text-sm font-normal cursor-pointer">
            Cet utilisateur est un technicien (peut recevoir des assignations d'interventions)
          </Label>
        </div>
      </div>

      <Separator />

      {/* Informations professionnelles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations professionnelles</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Titre/Poste */}
          <div>
            <Label htmlFor="jobTitle">Titre / Poste</Label>
            <Input
              id="jobTitle"
              {...register('jobTitle')}
              placeholder="Technicien de maintenance"
            />
          </div>

          {/* Département */}
          <div>
            <Label htmlFor="department">Département</Label>
            <DynamicListSelect
              listKey="staffDepartments"
              value={watch('department') || ''}
              onChange={(value: string) => setValue('department', value)}
              placeholder="Sélectionner un département"
            />
          </div>
        </div>

        {/* Compétences */}
        <div>
          <Label htmlFor="skills">Compétences</Label>
          <DynamicListMultiSelect
            listKey="staffSkills"
            value={watch('skills') || []}
            onChange={values => setValue('skills', values)}
            placeholder="Sélectionner des compétences"
            allowCustom={true}
          />
        </div>

        {/* Champs supplémentaires pour techniciens */}
        {isTechnician && (
          <>
            {/* Spécialités */}
            <div>
              <Label htmlFor="specialties">Spécialités techniques</Label>
              <DynamicListMultiSelect
                listKey="technicalSpecialties"
                value={watch('specialties') || []}
                onChange={values => setValue('specialties', values)}
                placeholder="Sélectionner des spécialités techniques"
                allowCustom={true}
              />
            </div>

            {/* Niveau d'expérience */}
            <div>
              <Label htmlFor="experienceLevel">Niveau d'expérience</Label>
              <Select
                value={watch('experienceLevel') || ''}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onValueChange={value => setValue('experienceLevel', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 ans)</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire (2-5 ans)</SelectItem>
                  <SelectItem value="senior">Senior (5-10 ans)</SelectItem>
                  <SelectItem value="expert">Expert (10+ ans)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Invitation (création uniquement) */}
      {!isEditMode && (
        <>
          <Separator />
          <div className="flex items-center space-x-2">
            <Checkbox id="sendInvitation" {...register('sendInvitation')} defaultChecked />
            <Label htmlFor="sendInvitation" className="cursor-pointer">
              Envoyer un email d'invitation à l'utilisateur
            </Label>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Mettre à jour' : "Créer l'utilisateur"}
        </Button>
      </div>

      {/* Dialog de mot de passe pour le rôle éditeur */}
      <Dialog open={showEditorPasswordDialog} onOpenChange={setShowEditorPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Accès protégé
            </DialogTitle>
            <DialogDescription>
              Le rôle <strong>Éditeur</strong> donne un accès complet à l'application, incluant la
              gestion du support technique externe. Veuillez entrer le mot de passe pour
              déverrouiller ce rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Ce rôle est réservé au développeur/propriétaire de l'application.
              </p>
            </div>
            <div>
              <Label htmlFor="editorPassword">Mot de passe</Label>
              <Input
                id="editorPassword"
                type="password"
                value={editorPassword}
                onChange={e => {
                  setEditorPassword(e.target.value);
                  setEditorPasswordError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditorPasswordValidate();
                  }
                }}
                placeholder="Entrez le mot de passe éditeur"
                className={editorPasswordError ? 'border-red-500' : ''}
                autoFocus
              />
              {editorPasswordError && (
                <p className="text-sm text-red-500 mt-1">{editorPasswordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleEditorPasswordCancel}>
              Annuler
            </Button>
            <Button type="button" onClick={handleEditorPasswordValidate} disabled={!editorPassword}>
              <Shield className="mr-2 h-4 w-4" />
              Déverrouiller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

UserFormComponent.displayName = 'UserForm';

export const UserForm = memo(UserFormComponent);
