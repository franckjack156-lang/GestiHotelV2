/**
 * ============================================================================
 * TEMPLATE FORM COMPONENT
 * ============================================================================
 *
 * Formulaire de création/édition d'un modèle d'intervention
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { DynamicListSelect } from '@/shared/components/forms/DynamicListSelect';
import { TEMPLATE_CATEGORIES } from '../types/template.types';
import type { InterventionTemplate, CreateTemplateData } from '../types/template.types';

const templateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  category: z.string().optional(),
  templateData: z.object({
    title: z.string().min(1, "Le titre d'intervention est requis"),
    description: z.string().optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    estimatedDuration: z.coerce.number().positive().optional(),
    category: z.string().optional(),
  }),
});

type FormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  template?: InterventionTemplate;
  onSubmit: (data: CreateTemplateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TemplateForm = ({ template, onSubmit, onCancel, isLoading }: TemplateFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: template
      ? {
          name: template.name,
          description: template.description || '',
          category: template.category || '',
          templateData: {
            title: template.templateData.title,
            description: template.templateData.description || '',
            type: template.templateData.type || '',
            priority: template.templateData.priority || '',
            estimatedDuration: template.templateData.estimatedDuration || undefined,
            category: template.templateData.category || '',
          },
        }
      : {
          templateData: {},
        },
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as CreateTemplateData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      {/* Informations du modèle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations du modèle</h3>

        <div>
          <Label htmlFor="name">Nom du modèle *</Label>
          <Input
            {...register('name')}
            placeholder="Ex: Fuite d'eau standard, Panne électrique..."
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description (optionnel)</Label>
          <Textarea
            {...register('description')}
            placeholder="Décrivez dans quel contexte utiliser ce modèle"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={watch('category') || ''}
            onValueChange={value => setValue('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Données pré-remplies de l'intervention */}
      <div className="space-y-4 border-t pt-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Données pré-remplies de l'intervention</h3>

        <div>
          <Label htmlFor="templateData.title">Titre de l'intervention *</Label>
          <Input
            {...register('templateData.title')}
            placeholder="Ex: Intervention plomberie chambre..."
          />
          {errors.templateData?.title && (
            <p className="text-sm text-red-600 mt-1">{errors.templateData.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="templateData.description">Description de l'intervention</Label>
          <Textarea
            {...register('templateData.description')}
            placeholder="Description qui sera pré-remplie dans l'intervention"
            rows={4}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="templateData.type">Type</Label>
            <DynamicListSelect
              listKey="interventionTypes"
              value={watch('templateData.type') || ''}
              onChange={value => setValue('templateData.type', value)}
              placeholder="Sélectionner un type"
              showIcons
              showColors
            />
          </div>

          <div>
            <Label htmlFor="templateData.priority">Priorité</Label>
            <DynamicListSelect
              listKey="interventionPriorities"
              value={watch('templateData.priority') || ''}
              onChange={value => setValue('templateData.priority', value)}
              placeholder="Sélectionner une priorité"
              showIcons
              showColors
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="templateData.estimatedDuration">Durée estimée (minutes)</Label>
            <Input
              type="number"
              {...register('templateData.estimatedDuration')}
              placeholder="Ex: 30"
              min={1}
            />
          </div>

          <div>
            <Label htmlFor="templateData.category">Catégorie intervention</Label>
            <DynamicListSelect
              listKey="interventionCategories"
              value={watch('templateData.category') || ''}
              onChange={value => setValue('templateData.category', value)}
              placeholder="Sélectionner une catégorie"
              showIcons
              showColors
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Créer le modèle'}
        </Button>
      </div>
    </form>
  );
};
