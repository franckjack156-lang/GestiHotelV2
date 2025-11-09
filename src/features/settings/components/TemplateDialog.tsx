/**
 * ============================================================================
 * TEMPLATE DIALOG - VERSION AVEC AUTO-DÉTECTION DES IDS
 * ============================================================================
 *
 * Dialog qui récupère automatiquement l'establishmentId depuis les hooks
 *
 * Destination: src/features/settings/components/TemplateDialog.tsx
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import {
  Building,
  Palmtree,
  Users,
  CheckCircle2,
  Loader2,
  Info,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getAvailableTemplates, applyTemplate } from '@/shared/services/listTemplatesService';
import { cn } from '@/shared/utils/cn';

interface TemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  establishmentId: string;
  userId: string;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onClose,
  onSuccess,
  establishmentId,
  userId,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = getAvailableTemplates();

  const handleApply = async () => {
    alert('🔥 TEST - La fonction est appelée !'); // ← AJOUTEZ CECI
    console.log('🔥 HANDLEAPPLY APPELÉ !');
    console.log('🔥 selectedTemplateId:', selectedTemplateId);

    if (!selectedTemplateId) return;

    console.log('🎯 [TemplateDialog] Début application');
    console.log('  - Template ID:', selectedTemplateId);
    console.log('  - Establishment ID:', establishmentId);
    console.log('  - User ID:', userId);

    // Vérifications
    if (!establishmentId || establishmentId === '') {
      const errorMsg = 'Establishment ID manquant ou vide';
      console.error('❌ [TemplateDialog]', errorMsg);
      setError(errorMsg);
      alert(
        `ERREUR: ${errorMsg}\n\nVérifiez que vous avez bien passé l'establishmentId au dialog.`
      );
      return;
    }

    if (!userId || userId === '') {
      const errorMsg = 'User ID manquant ou vide';
      console.error('❌ [TemplateDialog]', errorMsg);
      setError(errorMsg);
      alert(`ERREUR: ${errorMsg}\n\nVérifiez que vous avez bien passé le userId au dialog.`);
      return;
    }

    setIsApplying(true);
    setResult(null);
    setError(null);

    try {
      console.log('⏳ [TemplateDialog] Application en cours...');
      const res = await applyTemplate(establishmentId, userId, selectedTemplateId);

      console.log('✅ [TemplateDialog] Succès !');
      console.log('  - Items ajoutés:', res.added);
      console.log('  - Items ignorés:', res.skipped);

      setResult(res);

      // Attendre 2 secondes pour montrer le résultat
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ [TemplateDialog] Erreur:', error);
      setError(error.message);
      alert(
        `Erreur lors de l'application du template:\n\n${error.message}\n\nConsultez la console (F12) pour plus de détails.`
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (!isApplying) {
      setSelectedTemplateId(null);
      setResult(null);
      setError(null);
      onClose();
    }
  };

  // Map des icônes
  const iconMap: Record<string, any> = {
    Building,
    Palmtree,
    Users,
  };

  // Map des couleurs
  const colorMap: Record<string, string> = {
    blue: '#3B82F6',
    purple: '#A855F7',
    green: '#10B981',
    gray: '#6B7280',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Appliquer un template
          </DialogTitle>
          <DialogDescription>
            Pré-remplissez vos listes avec des valeurs standards adaptées à votre type
            d'établissement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Debug info (visible seulement si problème) */}
          {(!establishmentId || !userId) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>⚠️ Paramètres manquants</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {!establishmentId && <li>Establishment ID manquant</li>}
                  {!userId && <li>User ID manquant</li>}
                </ul>
                <p className="mt-2 text-xs">
                  Vérifiez que vous avez bien passé ces paramètres au composant TemplateDialog.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Erreur */}
          {error && !result && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Liste des templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => {
              const Icon = iconMap[template.icon] || Building;
              const isSelected = selectedTemplateId === template.id;

              return (
                <Card
                  key={template.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:shadow-md',
                    isSelected && 'ring-2 ring-blue-500 bg-blue-50'
                  )}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: colorMap[template.color] + '20' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: colorMap[template.color] }} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.itemCount} items
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(template.lists).length} listes
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info box */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>💡 Comment ça marche ?</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Sélectionnez un template adapté à votre établissement</li>
                <li>Les items existants ne seront pas modifiés</li>
                <li>Seuls les nouveaux items seront ajoutés</li>
                <li>Vous pourrez les personnaliser ensuite</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                ⏱️ L'application peut prendre 10-30 secondes selon le nombre d'items
              </p>
            </AlertDescription>
          </Alert>

          {/* Résultat de l'application */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Template appliqué avec succès !</AlertTitle>
              <AlertDescription className="text-green-800">
                <div className="mt-2 space-y-1">
                  <p>✅ {result.added} nouveaux items ajoutés</p>
                  {result.skipped > 0 && <p>⏭️ {result.skipped} items déjà existants ignorés</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isApplying}>
            {result ? 'Fermer' : 'Annuler'}
          </Button>
          {!result && (
            <Button
              onClick={handleApply}
              disabled={!selectedTemplateId || isApplying || !establishmentId || !userId}
              className="gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Application en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Appliquer le template
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
