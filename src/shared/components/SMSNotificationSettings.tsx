/**
 * Composant de paramètres de notifications SMS
 * Permet aux utilisateurs d'activer/désactiver les notifications SMS
 * et de configurer leur numéro de téléphone
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
// import { useEstablishment } from '@/features/auth/hooks/useAuth'; // TODO: Fix
import { getPreferences, updatePreferences } from '@/shared/services/notificationService';
import { isValidPhoneNumber } from '@/shared/services/smsService';
import { logger } from '@/core/utils/logger';

export const SMSNotificationSettings = () => {
  const { user } = useAuth();
  // const { establishment } = useAuth(); // TODO: Fix

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [enableSMS, setEnableSMS] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Charger les préférences actuelles
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const establishmentId = (user as any).establishmentId || 'default';
        const prefs = await getPreferences(user.id, establishmentId);

        if (prefs) {
          setEnableSMS(prefs.enableSMS || false);
          // Le numéro de téléphone devrait être stocké dans le profil utilisateur
          // À adapter selon votre structure de données
        }
      } catch (error) {
        logger.error('Erreur chargement préférences SMS:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Valider et formater le numéro de téléphone
  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError(null);

    if (value && !isValidPhoneNumber(value)) {
      setPhoneError('Format invalide. Utilisez le format international: +33612345678');
    }
  };

  // Sauvegarder les préférences
  const handleSave = async () => {
    if (!user) return;

    // Valider le numéro si SMS activé
    if (enableSMS && phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPhoneError('Numéro de téléphone invalide');
      return;
    }

    try {
      setSaving(true);

      // Mettre à jour les préférences
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const establishmentId = (user as any).establishmentId || 'default';
      await updatePreferences(user.id, establishmentId, {
        enableSMS,
      });

      // TODO: Sauvegarder le numéro de téléphone dans le profil utilisateur
      // await updateUserProfile(user.id, { phoneNumber });

      logger.debug('Préférences SMS sauvegardées');
    } catch (error) {
      logger.error('Erreur sauvegarde préférences SMS:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notifications SMS</h3>
          <p className="text-sm text-gray-500">Recevez des alertes importantes par SMS</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enableSMS}
            onChange={e => setEnableSMS(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enableSMS && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-500">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={e => handlePhoneNumberChange(e.target.value)}
              placeholder="+33612345678"
              className={`mt-1 block w-full rounded-md shadow-sm ${
                phoneError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Format international requis. Ex: +33612345678 (France), +14155551234 (USA)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Notifications SMS payantes</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Les notifications SMS sont facturées par votre opérateur et Twilio. Coût estimé:
                    environ 0.06€ par SMS.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Types de notifications SMS</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Les SMS seront envoyés pour:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Interventions urgentes</li>
                <li>Interventions qui vous sont assignées</li>
                <li>Alertes SLA dépassées</li>
                <li>Autres alertes critiques</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || (enableSMS && (!phoneNumber || !!phoneError))}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
};

export default SMSNotificationSettings;
