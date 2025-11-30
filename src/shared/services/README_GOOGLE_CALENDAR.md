# Google Calendar Service - Documentation

## Vue d'ensemble

Le service Google Calendar permet de synchroniser les interventions de GestiHotel avec Google Calendar via l'API Google Calendar v3 et OAuth 2.0.

## Architecture

### Fichiers créés/modifiés

1. **Service principal**
   - `src/shared/services/googleCalendarService.ts` - Service de synchronisation Google Calendar

2. **Types**
   - `src/features/interventions/types/intervention.types.ts` - Ajout du champ `googleCalendarEventId`
   - `src/features/users/types/user.types.ts` - Ajout des champs `googleCalendarTokens` et `googleCalendarSyncEnabled`

3. **Cloud Functions**
   - `functions/src/index.ts` - Ajout de 3 Cloud Functions :
     - `googleCalendarCallback` - Callback OAuth
     - `disconnectGoogleCalendar` - Déconnexion
     - `syncInterventionToGoogleCalendar` - Synchronisation

4. **Interface utilisateur**
   - `src/pages/settings/IntegrationsPage.tsx` - Ajout de l'onglet "Google Calendar"

## Fonctionnalités

### 1. Authentification OAuth 2.0

```typescript
import { getAuthUrl, getTokensFromCode } from '@/shared/services/googleCalendarService';

// Générer l'URL d'autorisation
const state = btoa(JSON.stringify({ userId, establishmentId }));
const authUrl = getAuthUrl(redirectUri, state);

// Rediriger l'utilisateur vers Google
window.location.href = authUrl;

// Après redirection, échanger le code contre des tokens
const tokens = await getTokensFromCode(code, redirectUri);
```

### 2. Gestion des tokens

Les tokens sont automatiquement rafraîchis lorsqu'ils expirent :

```typescript
import { getValidTokens, isTokenExpired } from '@/shared/services/googleCalendarService';

// Vérifier si un token est expiré
const expired = isTokenExpired(tokens);

// Obtenir des tokens valides (rafraîchit si nécessaire)
const validTokens = await getValidTokens(tokens);
```

### 3. Synchronisation des interventions

#### Créer un événement

```typescript
import { syncInterventionToCalendar } from '@/shared/services/googleCalendarService';

const eventId = await syncInterventionToCalendar(
  tokens,
  intervention,
  'primary' // calendrier principal
);
```

#### Mettre à jour un événement

```typescript
import { updateInterventionInCalendar } from '@/shared/services/googleCalendarService';

await updateInterventionInCalendar(tokens, intervention, googleEventId, 'primary');
```

#### Supprimer un événement

```typescript
import { deleteInterventionFromCalendar } from '@/shared/services/googleCalendarService';

await deleteInterventionFromCalendar(tokens, googleEventId, 'primary');
```

### 4. Cloud Functions

#### Synchroniser une intervention (depuis le client)

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(undefined, 'europe-west1');
const syncIntervention = httpsCallable(functions, 'syncInterventionToGoogleCalendar');

const result = await syncIntervention({
  interventionId: 'intervention-123',
  establishmentId: 'establishment-456',
});

console.log(result.data.eventId); // ID de l'événement Google Calendar
```

#### Déconnecter Google Calendar

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(undefined, 'europe-west1');
const disconnect = httpsCallable(functions, 'disconnectGoogleCalendar');

await disconnect();
```

## Format des événements Google Calendar

Chaque intervention synchronisée crée un événement avec la structure suivante :

```json
{
  "summary": "[HIGH] Fuite d'eau chambre 205",
  "description": "📋 Fuite d'eau sous l'évier\n\n🏷️ Type: plomberie\n📂 Catégorie: maintenance\n⚡ Priorité: high\n📊 Statut: in_progress\n🚪 Chambre: 205\n👤 Assigné à: Jean Dupont\n⏱️ Durée estimée: 120 minutes\n\n📝 Notes: Apporter clé à molette\n\n🔗 Voir l'intervention: https://app.gestihotel.com/interventions/123",
  "location": "Bâtiment A, Étage 2, Chambre 205",
  "start": {
    "dateTime": "2025-11-29T10:00:00+01:00",
    "timeZone": "Europe/Paris"
  },
  "end": {
    "dateTime": "2025-11-29T12:00:00+01:00",
    "timeZone": "Europe/Paris"
  },
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },
      { "method": "popup", "minutes": 30 }
    ]
  }
}
```

## Stockage des données

### Dans Firestore (collection `users`)

```typescript
{
  id: "user-123",
  email: "technicien@hotel.com",
  // ... autres champs
  googleCalendarTokens: {
    access_token: "ya29.a0AfH6SMC...",
    refresh_token: "1//0gHhX...",
    scope: "https://www.googleapis.com/auth/calendar",
    token_type: "Bearer",
    expiry_date: 1732881234567
  },
  googleCalendarSyncEnabled: true
}
```

