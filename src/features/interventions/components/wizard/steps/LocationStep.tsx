/**
 * LocationStep Component
 *
 * Étape 2 : Localisation de l'intervention avec support multi-chambres
 */

import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Plus, X, MapPin } from 'lucide-react';
import type { WizardData } from '@/features/interventions/hooks/useInterventionWizard';

interface LocationStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export const LocationStep = ({ data, onUpdate }: LocationStepProps) => {
  const [newLocation, setNewLocation] = useState('');
  const [enableMultiRooms, setEnableMultiRooms] = useState(false);

  const handleChange = (field: keyof WizardData, value: any) => {
    onUpdate({ [field]: value });
  };

  // Gestion multi-chambres
  const handleAddLocation = () => {
    if (!newLocation.trim()) return;

    const currentLocations = data.locations || [];
    handleChange('locations', [...currentLocations, newLocation.trim()]);
    setNewLocation('');
  };

  const handleRemoveLocation = (index: number) => {
    const currentLocations = data.locations || [];
    handleChange(
      'locations',
      currentLocations.filter((_, i) => i !== index)
    );
  };

  const handleToggleMultiRooms = (enabled: boolean) => {
    setEnableMultiRooms(enabled);
    if (!enabled) {
      handleChange('locations', []);
    }
  };

  return (
    <div className="space-y-6">
      {/* Type de zone */}
      <div className="space-y-2">
        <Label htmlFor="roomType">
          Type de zone <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.roomType || ''}
          onValueChange={(value: 'chambre' | 'commun' | 'exterieur') =>
            handleChange('roomType', value)
          }
        >
          <SelectTrigger id="roomType">
            <SelectValue placeholder="Sélectionnez le type de zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chambre">Chambre</SelectItem>
            <SelectItem value="commun">Espace commun</SelectItem>
            <SelectItem value="exterieur">Extérieur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Localisation principale */}
      <div className="space-y-2">
        <Label htmlFor="location">
          Localisation principale <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location"
          placeholder="Ex: Hall principal, Piscine, Parking..."
          value={data.location || ''}
          onChange={e => handleChange('location', e.target.value)}
        />
        <p className="text-xs text-gray-500">La localisation principale est requise</p>
      </div>

      {/* Numéro de chambre */}
      {data.roomType === 'chambre' && (
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Numéro de chambre</Label>
          <Input
            id="roomNumber"
            placeholder="Ex: 301"
            value={data.roomNumber || ''}
            onChange={e => handleChange('roomNumber', e.target.value)}
          />
        </div>
      )}

      {/* Multi-chambres */}
      {data.roomType === 'chambre' && (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiRooms"
              checked={enableMultiRooms}
              onCheckedChange={handleToggleMultiRooms}
            />
            <Label htmlFor="multiRooms" className="cursor-pointer">
              Intervention sur plusieurs chambres
            </Label>
          </div>

          {enableMultiRooms && (
            <div className="space-y-3 pl-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Numéro de chambre..."
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLocation();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddLocation}
                  disabled={!newLocation.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {data.locations && data.locations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chambres concernées ({data.locations.length}) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.locations.map((location, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(index)}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Appuyez sur Entrée ou cliquez sur + pour ajouter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Étage */}
      <div className="space-y-2">
        <Label htmlFor="floor">Étage</Label>
        <Input
          id="floor"
          type="number"
          placeholder="Ex: 3"
          value={data.floor ?? ''}
          onChange={e =>
            handleChange('floor', e.target.value ? parseInt(e.target.value) : undefined)
          }
        />
      </div>

      {/* Bâtiment */}
      <div className="space-y-2">
        <Label htmlFor="building">Bâtiment</Label>
        <Input
          id="building"
          placeholder="Ex: Bâtiment A, Aile Est..."
          value={data.building || ''}
          onChange={e => handleChange('building', e.target.value)}
        />
      </div>

      {/* Récapitulatif */}
      {data.location && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            📍 Récapitulatif de la localisation
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <span className="font-medium">Type:</span>{' '}
              {data.roomType === 'chambre'
                ? 'Chambre'
                : data.roomType === 'commun'
                  ? 'Espace commun'
                  : 'Extérieur'}
            </p>
            <p>
              <span className="font-medium">Localisation:</span> {data.location}
            </p>
            {data.roomNumber && (
              <p>
                <span className="font-medium">Chambre:</span> {data.roomNumber}
              </p>
            )}
            {data.locations && data.locations.length > 0 && (
              <p>
                <span className="font-medium">Chambres additionnelles:</span>{' '}
                {data.locations.join(', ')}
              </p>
            )}
            {data.floor !== undefined && (
              <p>
                <span className="font-medium">Étage:</span> {data.floor}
              </p>
            )}
            {data.building && (
              <p>
                <span className="font-medium">Bâtiment:</span> {data.building}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
