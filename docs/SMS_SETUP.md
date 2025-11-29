# Configuration des notifications SMS avec Twilio

Ce document explique comment configurer les notifications SMS dans GestiHotel v2 en utilisant Twilio.

## Prerequisites

1. Un compte Twilio (gratuit pour les tests)
2. Firebase CLI installé et configuré
3. Accès aux Cloud Functions Firebase

## Etape 1: Créer un compte Twilio

1. Aller sur https://www.twilio.com/
2. Créer un compte gratuit
3. Vérifier votre email et votre numéro de téléphone
4. Obtenir un numéro de téléphone Twilio depuis la console

## Etape 2: Récupérer les credentials Twilio

Dans la console Twilio (https://console.twilio.com/):

1. **Account SID**: Trouvé sur la page d'accueil de la console
2. **Auth Token**: Cliquez sur "Show" pour révéler le token
3. **Phone Number**: Votre numéro Twilio au format international (ex: +15551234567)

## Etape 3: Configurer les variables d'environnement Firebase

### En local (pour les tests)

Créez un fichier `.env` dans le dossier `functions/`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### En production (Firebase Functions)

Utilisez la commande Firebase CLI:

```bash
firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="your_auth_token_here" \
  twilio.phone_number="+15551234567"
```

Vérifier la configuration:

```bash
firebase functions:config:get
```

## Etape 4: Déployer les Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions:sendSMS
```

## Etape 5: Activer les notifications SMS pour un utilisateur

### Dans l'interface utilisateur

1. Aller dans les paramètres du profil utilisateur
2. Section "Notifications"
3. Activer "Notifications SMS"
4. Ajouter un numéro de téléphone au format international (ex: +33612345678)
5. Sélectionner les types de notifications à recevoir par SMS

### Programmatiquement

```typescript
import { updatePreferences } from '@/shared/services/notificationService';

await updatePreferences(userId, establishmentId, {
  enableSMS: true,
  // Autres préférences...
});
```

## Utilisation du service SMS

### Envoyer un SMS simple

```typescript
import { sendSMS } from '@/shared/services/smsService';

const result = await sendSMS(
  '+33612345678',
  'Bonjour, ceci est un test de SMS'
);

if (result.success) {
  console.log('SMS envoyé:', result.sid);
} else {
  console.error('Erreur:', result.error);
}
```

### Envoyer une alerte d'intervention

```typescript
import { sendInterventionAlert } from '@/shared/services/smsService';

await sendInterventionAlert({
  phoneNumber: '+33612345678',
  intervention: {
    title: 'Fuite d\'eau',
    priority: 'urgent',
    room: '201',
    description: 'Fuite importante dans la salle de bain'
  }
});
```

### Envoyer une alerte urgente

```typescript
import { sendUrgentInterventionAlert } from '@/shared/services/smsService';

await sendUrgentInterventionAlert({
  phoneNumber: '+33612345678',
  intervention: {
    title: 'Incendie détecté',
    priority: 'urgent',
    room: '305'
  }
});
```

### Autres types d'alertes disponibles

- `sendInterventionAssignedAlert` - Intervention assignée
- `sendStatusChangeAlert` - Changement de statut
- `sendInterventionCompletedAlert` - Intervention terminée
- `sendSLAAtRiskAlert` - SLA à risque
- `sendSLABreachedAlert` - SLA dépassé

## Format des numéros de téléphone

Les numéros de téléphone doivent être au format international E.164:

- **France**: +33612345678 (pas de 0 initial)
- **Belgique**: +32471234567
- **Suisse**: +41791234567
- **USA**: +14155551234

### Utilitaires de validation

```typescript
import { isValidPhoneNumber, formatPhoneNumber } from '@/shared/services/smsService';

// Valider un numéro
const isValid = isValidPhoneNumber('+33612345678'); // true

// Formater un numéro français
const formatted = formatPhoneNumber('0612345678', '+33'); // +33612345678
```

## Coûts et limites

### Compte gratuit Twilio (Trial)

- Crédit initial: $15 USD
- Limitations:
  - Seuls les numéros vérifiés peuvent recevoir des SMS
  - Message "Sent from your Twilio trial account" ajouté aux SMS
  - Limite de débit

### Compte payant

- Prix par SMS (variable selon le pays):
  - France: ~0.06-0.08€ par SMS
  - Belgique: ~0.06-0.08€ par SMS
  - USA: ~$0.0075 par SMS

### Estimation des coûts

```typescript
import { estimateSMSCost, countSMSParts } from '@/shared/services/smsService';

const message = 'Votre message ici...';
const parts = countSMSParts(message); // Nombre de SMS
const cost = estimateSMSCost(message, 0.06); // Coût estimé en euros
```

## Logs et surveillance

### Logs Firestore

Tous les SMS envoyés sont enregistrés dans la collection `smsLogs`:

```typescript
{
  userId: string;
  to: string;
  message: string;
  interventionId?: string;
  twilioSid: string;
  status: string;
  sentAt: Timestamp;
}
```

### Logs Cloud Functions

Consultez les logs dans la console Firebase:

```bash
firebase functions:log --only sendSMS
```

Ou dans la console Google Cloud Platform:
https://console.cloud.google.com/logs

## Dépannage

### Erreur: "Twilio n'est pas configuré"

Vérifiez que les variables d'environnement sont bien configurées:

```bash
firebase functions:config:get
```

### Erreur: "Numéro de téléphone invalide"

Vérifiez le format E.164: +[code pays][numéro sans 0]

### Erreur: "The number +XXXX is unverified" (compte trial)

Avec un compte trial, vous devez vérifier chaque numéro de téléphone dans la console Twilio:
1. Aller sur https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Cliquer "Add a new Caller ID"
3. Suivre les instructions de vérification

### SMS non reçus

1. Vérifier les logs Cloud Functions
2. Vérifier le crédit Twilio disponible
3. Vérifier que le numéro est au bon format
4. Pour les comptes trial, vérifier que le numéro est vérifié

## Sécurité

- Ne JAMAIS commiter les credentials Twilio dans le code
- Utiliser les variables d'environnement Firebase
- Les credentials sont uniquement accessibles côté serveur (Cloud Functions)
- Le client appelle la Cloud Function qui gère les credentials de manière sécurisée

## Ressources

- Documentation Twilio: https://www.twilio.com/docs
- Console Twilio: https://console.twilio.com
- Pricing Twilio: https://www.twilio.com/pricing
- Firebase Functions: https://firebase.google.com/docs/functions