### Dans Firestore (collection `interventions`)

```typescript
{
  id: "intervention-123",
  title: "Fuite d'eau chambre 205",
  // ... autres champs
  googleCalendarEventId: "abc123def456"
}
```

## Sécurité

### Scopes OAuth requis

- `https://www.googleapis.com/auth/calendar` - Accès complet au calendrier

### Protection des tokens

1. **Stockage** : Les tokens sont stockés dans Firestore avec des règles de sécurité strictes
2. **Transmission** : Utilisation exclusive de HTTPS
3. **Rafraîchissement** : Automatique avec marge de sécurité de 5 minutes
4. **Révocation** : L'utilisateur peut révoquer l'accès à tout moment

### Règles de sécurité Firestore recommandées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // L'utilisateur peut gérer ses propres tokens
      allow read, update: if request.auth != null
                          && request.auth.uid == userId;

      // Les admins peuvent voir (mais pas modifier) les tokens
      allow read: if request.auth != null
                  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
  }
}
```

## Gestion des erreurs

Le service gère plusieurs types d'erreurs :

### Erreurs OAuth

```typescript
try {
  const tokens = await getTokensFromCode(code, redirectUri);
} catch (error) {
  if (error.message.includes('invalid_grant')) {
    // Code d'autorisation expiré ou invalide
    console.error("Le code d'autorisation a expiré");
  } else if (error.message.includes('redirect_uri_mismatch')) {
    // L'URI de redirection ne correspond pas
    console.error('Configuration OAuth incorrecte');
  }
}
```

### Erreurs API Calendar

```typescript
try {
  await createCalendarEvent(tokens, event);
} catch (error) {
  if (error.status === 401) {
    // Token invalide ou expiré
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    // Réessayer avec le nouveau token
  } else if (error.status === 403) {
    // Quota dépassé ou permissions insuffisantes
    console.error('Accès refusé à Google Calendar');
  } else if (error.status === 404) {
    // Calendrier non trouvé
    console.error('Calendrier non trouvé');
  }
}
```

## Limites et quotas

### Quotas Google Calendar API

- **Requêtes par jour** : 1,000,000 (par défaut)
- **Requêtes par minute** : 1,000 par utilisateur
- **Requêtes par seconde** : Pas de limite stricte

### Recommandations

1. **Batch operations** : Grouper les créations/mises à jour si possible
2. **Caching** : Éviter les requêtes redondantes
3. **Error handling** : Implémenter un système de retry avec backoff exponentiel
4. **Rate limiting** : Surveiller les quotas et implémenter un throttling si nécessaire

## Tests

### Tests unitaires

```typescript
import { describe, it, expect, vi } from 'vitest';
import { isTokenExpired, buildInterventionDescription } from './googleCalendarService';

describe('Google Calendar Service', () => {
  describe('isTokenExpired', () => {
    it('devrait retourner true si le token est expiré', () => {
      const tokens = {
        access_token: 'token',
        expiry_date: Date.now() - 10000, // Expiré il y a 10 secondes
      };
      expect(isTokenExpired(tokens)).toBe(true);
    });

    it('devrait retourner false si le token est valide', () => {
      const tokens = {
        access_token: 'token',
        expiry_date: Date.now() + 10000, // Expire dans 10 secondes
      };
      expect(isTokenExpired(tokens)).toBe(false);
    });
  });
});
```

### Tests d'intégration

```typescript
// Tester le flux OAuth complet
describe('OAuth Flow', () => {
  it("devrait générer une URL d'autorisation valide", () => {
    const authUrl = getAuthUrl('http://localhost/callback', 'state123');
    expect(authUrl).toContain('accounts.google.com');
    expect(authUrl).toContain('state=state123');
  });

  it('devrait échanger un code contre des tokens', async () => {
    // Mock de l'API OAuth
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
      }),
    });

    const tokens = await getTokensFromCode('code123', 'http://localhost/callback');
    expect(tokens.access_token).toBe('access');
    expect(tokens.refresh_token).toBe('refresh');
  });
});
```

## Dépannage

### Problème : "Configuration Google OAuth manquante"

**Solution** : Vérifier que toutes les variables d'environnement sont définies :

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_SECRET`
- `VITE_GOOGLE_REDIRECT_URI`

### Problème : "Token expiré et pas de refresh_token"

**Cause** : L'utilisateur n'a pas accordé l'accès "offline"

**Solution** : Utiliser `prompt: 'consent'` dans l'URL d'autorisation pour forcer le consentement

### Problème : "redirect_uri_mismatch"

**Cause** : L'URI de redirection ne correspond pas à celle configurée dans Google Cloud Console

**Solution** :

1. Vérifier la configuration dans Google Cloud Console
2. S'assurer que l'URI inclut le protocole (https://)
3. Vérifier qu'il n'y a pas de slash final inutile

## Support et ressources

- [Documentation Google Calendar API](https://developers.google.com/calendar)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
