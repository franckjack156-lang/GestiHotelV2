/**
 * UserProfilePage - Page de profil utilisateur complète
 *
 * Affiche toutes les informations détaillées d'un utilisateur
 * Support spécial pour les techniciens avec leurs interventions
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Award,
  Wrench,
  Shield,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

import { UserAvatar, RoleBadge, StatusBadge, UserDeleteDialog } from '@/features/users/components';
import { useUser, useUserActions } from '@/features/users/hooks/useUsers';
import type { UserProfile } from '@/features/users/types/user.types';
import { toDate } from '@/shared/utils/dateUtils';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: userData, isLoading } = useUser(id);
  const { deleteUser, toggleActive, isDeleting } = useUserActions();

  // Cast user to UserProfile for extended properties
  const user = userData as UserProfile | undefined;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Utilisateur introuvable</h3>
        <Button variant="outline" onClick={() => navigate('/app/users')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    const success = await deleteUser(user.id);
    if (success) {
      toast.success('Utilisateur supprimé');
      navigate('/app/users');
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async () => {
    const success = await toggleActive(user.id, !user.isActive);
    if (success) {
      toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil utilisateur</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            {user.isActive ? (
              <>
                <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                Désactiver
              </>
            ) : (
              <>
                <Power className="mr-1.5 h-3.5 w-3.5" />
                Activer
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/users/${user.id}/edit`)}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Modifier
          </Button>

          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Header profil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <UserAvatar
              photoURL={user.photoURL}
              displayName={user.displayName}
              size="lg"
              className="flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <StatusBadge status={user.status} />
                {user.isTechnician && (
                  <Badge className="bg-blue-600 gap-1">
                    <Wrench className="h-3 w-3" />
                    Technicien
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {user.phoneNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={user.role} />
                {user.jobTitle && (
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {user.jobTitle}
                  </Badge>
                )}
                {user.department && <Badge variant="outline">{user.department}</Badge>}
              </div>

              {user.bio && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <UserIcon className="h-3.5 w-3.5 mr-1.5" />
            Informations générales
          </TabsTrigger>
          {user.isTechnician && (
            <TabsTrigger value="technical">
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
              Compétences techniques
            </TabsTrigger>
          )}
          <TabsTrigger value="activity">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Activité
          </TabsTrigger>
        </TabsList>

        {/* TAB: Informations générales */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Coordonnées */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                  {user.emailVerified && (
                    <Badge variant="secondary" className="mt-1 h-4 text-[10px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>

                {user.phoneNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                    <p className="font-medium">{user.phoneNumber}</p>
                  </div>
                )}

                {user.location && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Localisation</p>
                    <p className="font-medium">{user.location}</p>
                  </div>
                )}

                {user.address && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Adresse</p>
                    <p className="font-medium">
                      {user.address.street}
                      <br />
                      {user.address.postalCode} {user.address.city}
                      {user.address.state && `, ${user.address.state}`}
                      <br />
                      {user.address.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations professionnelles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Informations professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rôle</p>
                  <RoleBadge role={user.role} />
                </div>

                {user.jobTitle && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Poste</p>
                    <p className="font-medium">{user.jobTitle}</p>
                  </div>
                )}

                {user.department && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Département</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                )}

                {user.isTechnician && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type d'utilisateur</p>
                    <Badge className="bg-blue-600">
                      <Wrench className="h-3 w-3 mr-1" />
                      Technicien certifié
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates importantes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Membre depuis</p>
                  <p className="font-medium">
                    {user.createdAt
                      ? format(toDate(user.createdAt), 'PPP', { locale: fr })
                      : 'Non disponible'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Dernière connexion</p>
                  <p className="font-medium">
                    {user.lastLoginAt
                      ? format(toDate(user.lastLoginAt), 'PPP à HH:mm', { locale: fr })
                      : 'Jamais connecté'}
                  </p>
                </div>

                {user.birthDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date de naissance</p>
                    <p className="font-medium">
                      {format(toDate(user.birthDate), 'PPP', { locale: fr })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact d'urgence */}
            {user.emergencyContact && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Contact d'urgence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nom</p>
                    <p className="font-medium">{user.emergencyContact.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Relation</p>
                    <p className="font-medium">{user.emergencyContact.relationship}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                    <p className="font-medium">{user.emergencyContact.phoneNumber}</p>
                  </div>

                  {user.emergencyContact.email && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{user.emergencyContact.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB: Compétences techniques */}
        {user.isTechnician && (
          <TabsContent value="technical" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Compétences */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Compétences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune compétence renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Spécialités */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Spécialités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.specialties && user.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.specialties.map((specialty, index) => (
                        <Badge key={index} className="bg-indigo-600">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune spécialité renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.certifications && user.certifications.length > 0 ? (
                    <ul className="space-y-2">
                      {user.certifications.map((cert, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune certification renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Niveau d'expérience */}
              {user.experienceLevel && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Niveau d'expérience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={
                        user.experienceLevel === 'expert'
                          ? 'bg-purple-600'
                          : user.experienceLevel === 'senior'
                            ? 'bg-blue-600'
                            : user.experienceLevel === 'intermediate'
                              ? 'bg-green-600'
                              : 'bg-gray-600'
                      }
                    >
                      {user.experienceLevel === 'expert' && 'Expert'}
                      {user.experienceLevel === 'senior' && 'Senior'}
                      {user.experienceLevel === 'intermediate' && 'Intermédiaire'}
                      {user.experienceLevel === 'junior' && 'Junior'}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {/* TAB: Activité */}
        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Historique d'activité à venir
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de suppression */}
      <UserDeleteDialog
        open={showDeleteDialog}
        user={user}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
