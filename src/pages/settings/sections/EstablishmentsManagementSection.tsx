/**
 * ============================================================================
 * ESTABLISHMENTS MANAGEMENT SECTION - Settings Page
 * ============================================================================
 *
 * Section for managing establishments:
 * - Establishment list overview
 * - Statistics (total establishments, total rooms)
 * - Create/edit/delete establishments
 *
 * Extracted from Settings.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DeleteEstablishmentDialog } from '@/features/establishments/components/DeleteEstablishmentDialog';
import { CreateEstablishmentDialog } from '@/features/establishments/components/CreateEstablishmentDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Building2,
  Loader2,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Building,
  Globe,
  Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Establishment, EstablishmentSummary } from '@/shared/types/establishment.types';

// ============================================================================
// COMPONENT
// ============================================================================

export const EstablishmentsManagementSection = () => {
  const navigate = useNavigate();
  const { establishments, isLoading, loadEstablishments } = useEstablishments();
  const { firebaseUser } = useAuth();
  const [deleteEstablishment, setDeleteEstablishment] = useState<EstablishmentSummary | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleDeleteSuccess = () => {
    toast.success('Établissement supprimé définitivement');
    setDeleteEstablishment(null);
    loadEstablishments();
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Gestion des établissements</CardTitle>
            </div>
            <CardDescription className="text-base">
              Gérez vos propriétés et leurs configurations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-muted-foreground">Chargement des établissements...</p>
          </div>
        ) : establishments.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 mb-4">
              <Building2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun établissement</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Créez votre premier établissement pour commencer à gérer vos propriétés
            </p>
            <Button
              onClick={() => navigate('/app/settings/establishment')}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <Plus size={18} className="mr-2" />
              Créer un établissement
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Établissements
                  </span>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {establishments.length}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">propriétés gérées</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Chambres totales
                  </span>
                  <Layout className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {establishments.reduce(
                    (sum: number, e: Establishment) => sum + (e.totalRooms || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  chambres disponibles
                </p>
              </div>
            </div>

            {/* Header avec bouton Créer */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mes établissements</h3>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              >
                <Plus size={16} className="mr-2" />
                Créer un établissement
              </Button>
            </div>

            {/* Liste d'établissements */}
            <div className="space-y-3">
              {establishments.map((establishment: Establishment) => (
                <div
                  key={establishment.id}
                  className="group p-4 border-2 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                        <Building2 size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg mb-1">{establishment.name}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            {establishment.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {(establishment as { city?: string }).city || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <Layout className="h-3.5 w-3.5" />
                            {establishment.totalRooms} chambres
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/app/settings/establishment')}
                        className="hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                      >
                        <Edit size={16} className="mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteEstablishment({
                            id: establishment.id,
                            name: establishment.name,
                            type: establishment.type,
                            category: establishment.category,
                            logoUrl: establishment.logoUrl,
                            isActive: establishment.isActive,
                            totalRooms: establishment.totalRooms,
                            city: establishment.address.city,
                          });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {deleteEstablishment && firebaseUser && (
          <DeleteEstablishmentDialog
            open={!!deleteEstablishment}
            onOpenChange={open => !open && setDeleteEstablishment(null)}
            establishment={deleteEstablishment}
            userId={firebaseUser.uid}
            onSuccess={handleDeleteSuccess}
          />
        )}

        <CreateEstablishmentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </CardContent>
    </Card>
  );
};
