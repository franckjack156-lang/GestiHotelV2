# Configuration Google Calendar Integration

Ce document explique comment configurer l'intégration Google Calendar dans GestiHotel.

## Prérequis

1. Un compte Google Cloud Platform
2. Accès à la Console Google Cloud
3. Droits administrateur sur le projet Firebase

## Étapes de configuration

### 1. Créer un projet Google Cloud (si nécessaire)

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet

### 2. Activer l'API Google Calendar

1. Dans Google Cloud Console, allez dans "APIs & Services" → "Library"
2. Recherchez "Google Calendar API"
3. Cliquez sur "Enable" pour activer l'API

### 3. Configurer l'écran de consentement OAuth

1. Allez dans "APIs & Services" → "OAuth consent screen"
2. Sélectionnez "External" (ou "Internal" si vous utilisez Google Workspace)
3. Remplissez les informations requises :
   - **App name** : GestiHotel
   - **User support email** : votre email
   - **Developer contact information** : votre email
4. Ajoutez les scopes suivants :
   - `https://www.googleapis.com/auth/calendar` (Gérer vos calendriers)
5. Enregistrez et continuez

### 4. Créer les identifiants OAuth 2.0

1. Allez dans "APIs & Services" → "Credentials"
2. Cliquez sur "Create Credentials" → "OAuth client ID"
3. Sélectionnez "Web application"
4. Configurez :
   - **Name** : GestiHotel Web Client
   - **Authorized JavaScript origins** :
     - `http://localhost:5173` (développement)
     - `https://votre-domaine.com` (production)
   - **Authorized redirect URIs** :
     - `https://europe-west1-votre-projet-id.cloudfunctions.net/googleCalendarCallback`
5. Cliquez sur "Create"
6. **IMPORTANT** : Notez le Client ID et Client Secret

### 5. Configurer les variables d'environnement

#### Dans le projet principal (.env ou .env.local)

```env
VITE_GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=votre_client_secret
VITE_GOOGLE_REDIRECT_URI=https://europe-west1-votre-projet-id.cloudfunctions.net/googleCalendarCallback
VITE_APP_URL=https://votre-domaine.com
```

#### Dans Firebase Functions

```bash
# Configuration via Firebase CLI
firebase functions:config:set google.client_id="votre_client_id.apps.googleusercontent.com"
firebase functions:config:set google.client_secret="votre_client_secret"
firebase functions:config:set google.redirect_uri="https://europe-west1-votre-projet-id.cloudfunctions.net/googleCalendarCallback"
firebase functions:config:set app.url="https://votre-domaine.com"

# Vérifier la configuration
firebase functions:config:get
```

#### Alternativement, avec .env (Cloud Functions v2)

Créez un fichier `.env` dans le dossier `functions/` :

```env
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_REDIRECT_URI=https://europe-west1-votre-projet-id.cloudfunctions.net/googleCalendarCallback
APP_URL=https://votre-domaine.com
```

### 6. Déployer les Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions:googleCalendarCallback,functions:disconnectGoogleCalendar,functions:syncInterventionToGoogleCalendar
```

### 7. Tester l'intégration

1. Connectez-vous à GestiHotel
2. Allez dans "Paramètres" → "Intégrations"
3. Cliquez sur l'onglet "Google Calendar"
4. Cliquez sur "Connecter Google Calendar"
5. Autorisez l'application à accéder à votre calendrier Google
6. Vous devriez être redirigé vers GestiHotel avec un message de succès

## Fonctionnalités

### Synchronisation automatique

Lorsque la synchronisation automatique est activée :

- Chaque nouvelle intervention planifiée est automatiquement ajoutée à Google Calendar
- Les modifications d'interventions mettent à jour les événements correspondants
- La suppression d'une intervention supprime l'événement du calendrier

### Synchronisation manuelle

Vous pouvez également synchroniser des interventions individuellement :

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(undefined, 'europe-west1');
const syncIntervention = httpsCallable(functions, 'syncInterventionToGoogleCalendar');

await syncIntervention({
  interventionId: 'intervention-id',
  establishmentId: 'establishment-id'
});
```

## Structure des événements Google Calendar

Chaque intervention synchronisée crée un événement avec :

- **Titre** : `[PRIORITÉ] Titre de l'intervention`
- **Description** : Détails complets de l'intervention (type, catégorie, statut, techniciens assignés, notes)
- **Lieu** : Bâtiment, étage, chambre et localisation
- **Début** : Date et heure planifiée (ou date de création si non planifiée)
- **Fin** : Calculée à partir de la durée estimée (1h par défaut)
- **Rappels** :
  - Email 24h avant
  - Popup 30 minutes avant

## Sécurité

### Stockage des tokens

Les tokens OAuth sont stockés dans Firestore dans le document utilisateur :

```typescript
{
  googleCalendarTokens: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  },
  googleCalendarSyncEnabled: boolean
}
```

### Rafraîchissement automatique

Les tokens sont automatiquement rafraîchis lorsqu'ils expirent (avec une marge de 5 minutes).

### Révocation

L'utilisateur peut déconnecter Google Calendar à tout moment depuis les paramètres, ce qui :
- Supprime les tokens de Firestore
- Désactive la synchronisation automatique
- Ne supprime PAS les événements déjà créés dans Google Calendar

## Règles de sécurité Firestore

Ajoutez ces règles pour protéger les tokens :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // L'utilisateur peut lire/modifier ses propres tokens
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Les admins peuvent accéder aux données utilisateur
      allow read: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
  }
}
```

## Dépannage

### Erreur "redirect_uri_mismatch"

Vérifiez que l'URI de redirection dans Google Cloud Console correspond exactement à celle configurée dans les variables d'environnement.

### Erreur "invalid_grant"

Le code d'autorisation a expiré ou a déjà été utilisé. Recommencez le processus d'autorisation.

### Token expiré et pas de refresh_token

Cela peut arriver si l'utilisateur a refusé l'accès "offline". Assurez-vous que `prompt: 'consent'` est bien défini dans l'URL d'autorisation.

### Les événements ne se créent pas

1. Vérifiez les logs des Cloud Functions : `firebase functions:log`
2. Vérifiez que l'API Google Calendar est bien activée
3. Vérifiez que les tokens sont valides et non expirés
4. Vérifiez que l'utilisateur a autorisé le scope `calendar`

## Limites et quotas

Google Calendar API a des limites de quota :

- **Quota quotidien** : 1,000,000 requêtes/jour (par défaut)
- **Requêtes par utilisateur** : 1,000 requêtes/minute
- **Rafraîchissement de token** : Pas de limite spécifique, mais évitez les rafraîchissements excessifs

Pour voir vos quotas : [Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)

## Coûts

L'API Google Calendar est **gratuite** pour la plupart des cas d'usage. Aucun coût n'est facturé pour :
- Création d'événements
- Mise à jour d'événements
- Suppression d'événements
- Lecture d'événements

Seuls les dépassements de quota très importants peuvent entraîner des frais (très rare).

## Support

Pour toute question ou problème :
1. Consultez la [documentation Google Calendar API](https://developers.google.com/calendar)
2. Vérifiez les logs Firebase Functions
3. Contactez le support GestiHotel
