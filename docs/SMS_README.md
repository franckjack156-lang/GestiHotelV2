# Documentation des Notifications SMS

Cette documentation couvre l'implémentation complète des notifications SMS dans GestiHotel v2 utilisant Twilio.

## Table des matières

1. [Quick Start](#quick-start) - Pour commencer rapidement
2. [Setup complet](#setup-complet) - Configuration détaillée
3. [Intégration](#intégration) - Exemples d'utilisation
4. [Résumé technique](#résumé-technique) - Vue d'ensemble de l'implémentation

## Fichiers de documentation

### 1. Quick Start (COMMENCEZ ICI)
**Fichier**: `SMS_QUICK_START.md`

Guide rapide en 5 minutes pour:
- Configurer Twilio
- Déployer la fonction
- Envoyer votre premier SMS
- Dépannage rapide

### 2. Setup complet
**Fichier**: `SMS_SETUP.md`

Guide détaillé couvrant:
- Création du compte Twilio
- Configuration Firebase Functions
- Variables d'environnement
- Déploiement
- Monitoring et logs
- Coûts et limites
- Dépannage avancé

### 3. Exemples d'intégration
**Fichier**: `SMS_INTEGRATION_EXAMPLE.md`

Exemples de code pour:
- Intégration avec les interventions
- Hooks React personnalisés
- Cloud Functions Triggers
- Scheduled Functions
- Tests unitaires
- Bonnes pratiques

### 4. Résumé technique
**Fichier**: `SMS_IMPLEMENTATION_SUMMARY.md`

Vue d'ensemble technique:
- Architecture
- Fichiers créés
- Dépendances
- Sécurité
- Prochaines étapes

## Fichiers de code créés

### Backend (Cloud Functions)

| Fichier | Description |
|---------|-------------|
| `functions/src/sms.ts` | Cloud Function pour l'envoi de SMS |
| `functions/src/index.ts` | Export de la fonction sendSMS |
| `functions/.env.example` | Exemple de configuration locale |

### Frontend (Client)

| Fichier | Description |
|---------|-------------|
| `src/shared/services/smsService.ts` | Service client pour les SMS |
| `src/shared/components/SMSNotificationSettings.tsx` | Composant UI de configuration |
| `src/shared/services/__tests__/smsService.test.ts` | Tests unitaires |

## Utilisation rapide

### Envoyer un SMS simple

```typescript
import { sendSMS } from '@/shared/services/smsService';

const result = await sendSMS('+33612345678', 'Votre message');
```

### Envoyer une alerte d'intervention

```typescript
import { sendInterventionAlert } from '@/shared/services/smsService';

await sendInterventionAlert({
  phoneNumber: '+33612345678',
  intervention: {
    title: 'Fuite d\'eau',
    priority: 'urgent',
    room: '201'
  }
});
```

## Configuration requise

### Twilio
- Account SID
- Auth Token
- Phone Number

### Firebase Functions

```bash
firebase functions:config:set \
  twilio.account_sid="AC..." \
  twilio.auth_token="..." \
  twilio.phone_number="+1..."
```

## Structure des fichiers

```
gestihotel-v2/
├── functions/
│   ├── src/
│   │   ├── sms.ts                    # Cloud Function SMS
│   │   └── index.ts                  # Export
│   └── .env.example                  # Config locale
├── src/
│   └── shared/
│       ├── services/
│       │   ├── smsService.ts         # Service client
│       │   └── __tests__/
│       │       └── smsService.test.ts
│       └── components/
│           └── SMSNotificationSettings.tsx
└── docs/
    ├── SMS_README.md                 # Ce fichier
    ├── SMS_QUICK_START.md            # Quick start
    ├── SMS_SETUP.md                  # Setup complet
    ├── SMS_INTEGRATION_EXAMPLE.md    # Exemples
    └── SMS_IMPLEMENTATION_SUMMARY.md # Résumé technique
```

## Par où commencer?

1. **Nouveau sur Twilio?** → Commencez par `SMS_QUICK_START.md`
2. **Configuration production?** → Consultez `SMS_SETUP.md`
3. **Intégration dans le code?** → Voir `SMS_INTEGRATION_EXAMPLE.md`
4. **Vue d'ensemble technique?** → Lire `SMS_IMPLEMENTATION_SUMMARY.md`

## Commandes essentielles

```bash
# Installation (déjà fait)
cd functions && npm install twilio

# Build
npm run build

# Deploy
firebase deploy --only functions:sendSMS

# Logs
firebase functions:log --only sendSMS
```

## Support

### Documentation
- Twilio: https://www.twilio.com/docs
- Firebase Functions: https://firebase.google.com/docs/functions

### Consoles
- Twilio Console: https://console.twilio.com
- Firebase Console: https://console.firebase.google.com

### Pricing
- Twilio Pricing: https://www.twilio.com/pricing/messaging
- Firebase Pricing: https://firebase.google.com/pricing

## Version

- **Date**: 2025-11-29
- **Version**: 1.0.0
- **Status**: ✅ Implémenté et testé

## Licence

Propriétaire - GestiHotel v2
