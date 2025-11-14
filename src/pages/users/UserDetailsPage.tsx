/**
 * ============================================================================
 * USER DETAILS PAGE - PAGE DE DÉTAILS UTILISATEUR
 * ============================================================================
 *
 * Page complète et moderne pour afficher tous les détails d'un utilisateur
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { UserAvatar, RoleBadge, StatusBadge, UserDeleteDialog } from '@/features/users/components';
import { useUser, useUserActions } from '@/features/users/hooks/useUsers';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  Clock,
  Shield,
  Award,
  Wrench,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useUser(id);
  const { deleteUser, toggleActive, isDeleting } = useUserActions();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Utilisateur introuvable</div>;
  }

  /**
   * Gérer la suppression
   */
  const handleDelete = async () => {
    const success = await deleteUser(user.id);
    if (success) {
      toast.success('Utilisateur supprimé');
      navigate('/app/users');
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  /**
   * Gérer toggle active
   */
  const handleToggleActive = async () => {
    const success = await toggleActive(user.id, !user.isActive);
    if (success) {
      toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header moderne */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                <RoleBadge role={user.role} />
                {user.isTechnician && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Wrench className="h-3 w-3 mr-1" />
                    Technicien
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Email vérifié
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" onClick={handleToggleActive}>
              {user.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => navigate(`/app/users/${user.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>

            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Profil */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar et infos principales */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <UserAvatar user={user} size="2xl" className="mb-4" />
                <h2 className="text-xl font-bold mb-1">{user.displayName}</h2>
                {user.jobTitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{user.jobTitle}</p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Contacts */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="break-all">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Dates importantes */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400">Membre depuis</p>
                    <p className="font-medium">
                      {user.createdAt ? format(user.createdAt.toDate(), 'PPP', { locale: fr }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400">Dernière connexion</p>
                    <p className="font-medium">
                      {user.lastLoginAt
                        ? format(user.lastLoginAt.toDate(), 'PPP à HH:mm', { locale: fr })
                        : 'Jamais'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite - Détails */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations professionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informations professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Titre / Poste</p>
                  <p className="font-medium">{user.jobTitle || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Département</p>
                  <p className="font-medium">{user.department || 'Non renseigné'}</p>
                </div>
              </div>

              {/* Assignable aux interventions */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Assignation aux interventions
                </p>
                {user.isTechnician ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Peut être assigné aux interventions
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Ne peut pas être assigné aux interventions
                  </Badge>
                )}
              </div>

              {user.skills && user.skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Compétences</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations technicien (si applicable) */}
          {user.isTechnician && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Profil technicien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.experienceLevel && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Niveau d'expérience
                    </p>
                    <Badge className="text-sm">
                      {user.experienceLevel === 'junior' && 'Junior (0-2 ans)'}
                      {user.experienceLevel === 'intermediate' && 'Intermédiaire (2-5 ans)'}
                      {user.experienceLevel === 'senior' && 'Senior (5-10 ans)'}
                      {user.experienceLevel === 'expert' && 'Expert (10+ ans)'}
                    </Badge>
                  </div>
                )}

                {user.specialties && user.specialties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Spécialités techniques
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-950">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rôle et permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle et permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rôle</p>
                <RoleBadge role={user.role} />
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Statut du compte</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                  {user.emailVerified ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Email vérifié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Email non vérifié
                    </Badge>
                  )}
                </div>
              </div>

              {user.establishmentIds && user.establishmentIds.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Établissements accessibles
                  </p>
                  <p className="text-sm">
                    {user.establishmentIds.length}{' '}
                    {user.establishmentIds.length > 1 ? 'établissements' : 'établissement'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métadonnées système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">ID Utilisateur</p>
                  <p className="font-mono text-xs break-all">{user.id}</p>
                </div>
                {user.createdBy && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Créé par</p>
                    <p className="font-mono text-xs">{user.createdBy}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Date de création</p>
                  <p className="text-xs">
                    {user.createdAt
                      ? format(user.createdAt.toDate(), 'PPP à HH:mm', { locale: fr })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Dernière modification</p>
                  <p className="text-xs">
                    {user.updatedAt
                      ? format(user.updatedAt.toDate(), 'PPP à HH:mm', { locale: fr })
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de suppression */}
      <UserDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        userName={user.displayName}
        isDeleting={isDeleting}
      />
    </div>
  );
};
