/**
 * ============================================================================
 * ESTABLISHMENTS PAGES - CRUD COMPLET
 * ============================================================================
 *
 * Toutes les pages établissements dans un seul fichier :
 * - Liste établissements
 * - Création établissement
 * - Modification établissement
 * - Détails établissement
 * - Switch établissement (header)
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  Settings,
  Check,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  DataTable,
  EmptyState,
  ConfirmDialog,
  LoadingSkeleton,
} from '@/shared/components/ui-extended';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { toast } from 'sonner';
import type { Establishment, CreateEstablishmentData } from '@/shared/types/establishment.types';
import { EstablishmentType } from '@/shared/types/establishment.types';
import { initializeEstablishmentLists } from '@/features/establishments/services/establishmentInitService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const establishmentSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  type: z.nativeEnum(EstablishmentType, { message: 'Le type est requis' }),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().min(4, 'Le code postal est requis'),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  description: z.string().optional(),
  totalRooms: z.number().min(1, 'Le nombre de chambres est requis').optional(),
});

type EstablishmentFormData = z.infer<typeof establishmentSchema>;

// ============================================================================
// LISTE ÉTABLISSEMENTS
// ============================================================================

export const EstablishmentsListPage = () => {
  const navigate = useNavigate();
  const { establishments, isLoading, deleteEstablishment } = useEstablishments();
  const { establishmentId, setEstablishmentId } = useCurrentEstablishment();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteEstablishment(deleteId);
      toast.success('Établissement supprimé');
      setDeleteId(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (item: Establishment) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <Building2 className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-gray-500">{item.address.city}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Adresse',
      render: (item: Establishment) => (
        <div className="text-sm">
          <p>{item.address.street}</p>
          <p className="text-gray-500">
            {item.address.postalCode} {item.address.city}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (item: Establishment) => (
        <div className="text-sm space-y-1">
          {item.contact.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              <span>{item.contact.phone}</span>
            </div>
          )}
          {item.contact.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <span>{item.contact.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      render: (item: Establishment) => (
        <div className="flex items-center gap-2">
          {establishmentId === item.id && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
              <Check size={12} />
              Actif
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/app/establishments/${item.id}/edit`)}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Établissements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos différents établissements
          </p>
        </div>
        <Button onClick={() => navigate('/app/establishments/create')}>
          <Plus size={16} className="mr-2" />
          Nouvel établissement
        </Button>
      </div>

      {establishments.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} />}
          title="Aucun établissement"
          description="Créez votre premier établissement pour commencer"
          action={{
            label: 'Créer un établissement',
            onClick: () => navigate('/app/establishments/create'),
          }}
        />
      ) : (
        <DataTable
          data={establishments}
          columns={columns}
          onRowClick={item => setEstablishmentId(item.id)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'établissement"
        description="Êtes-vous sûr ? Toutes les données associées seront perdues."
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// ============================================================================
// FORMULAIRE ÉTABLISSEMENT (CREATE/EDIT)
// ============================================================================

interface EstablishmentFormProps {
  establishment?: Establishment;
  onSubmit: (data: EstablishmentFormData) => Promise<void>;
  isLoading?: boolean;
}

const EstablishmentForm = ({ establishment, onSubmit, isLoading }: EstablishmentFormProps) => {
  const navigate = useNavigate();

  const form = useForm<EstablishmentFormData>({
    resolver: zodResolver(establishmentSchema) as any,
    defaultValues: (establishment as any) || {
      country: 'France',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const typeValue = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nom de l'établissement *</Label>
          <Input {...register('name')} placeholder="Ex: Hôtel Paris Centre" />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="type">Type d'établissement *</Label>
          <Select
            value={typeValue}
            onValueChange={value => setValue('type', value as EstablishmentType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EstablishmentType.HOTEL}>Hôtel</SelectItem>
              <SelectItem value={EstablishmentType.RESORT}>Resort</SelectItem>
              <SelectItem value={EstablishmentType.MOTEL}>Motel</SelectItem>
              <SelectItem value={EstablishmentType.HOSTEL}>Auberge</SelectItem>
              <SelectItem value={EstablishmentType.APARTMENT}>Appartement</SelectItem>
              <SelectItem value={EstablishmentType.OTHER}>Autre</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <Label htmlFor="totalRooms">Nombre de chambres *</Label>
          <Input type="number" {...register('totalRooms')} placeholder="Ex: 50" />
          {errors.totalRooms && (
            <p className="text-sm text-red-600 mt-1">{errors.totalRooms.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea {...register('description')} placeholder="Décrivez l'établissement" rows={3} />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address">Adresse *</Label>
          <Input {...register('address')} placeholder="Ex: 123 rue de la Paix" />
          {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input {...register('city')} placeholder="Ex: Paris" />
          {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
        </div>

        <div>
          <Label htmlFor="postalCode">Code postal *</Label>
          <Input {...register('postalCode')} placeholder="Ex: 75001" />
          {errors.postalCode && (
            <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Pays</Label>
          <Input {...register('country')} />
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input {...register('phone')} placeholder="Ex: 01 23 45 67 89" />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input {...register('email')} type="email" placeholder="Ex: contact@hotel.com" />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate('/app/establishments')}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : establishment ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// PAGE CRÉATION
// ============================================================================

export const CreateEstablishmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createEstablishment } = useEstablishments();
  const [isCreating, setIsCreating] = useState(false);
  const [isInitializingLists, setIsInitializingLists] = useState(false);
  const [createdEstablishmentId, setCreatedEstablishmentId] = useState<string | null>(null);

  const handleSubmit = async (data: EstablishmentFormData) => {
    setIsCreating(true);
    try {
      // Transform form data to CreateEstablishmentData
      const createData: CreateEstablishmentData = {
        name: data.name,
        type: data.type,
        totalRooms: data.totalRooms || 10,
        description: data.description,
        address: {
          street: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country || 'France',
        },
        contact: {
          email: data.email || '',
          phone: data.phone || '',
        },
      };

      const id = await createEstablishment(createData);
      if (id) {
        setCreatedEstablishmentId(id);
        toast.success('Établissement créé avec succès');
      }
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInitializeLists = async () => {
    if (!createdEstablishmentId || !user) return;

    setIsInitializingLists(true);
    try {
      await initializeEstablishmentLists(createdEstablishmentId, user.id);
      toast.success('Listes déroulantes initialisées avec succès');
      navigate('/app/establishments');
    } catch {
      toast.error("Erreur lors de l'initialisation des listes");
    } finally {
      setIsInitializingLists(false);
    }
  };

  const handleSkipInitialization = () => {
    navigate('/app/establishments');
  };

  // Si l'établissement vient d'être créé, afficher le dialogue d'initialisation
  if (createdEstablishmentId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-green-600" />
              Établissement créé avec succès
            </CardTitle>
            <CardDescription>
              Voulez-vous initialiser les listes déroulantes par défaut ?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Que contiennent les listes par défaut ?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Types d'interventions (Plomberie, Électricité, Climatisation, etc.)</li>
                <li>Catégories (Maintenance, Réparation, Installation, etc.)</li>
                <li>Priorités (Basse, Normale, Haute, Urgente, Critique)</li>
                <li>Statuts d'interventions</li>
                <li>Localisations (Chambre, Couloir, Hall, Cuisine, etc.)</li>
                <li>Et bien d'autres listes essentielles...</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleSkipInitialization}
                disabled={isInitializingLists}
              >
                Ignorer pour le moment
              </Button>
              <Button onClick={handleInitializeLists} disabled={isInitializingLists}>
                {isInitializingLists ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Initialisation...
                  </>
                ) : (
                  <>
                    <ListChecks className="mr-2 h-4 w-4" />
                    Initialiser les listes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvel établissement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Créez un nouvel établissement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'établissement</CardTitle>
          <CardDescription>Remplissez les informations de base</CardDescription>
        </CardHeader>
        <CardContent>
          <EstablishmentForm onSubmit={handleSubmit} isLoading={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// PAGE ÉDITION
// ============================================================================

export const EditEstablishmentPage = () => {
  const navigate = useNavigate();
  const { establishments, updateEstablishment } = useEstablishments();
  const [isUpdating, setIsUpdating] = useState(false);

  // TODO: Récupérer l'ID depuis les params et trouver l'établissement
  const establishment = establishments[0]; // Placeholder

  const handleSubmit = async (data: EstablishmentFormData) => {
    if (!establishment) return;

    setIsUpdating(true);
    try {
      await updateEstablishment(establishment.id, data as any);
      toast.success('Établissement modifié');
      navigate('/app/establishments');
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!establishment) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Établissement introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier l'établissement</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{establishment.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'établissement</CardTitle>
        </CardHeader>
        <CardContent>
          <EstablishmentForm
            establishment={establishment}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// SWITCH ÉTABLISSEMENT (Pour Header)
// ============================================================================

export const EstablishmentSwitcher = () => {
  const { establishments, isLoading } = useEstablishments();
  const { establishmentId, setEstablishmentId } = useCurrentEstablishment();
  const [isOpen, setIsOpen] = useState(false);

  const currentEstablishment = establishments.find(e => e.id === establishmentId);

  if (isLoading || establishments.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="w-64">
        <Building2 size={16} className="mr-2" />
        <span className="truncate">
          {currentEstablishment?.name || 'Sélectionner un établissement'}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            {establishments.map(establishment => (
              <button
                key={establishment.id}
                onClick={() => {
                  setEstablishmentId(establishment.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  establishment.id === establishmentId ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {establishment.id === establishmentId && (
                    <Check size={16} className="text-indigo-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{establishment.name}</p>
                    <p className="text-xs text-gray-500">
                      {establishment.address?.city || 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PAGE DÉTAILS (LECTURE SEULE)
// ============================================================================

export const EstablishmentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { establishments, isLoading } = useEstablishments();

  const establishment = establishments.find(e => e.id === id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="Établissement introuvable"
          description="Cet établissement n'existe pas ou a été supprimé"
          action={{
            label: 'Retour à la liste',
            onClick: () => navigate('/app/establishments'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{establishment.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Détails de l'établissement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/app/settings/establishment')}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
          <Button onClick={() => navigate(`/app/establishments/${establishment.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-600 dark:text-gray-400">Nom</Label>
              <p className="text-lg font-medium mt-1">{establishment.name}</p>
            </div>
            <div>
              <Label className="text-gray-600 dark:text-gray-400">Type</Label>
              <p className="text-lg font-medium mt-1 capitalize">{establishment.type}</p>
            </div>
          </div>

          {establishment.description && (
            <div>
              <Label className="text-gray-600 dark:text-gray-400">Description</Label>
              <p className="text-base mt-1">{establishment.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-600 dark:text-gray-400">Nombre de chambres</Label>
              <p className="text-lg font-medium mt-1">{establishment.totalRooms}</p>
            </div>
            {establishment.totalFloors && (
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Nombre d'étages</Label>
                <p className="text-lg font-medium mt-1">{establishment.totalFloors}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adresse et contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-base">{establishment.address.street}</p>
              <p className="text-base">
                {establishment.address.postalCode} {establishment.address.city}
              </p>
              <p className="text-base">{establishment.address.country}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {establishment.contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <a
                  href={`tel:${establishment.contact.phone}`}
                  className="text-base hover:underline"
                >
                  {establishment.contact.phone}
                </a>
              </div>
            )}
            {establishment.contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a
                  href={`mailto:${establishment.contact.email}`}
                  className="text-base hover:underline"
                >
                  {establishment.contact.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      {establishment.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Interventions totales</Label>
                <p className="text-2xl font-bold mt-1">{establishment.stats.totalInterventions}</p>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">En attente</Label>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {establishment.stats.pendingInterventions}
                </p>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Complétées</Label>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {establishment.stats.completedInterventions}
                </p>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400">Utilisateurs actifs</Label>
                <p className="text-2xl font-bold mt-1">{establishment.stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  EstablishmentsListPage,
  CreateEstablishmentPage,
  EditEstablishmentPage,
  EstablishmentDetailPage,
  EstablishmentSwitcher,
};
