/**
 * BasicInfoStep Component
 *
 * Étape 1 : Informations de base de l'intervention
 */

import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { X } from 'lucide-react';
import { INTERVENTION_TYPE_LABELS, CATEGORY_LABELS } from '@/shared/types/status.types';
import type { WizardData } from '@/features/interventions/hooks/useInterventionWizard';

interface BasicInfoStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export const BasicInfoStep = ({ data, onUpdate }: BasicInfoStepProps) => {
  const handleChange = (field: keyof WizardData, value: any) => {
    onUpdate({ [field]: value });
  };

  // Gestion des tags
  const handleAddTag = (tagLabel: string) => {
    if (!tagLabel.trim()) return;

    const newTag = {
      id: Date.now().toString(),
      label: tagLabel.trim(),
      color: getRandomColor(),
    };

    const currentTags = data.tags || [];
    handleChange('tags', [...currentTags, newTag]);
  };

  const handleRemoveTag = (tagId: string) => {
    const currentTags = data.tags || [];
    handleChange(
      'tags',
      currentTags.filter(tag => tag.id !== tagId)
    );
  };

  const getRandomColor = () => {
    const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="space-y-6">
      {/* Type d'intervention */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Type d'intervention <span className="text-red-500">*</span>
        </Label>
        <Select value={data.type || ''} onValueChange={value => handleChange('type', value)}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INTERVENTION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!data.type && <p className="text-xs text-gray-500">Le type d'intervention est requis</p>}
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Catégorie <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.category || ''}
          onValueChange={value => handleChange('category', value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Sélectionnez une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!data.category && <p className="text-xs text-gray-500">La catégorie est requise</p>}
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex: Fuite d'eau salle de bain"
          value={data.title || ''}
          onChange={e => handleChange('title', e.target.value)}
          maxLength={200}
        />
        <p className="text-xs text-gray-500">
          {data.title?.length || 0}/200 caractères (minimum 3)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez le problème en détail..."
          value={data.description || ''}
          onChange={e => handleChange('description', e.target.value)}
          rows={6}
          maxLength={2000}
        />
        <p className="text-xs text-gray-500">
          {data.description?.length || 0}/2000 caractères (minimum 10)
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (optionnel)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Ajouter un tag..."
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="gap-1">
                {tag.label}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">Appuyez sur Entrée pour ajouter un tag</p>
      </div>

      {/* Aide */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">💡 Conseils</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Soyez précis dans votre titre</li>
          <li>• Décrivez le problème en détail</li>
          <li>• Ajoutez des tags pour faciliter la recherche</li>
        </ul>
      </div>
    </div>
  );
};
