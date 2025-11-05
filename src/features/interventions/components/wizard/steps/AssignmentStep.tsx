/**
 * AssignmentStep Component
 *
 * Étape 4 : Assignation du technicien
 */

import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { User, UserCheck } from 'lucide-react';
import type { WizardData } from '@/features/interventions/hooks/useInterventionWizard';

interface AssignmentStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

// Mock data - À remplacer par une vraie query Firebase
const mockTechnicians = [
  { id: '1', name: 'Jean Martin', available: true, specialties: ['Plomberie', 'Électricité'] },
  { id: '2', name: 'Marie Dubois', available: true, specialties: ['Climatisation'] },
  { id: '3', name: 'Pierre Durant', available: false, specialties: ['Maintenance générale'] },
  { id: '4', name: 'Sophie Bernard', available: true, specialties: ['Électricité', 'IT'] },
];

export const AssignmentStep = ({ data, onUpdate }: AssignmentStepProps) => {
  const handleChange = (field: keyof WizardData, value: any) => {
    onUpdate({ [field]: value });
  };

  const selectedTechnician = mockTechnicians.find(tech => tech.id === data.assignedTo);

  return (
    <div className="space-y-6">
      {/* Sélection du technicien */}
      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigner à un technicien (optionnel)</Label>
        <Select
          value={data.assignedTo || ''}
          onValueChange={value => handleChange('assignedTo', value === 'none' ? undefined : value)}
        >
          <SelectTrigger id="assignedTo">
            <SelectValue placeholder="Sélectionnez un technicien ou laissez vide" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Ne pas assigner maintenant</span>
            </SelectItem>
            {mockTechnicians.map(tech => (
              <SelectItem key={tech.id} value={tech.id} disabled={!tech.available}>
                <div className="flex items-center gap-2">
                  {tech.available ? (
                    <UserCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={tech.available ? '' : 'text-gray-400'}>
                    {tech.name}
                    {!tech.available && ' (Indisponible)'}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          L'intervention peut être assignée maintenant ou plus tard
        </p>
      </div>

      {/* Informations sur le technicien sélectionné */}
      {selectedTechnician && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Technicien sélectionné
          </h4>
          <div className="text-sm text-green-800 dark:text-green-400 space-y-1">
            <p>
              <span className="font-medium">Nom:</span> {selectedTechnician.name}
            </p>
            <p>
              <span className="font-medium">Spécialités:</span>{' '}
              {selectedTechnician.specialties.join(', ')}
            </p>
            <p>
              <span className="font-medium">Statut:</span>{' '}
              {selectedTechnician.available ? 'Disponible' : 'Indisponible'}
            </p>
          </div>
        </div>
      )}

      {/* Notes internes */}
      <div className="space-y-2">
        <Label htmlFor="internalNotes">Notes internes (optionnel)</Label>
        <Textarea
          id="internalNotes"
          placeholder="Informations supplémentaires pour l'équipe technique..."
          value={data.internalNotes || ''}
          onChange={e => handleChange('internalNotes', e.target.value)}
          rows={6}
          maxLength={1000}
        />
        <p className="text-xs text-gray-500">
          {data.internalNotes?.length || 0}/1000 caractères - Visible uniquement par l'équipe
        </p>
      </div>

      {/* Aide */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 À propos de l'assignation
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Vous pouvez assigner l'intervention maintenant ou plus tard</li>
          <li>• Les techniciens indisponibles ne peuvent pas être assignés</li>
          <li>• Les notes internes sont visibles uniquement par l'équipe technique</li>
          <li>• Le technicien recevra une notification par email et push</li>
        </ul>
      </div>

      {/* Récapitulatif */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          👤 Récapitulatif de l'assignation
        </h4>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {selectedTechnician ? (
            <>
              <p>
                <span className="font-medium">Assigné à:</span> {selectedTechnician.name}
              </p>
              <p>
                <span className="font-medium">Spécialités:</span>{' '}
                {selectedTechnician.specialties.join(', ')}
              </p>
            </>
          ) : (
            <p className="text-gray-500">Aucun technicien assigné pour le moment</p>
          )}
          {data.internalNotes && (
            <p>
              <span className="font-medium">Notes internes:</span> Oui ({data.internalNotes.length}{' '}
              caractères)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
