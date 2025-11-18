/**
 * ============================================================================
 * GENERATE FLOORS DIALOG
 * ============================================================================
 *
 * Dialog pour générer automatiquement les étages d'un établissement
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Loader2, Building, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import type { FloorGenerationOptions } from '@/shared/services/floorsGenerator';
import { generateFloors } from '@/shared/services/floorsGenerator';
import { addItem, deleteItem, getList } from '@/shared/services/referenceListsService';
import type { ReferenceItem } from '@/shared/types/reference-lists.types';

interface GenerateFloorsDialogProps {
  open: boolean;
  onClose: () => void;
  establishmentId: string;
  userId: string;
  defaultTotalFloors?: number;
  onSuccess?: () => void;
}

export const GenerateFloorsDialog = ({
  open,
  onClose,
  establishmentId,
  userId,
  defaultTotalFloors = 0,
  onSuccess,
}: GenerateFloorsDialogProps) => {
  const [existingFloors, setExistingFloors] = useState<ReferenceItem[]>([]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Charger les étages existants pour CET établissement spécifiquement
  useEffect(() => {
    if (open && establishmentId) {
      const loadFloors = async () => {
        setIsLoadingFloors(true);
        try {
          const lists = await getList(establishmentId, 'floors');
          setExistingFloors(lists?.items || []);
        } catch (err) {
          console.error('Erreur chargement étages:', err);
          setExistingFloors([]);
        } finally {
          setIsLoadingFloors(false);
        }
      };
      loadFloors();
    }
  }, [open, establishmentId]);

  // Configuration
  const [totalFloors, setTotalFloors] = useState(defaultTotalFloors);
  const [includeBasements, setIncludeBasements] = useState(false);
  const [basementCount, setBasementCount] = useState(1);
  const [includeGroundFloor, setIncludeGroundFloor] = useState(true);
  const [groundFloorLabel, setGroundFloorLabel] = useState('Rez-de-chaussée');
  const [prefix, setPrefix] = useState('');
  const [format, setFormat] = useState<'numeric' | 'ordinal'>('numeric');
  const [deleteExisting, setDeleteExisting] = useState(false);

  // Aperçu
  const preview = useMemo(() => {
    if (totalFloors === 0) return [];

    const options: FloorGenerationOptions = {
      totalFloors,
      includeBasements,
      basementCount: includeBasements ? basementCount : 0,
      includeGroundFloor,
      groundFloorLabel,
      prefix,
      format,
    };

    return generateFloors(options);
  }, [
    totalFloors,
    includeBasements,
    basementCount,
    includeGroundFloor,
    groundFloorLabel,
    prefix,
    format,
  ]);

  const handleGenerate = async () => {
    if (totalFloors === 0) {
      setError('Veuillez indiquer le nombre d\'étages');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Supprimer les étages existants si demandé
      if (deleteExisting && existingFloors.length > 0) {
        for (const floor of existingFloors) {
          await deleteItem(establishmentId, userId, 'floors', floor.id);
        }
      }

      // Générer les nouveaux étages
      for (const floor of preview) {
        await addItem(establishmentId, userId, 'floors', {
          value: floor.value,
          label: floor.label,
          color: floor.color,
          icon: floor.icon,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur génération étages:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Générer les étages automatiquement
          </DialogTitle>
          <DialogDescription>
            Configurez les étages de votre établissement. Les étages seront ajoutés à la liste de
            référence.
          </DialogDescription>
        </DialogHeader>

        {isLoadingFloors ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des étages existants...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Nombre d'étages */}
          <div className="space-y-2">
            <Label htmlFor="totalFloors">
              Nombre d'étages <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalFloors"
              type="number"
              min={0}
              max={100}
              value={totalFloors}
              onChange={e => setTotalFloors(parseInt(e.target.value) || 0)}
              placeholder="Ex: 5"
            />
            <p className="text-xs text-gray-500">Sans compter le rez-de-chaussée</p>
          </div>

          {/* Sous-sols */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBasements"
                checked={includeBasements}
                onCheckedChange={checked => setIncludeBasements(!!checked)}
              />
              <Label htmlFor="includeBasements" className="cursor-pointer">
                Inclure des sous-sols
              </Label>
            </div>

            {includeBasements && (
              <div className="pl-6 space-y-2">
                <Label htmlFor="basementCount">Nombre de sous-sols</Label>
                <Input
                  id="basementCount"
                  type="number"
                  min={1}
                  max={5}
                  value={basementCount}
                  onChange={e => setBasementCount(parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          {/* Rez-de-chaussée */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeGroundFloor"
                checked={includeGroundFloor}
                onCheckedChange={checked => setIncludeGroundFloor(!!checked)}
              />
              <Label htmlFor="includeGroundFloor" className="cursor-pointer">
                Inclure le rez-de-chaussée
              </Label>
            </div>

            {includeGroundFloor && (
              <div className="pl-6 space-y-2">
                <Label htmlFor="groundFloorLabel">Label du rez-de-chaussée</Label>
                <Input
                  id="groundFloorLabel"
                  value={groundFloorLabel}
                  onChange={e => setGroundFloorLabel(e.target.value)}
                  placeholder="Ex: Rez-de-chaussée, RDC, 0"
                />
              </div>
            )}
          </div>

          {/* Format */}
          <div className="space-y-3">
            <Label>Format d'affichage</Label>
            <RadioGroup value={format} onValueChange={value => setFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numeric" id="format-numeric" />
                <Label htmlFor="format-numeric" className="cursor-pointer font-normal">
                  Numérique (0, 1, 2, 3...)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ordinal" id="format-ordinal" />
                <Label htmlFor="format-ordinal" className="cursor-pointer font-normal">
                  Ordinal (RDC, 1er, 2, 3...)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Préfixe */}
          <div className="space-y-2">
            <Label htmlFor="prefix">Préfixe (optionnel)</Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder="Ex: Étage, Niveau (laissez vide pour juste le numéro)"
            />
          </div>

          {/* Avertissement si étages existants */}
          {existingFloors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p>
                  <strong>{existingFloors.length} étage(s)</strong> existent déjà dans la liste de
                  référence.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deleteExisting"
                    checked={deleteExisting}
                    onCheckedChange={checked => setDeleteExisting(!!checked)}
                  />
                  <Label htmlFor="deleteExisting" className="cursor-pointer font-normal">
                    Supprimer les étages existants avant de générer
                  </Label>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Aperçu */}
          {preview.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Sparkles className="h-4 w-4" />
                    Aperçu ({preview.length} étages)
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {preview.map((floor, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="text-gray-500 w-8">{floor.value}</span>
                        <span className="text-gray-900 dark:text-gray-100">{floor.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                ✅ {preview.length} étages générés avec succès !
              </AlertDescription>
            </Alert>
          )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || totalFloors === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Building className="h-4 w-4 mr-2" />
                Générer {preview.length} étages
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
