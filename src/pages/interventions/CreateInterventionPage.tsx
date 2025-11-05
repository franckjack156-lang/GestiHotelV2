/**
 * CreateInterventionPage (Version Alternative)
 *
 * Page de création avec choix entre wizard et formulaire simple
 *
 * Destination: src/pages/interventions/CreateInterventionPage.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { InterventionWizard } from '@/features/interventions/components/wizard/InterventionWizard';
import { InterventionForm } from '@/features/interventions/components/form/InterventionForm';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

type FormMode = 'wizard' | 'simple' | null;

export const CreateInterventionPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const [mode, setMode] = useState<FormMode>(null);

  /**
   * Gérer le succès de la création
   */
  const handleSuccess = (interventionId: string) => {
    navigate(`/app/interventions/${interventionId}`);
  };

  /**
   * Gérer l'annulation
   */
  const handleCancel = () => {
    if (mode) {
      // Si on est dans un formulaire, revenir au choix
      setMode(null);
    } else {
      // Sinon retour à la liste
      navigate('/app/interventions');
    }
  };

  // Vérifier qu'un établissement est sélectionné
  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun établissement sélectionné</p>
          <Button variant="outline" onClick={() => navigate('/app/interventions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  // Afficher le choix du mode si aucun n'est sélectionné
  if (!mode) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/interventions')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nouvelle intervention
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Choisissez le mode de création qui vous convient
          </p>
        </div>

        {/* Choix du mode */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Mode Wizard */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500"
            onClick={() => setMode('wizard')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Wand2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Formulaire guidé (Recommandé)</CardTitle>
              </div>
              <CardDescription>Création étape par étape avec validation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>6 étapes claires et guidées</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Support multi-chambres</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Upload photos avec drag & drop</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Validation en temps réel</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Récapitulatif avant validation</span>
                </li>
              </ul>
              <Button className="w-full mt-4">Commencer</Button>
            </CardContent>
          </Card>

          {/* Mode Simple */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-gray-500"
            onClick={() => setMode('simple')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle>Formulaire rapide</CardTitle>
              </div>
              <CardDescription>Création rapide en une seule page</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Tous les champs sur une page</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Création plus rapide</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Idéal pour les utilisateurs expérimentés</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Vue d'ensemble complète</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Commencer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            💡 <strong>Conseil :</strong> Le formulaire guidé est recommandé pour les nouvelles
            interventions complexes ou si vous devez gérer plusieurs chambres. Le formulaire rapide
            est idéal pour les interventions simples.
          </p>
        </div>
      </div>
    );
  }

  // Afficher le formulaire sélectionné
  return (
    <div className="container mx-auto py-8 px-4">
      {mode === 'wizard' ? (
        <InterventionWizard onSuccess={handleSuccess} onCancel={handleCancel} />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Changer de mode
            </Button>
          </div>
          <InterventionForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      )}
    </div>
  );
};
