/**
 * ============================================================================
 * USER FORM COMPONENT
 * ============================================================================
 */

import React, { useEffect } from 'react';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';
import {
  UserRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from '../types/role.types';
import type { User, CreateUserData, UpdateUserData } from '../types/user.types';
import { Loader2 } from 'lucide-react';

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
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  skills: z.string().optional(), // Sera converti en array
  photoURL: z.string().url('URL invalide').optional().or(z.literal('')),
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

export const UserForm: React.FC<UserFormProps> = ({
  user,
  establishmentIds,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const isEditMode = !!user;

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
          phoneNumber: user.phoneNumber || '',
          jobTitle: user.jobTitle || '',
          department: user.department || '',
          skills: user.skills?.join(', ') || '',
          photoURL: user.photoURL || '',
        }
      : {
          role: UserRole.TECHNICIAN,
          sendInvitation: true,
        },
  });

  const selectedRole = watch('role');

  /**
   * Gérer la soumission
   */
  const handleFormSubmit = (data: UserFormData) => {
    const skills = data.skills
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isEditMode) {
      // Mode édition
      const updateData: UpdateUserData = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phoneNumber: data.phoneNumber || undefined,
        jobTitle: data.jobTitle || undefined,
        department: data.department || undefined,
        skills: skills,
        photoURL: data.photoURL || undefined,
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
        skills: skills,
        photoURL: data.photoURL || undefined,
        sendInvitation: data.sendInvitation,
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informations personnelles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations personnelles</h3>

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
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Photo URL */}
          <div>
            <Label htmlFor="photoURL">URL Photo de profil</Label>
            <Input
              id="photoURL"
              type="url"
              {...register('photoURL')}
              placeholder="https://..."
              className={errors.photoURL ? 'border-red-500' : ''}
            />
            {errors.photoURL && (
              <p className="text-sm text-red-500 mt-1">{errors.photoURL.message}</p>
            )}
          </div>
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
          <Select
            value={selectedRole}
            onValueChange={(value) => setValue('role', value as UserRole)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABELS[role]}</span>
                    <span className="text-xs text-gray-500">
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
          )}
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
            <Input
              id="department"
              {...register('department')}
              placeholder="Maintenance"
            />
          </div>
        </div>

        {/* Compétences */}
        <div>
          <Label htmlFor="skills">Compétences</Label>
          <Textarea
            id="skills"
            {...register('skills')}
            placeholder="Plomberie, Électricité, Climatisation (séparées par des virgules)"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Séparer les compétences par des virgules
          </p>
        </div>
      </div>

      {/* Invitation (création uniquement) */}
      {!isEditMode && (
        <>
          <Separator />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendInvitation"
              {...register('sendInvitation')}
              defaultChecked
            />
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
          {isEditMode ? 'Mettre à jour' : 'Créer l\'utilisateur'}
        </Button>
      </div>
    </form>
  );
};
