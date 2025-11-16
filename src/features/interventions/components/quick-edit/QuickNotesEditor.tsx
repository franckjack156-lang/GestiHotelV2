/**
 * QuickNotesEditor Component
 *
 * Éditeur inline rapide pour les notes internes et de résolution
 * Permet au technicien de saisir/modifier des notes sans quitter la page
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  FileText,
  X,
  Edit,
  Save,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickNotesEditorProps {
  interventionId: string;
  noteType: 'internal' | 'resolution';
  currentValue?: string;
  status?: string;
  onSave: (value: string) => Promise<boolean>;
  canEdit?: boolean;
}

export const QuickNotesEditor = ({
  noteType,
  currentValue = '',
  status,
  onSave,
  canEdit = true,
}: QuickNotesEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [isSaving, setIsSaving] = useState(false);

  // Mettre à jour la valeur si elle change de l'extérieur
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  // Configuration selon le type de note
  const config = noteType === 'internal'
    ? {
        title: 'Notes internes',
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        placeholder: 'Ajouter des notes internes (visibles uniquement par l\'équipe technique)...',
        emptyMessage: 'Aucune note interne pour le moment',
        maxLength: 1000,
      }
    : {
        title: 'Notes de résolution',
        icon: <FileText className="h-5 w-5 text-green-500" />,
        placeholder: 'Décrire la résolution du problème et les actions réalisées...',
        emptyMessage: 'La résolution sera documentée une fois l\'intervention terminée',
        maxLength: 2000,
      };

  // Si c'est les notes de résolution et que l'intervention n'est pas en cours/terminée
  const shouldShowResolutionNote = noteType === 'resolution'
    ? ['in_progress', 'completed', 'validated'].includes(status || '')
    : true;

  if (!shouldShowResolutionNote) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(value);
      if (success) {
        toast.success(`${config.title} enregistrées avec succès`);
        setIsEditing(false);
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };

  return (
    <Card className={noteType === 'resolution' ? 'border-green-200 dark:border-green-800' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {config.icon}
            {config.title}
          </CardTitle>
          {!isEditing && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {currentValue ? 'Modifier' : 'Ajouter'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.placeholder}
              rows={6}
              maxLength={config.maxLength}
              className="resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {value.length} / {config.maxLength} caractères
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || value === currentValue}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {currentValue ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentValue}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-600 italic text-sm">
                {config.emptyMessage}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
