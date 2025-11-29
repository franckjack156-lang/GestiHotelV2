/**
 * ============================================================================
 * SUPPLIER FORM
 * ============================================================================
 *
 * Formulaire de création/édition d'un fournisseur
 */

import { useForm, Controller } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import type { Supplier, SupplierCategory } from '../types/supplier.types';
import { SUPPLIER_CATEGORY_LABELS } from '../types/supplier.types';

/**
 * Schéma de validation
 */
const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  description: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentDelayDays: z.coerce.number().positive().optional(),
  paymentDiscountPercent: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const SupplierForm = ({ supplier, onSubmit, onCancel, isSubmitting }: SupplierFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(supplierSchema) as unknown,
    defaultValues: supplier
      ? {
          name: supplier.name,
          category: supplier.category,
          description: supplier.description || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          website: supplier.website || '',
          addressStreet: supplier.address?.street || '',
          addressCity: supplier.address?.city || '',
          addressPostalCode: supplier.address?.postalCode || '',
          addressCountry: supplier.address?.country || 'France',
          siret: supplier.siret || '',
          vatNumber: supplier.vatNumber || '',
          paymentMethod: supplier.paymentTerms?.method || '',
          paymentDelayDays: supplier.paymentTerms?.delayDays || undefined,
          paymentDiscountPercent: supplier.paymentTerms?.discountPercent || undefined,
          notes: supplier.notes || '',
          tags: supplier.tags?.join(', ') || '',
        }
      : {
          addressCountry: 'France',
        },
  });

  const handleFormSubmit = (data: FormData) => {
    const formattedData = {
      name: data.name,
      category: data.category as SupplierCategory,
      description: data.description,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address:
        data.addressStreet || data.addressCity
          ? {
              street: data.addressStreet || '',
              city: data.addressCity || '',
              postalCode: data.addressPostalCode || '',
              country: data.addressCountry || 'France',
            }
          : undefined,
      siret: data.siret,
      vatNumber: data.vatNumber,
      paymentTerms:
        data.paymentMethod || data.paymentDelayDays
          ? {
              method: data.paymentMethod,
              delayDays: data.paymentDelayDays,
              discountPercent: data.paymentDiscountPercent,
            }
          : undefined,
      notes: data.notes,
      tags: data.tags
        ? data.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : [],
    };

    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as unknown)} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du fournisseur <span className="text-red-500">*</span>
            </Label>
            <Input {...register('name')} placeholder="Ex: Leroy Merlin" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }: any) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              {...register('description')}
              placeholder="Description du fournisseur et de ses services"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              {...register('tags')}
              placeholder="Ex: urgent, fiable, économique (séparés par des virgules)"
            />
            <p className="text-sm text-muted-foreground">Séparés par des virgules</p>
          </div>
        </TabsContent>

        {/* Onglet Contact */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input {...register('email')} type="email" placeholder="contact@exemple.fr" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input {...register('phone')} placeholder="01 23 45 67 89" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input {...register('website')} placeholder="https://www.exemple.fr" />
            {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Adresse</h4>

            <div className="space-y-2">
              <Label htmlFor="addressStreet">Rue</Label>
              <Input {...register('addressStreet')} placeholder="123 Rue de la Paix" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressPostalCode">Code postal</Label>
                <Input {...register('addressPostalCode')} placeholder="75000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressCity">Ville</Label>
                <Input {...register('addressCity')} placeholder="Paris" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressCountry">Pays</Label>
              <Input {...register('addressCountry')} placeholder="France" />
            </div>
          </div>
        </TabsContent>

        {/* Onglet Commercial */}
        <TabsContent value="commercial" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input {...register('siret')} placeholder="123 456 789 00012" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">N° TVA</Label>
              <Input {...register('vatNumber')} placeholder="FR12345678901" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Conditions de paiement</h4>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Méthode de paiement</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }: any) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                      <SelectItem value="transfer">Virement</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDelayDays">Délai de paiement (jours)</Label>
                <Input {...register('paymentDelayDays')} type="number" placeholder="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDiscountPercent">Remise (%)</Label>
                <Input
                  {...register('paymentDiscountPercent')}
                  type="number"
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Onglet Notes */}
        <TabsContent value="notes" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              {...register('notes')}
              placeholder="Notes et informations complémentaires sur le fournisseur"
              rows={8}
            />
            <p className="text-sm text-muted-foreground">
              Ces notes ne sont visibles que par votre équipe
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : supplier ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};
