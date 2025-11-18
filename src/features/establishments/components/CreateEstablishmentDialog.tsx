/**
 * Create Establishment Dialog
 *
 * Dialog multi-étapes pour créer un nouvel établissement
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useEstablishments } from '../hooks/useEstablishments';
import {
  EstablishmentType,
  ESTABLISHMENT_TYPE_LABELS,
  type EstablishmentCategory,
} from '@/shared/types/establishment.types';
import { Building2, Phone, Mail, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateEstablishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  // Étape 1: Informations de base
  name: string;
  type: EstablishmentType;
  category?: EstablishmentCategory;
  description?: string;

  // Étape 2: Adresse
  street: string;
  city: string;
  zipCode: string;
  country: string;

  // Étape 3: Contact et capacité
  email: string;
  phone: string;
  website?: string;
  totalRooms: number;
  totalFloors?: number;
}

const STEPS = [
  { id: 1, title: 'Informations', description: 'Détails de base' },
  { id: 2, title: 'Adresse', description: 'Localisation' },
  { id: 3, title: 'Contact & Capacité', description: 'Coordonnées et chambres' },
];

export const CreateEstablishmentDialog = ({
  open,
  onOpenChange,
}: CreateEstablishmentDialogProps) => {
  const navigate = useNavigate();
  const { createEstablishment, isLoading } = useEstablishments();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: EstablishmentType.HOTEL,
    street: '',
    city: '',
    zipCode: '',
    country: 'France',
    email: '',
    phone: '',
    totalRooms: 10,
  });

  const updateFormData = (field: keyof FormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.name && !!formData.type;
      case 2:
        return !!formData.street && !!formData.city && !!formData.country;
      case 3:
        return !!formData.email && !!formData.phone && formData.totalRooms > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    const establishmentId = await createEstablishment({
      name: formData.name,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      address: {
        street: formData.street,
        city: formData.city,
        postalCode: formData.zipCode,
        country: formData.country,
      },
      contact: {
        email: formData.email,
        phone: formData.phone,
      },
      website: formData.website,
      totalRooms: formData.totalRooms,
      totalFloors: formData.totalFloors,
    });

    if (establishmentId) {
      toast.success('Établissement créé !', {
        description: `${formData.name} a été créé avec succès et initialisé automatiquement.`,
      });

      // Fermer le dialog et réinitialiser
      onOpenChange(false);
      setCurrentStep(1);
      setFormData({
        name: '',
        type: EstablishmentType.HOTEL,
        street: '',
        city: '',
        zipCode: '',
        country: 'France',
        email: '',
        phone: '',
        totalRooms: 10,
      });

      // Rediriger vers les paramètres du nouvel établissement
      navigate('/app/settings/establishment');
    } else {
      toast.error('Erreur', {
        description: "Impossible de créer l'établissement. Veuillez réessayer.",
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom de l'établissement <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: Hôtel du Parc"
          value={formData.name}
          onChange={e => updateFormData('name', e.target.value)}
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">
          Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.type}
          onValueChange={value => updateFormData('type', value as EstablishmentType)}
        >
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ESTABLISHMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie (étoiles)</Label>
        <Select
          value={formData.category?.toString() || ''}
          onValueChange={value => updateFormData('category', parseInt(value) as EstablishmentCategory)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Non classé" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 étoile</SelectItem>
            <SelectItem value="2">2 étoiles</SelectItem>
            <SelectItem value="3">3 étoiles</SelectItem>
            <SelectItem value="4">4 étoiles</SelectItem>
            <SelectItem value="5">5 étoiles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description courte de l'établissement..."
          value={formData.description || ''}
          onChange={e => updateFormData('description', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">
          Adresse <span className="text-destructive">*</span>
        </Label>
        <Input
          id="street"
          placeholder="123 rue de Paris"
          value={formData.street}
          onChange={e => updateFormData('street', e.target.value)}
          className="text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">Code postal</Label>
          <Input
            id="zipCode"
            placeholder="75001"
            value={formData.zipCode}
            onChange={e => updateFormData('zipCode', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">
            Ville <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Paris"
            value={formData.city}
            onChange={e => updateFormData('city', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">
          Pays <span className="text-destructive">*</span>
        </Label>
        <Input
          id="country"
          placeholder="France"
          value={formData.country}
          onChange={e => updateFormData('country', e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          ℹ️ Le pays permet de détecter automatiquement la timezone, la devise et les formats
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="contact@hotel.fr"
            value={formData.email}
            onChange={e => updateFormData('email', e.target.value)}
            className="pl-10 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Utilisé pour les notifications et commandes de pièces
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Téléphone <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="01 23 45 67 89"
            value={formData.phone}
            onChange={e => updateFormData('phone', e.target.value)}
            className="pl-10 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Site web</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="website"
            type="url"
            placeholder="https://www.hotel.fr"
            value={formData.website || ''}
            onChange={e => updateFormData('website', e.target.value)}
            className="pl-10 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalRooms">
            Nombre de chambres <span className="text-destructive">*</span>
          </Label>
          <Input
            id="totalRooms"
            type="number"
            min="1"
            value={formData.totalRooms}
            onChange={e => updateFormData('totalRooms', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalFloors">Nombre d'étages</Label>
          <Input
            id="totalFloors"
            type="number"
            min="1"
            placeholder="Optionnel"
            value={formData.totalFloors || ''}
            onChange={e => updateFormData('totalFloors', parseInt(e.target.value) || undefined)}
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Créer un établissement</DialogTitle>
              <DialogDescription>
                Étape {currentStep} sur {STEPS.length}: {STEPS[currentStep - 1].description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    currentStep >= step.id ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="py-4">{renderStepContent()}</div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isLoading}>
            Retour
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(3) || isLoading}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-2" />
                    Créer l'établissement
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
