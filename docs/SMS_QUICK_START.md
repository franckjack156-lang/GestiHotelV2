# Quick Start - Notifications SMS

Guide rapide pour démarrer avec les notifications SMS dans GestiHotel v2.

## Prérequis

- [ ] Compte Twilio créé (https://www.twilio.com/try-twilio)
- [ ] Numéro Twilio obtenu
- [ ] Firebase CLI installé (`npm install -g firebase-tools`)
- [ ] Authentifié avec Firebase (`firebase login`)

## Installation (Déjà fait)

```bash
cd functions
npm install twilio
```

## Configuration - Étape par étape

### 1. Récupérer les credentials Twilio

1. Aller sur https://console.twilio.com/
2. Copier votre **Account SID**
3. Copier votre **Auth Token** (cliquer sur "Show")
4. Noter votre **Phone Number** (format: +15551234567)

### 2. Configuration locale (pour les tests)

Créer un fichier `.env` dans le dossier `functions/`:

```bash
cd functions
cp .env.example .env
```

Éditer `.env` et remplir avec vos vraies valeurs:

```env
TWILIO_ACCOUNT_SID=AC123...
TWILIO_AUTH_TOKEN=abc123...
TWILIO_PHONE_NUMBER=+15551234567
```

### 3. Configuration production (Firebase)

```bash
firebase functions:config:set \
  twilio.account_sid="AC123..." \
  twilio.auth_token="abc123..." \
  twilio.phone_number="+15551234567"
```

Vérifier:

```bash
firebase functions:config:get
```

## Déploiement

### 1. Build

```bash
cd functions
npm run build
```

### 2. Deploy

```bash
# Déployer uniquement la fonction SMS
firebase deploy --only functions:sendSMS

# Ou déployer toutes les fonctions
firebase deploy --only functions
```

## Test rapide

### Dans le code client

```typescript
import { sendSMS } from '@/shared/services/smsService';

// Envoyer un SMS simple
const result = await sendSMS('+33612345678', 'Test de SMS depuis GestiHotel');

if (result.success) {
  console.log('SMS envoyé!', result.sid);
} else {
  console.error('Erreur:', result.error);
}
```

### Avec curl (pour tester la Cloud Function directement)

```bash
# 1. Obtenir un token d'authentification Firebase
# (remplacer PROJECT_ID et YOUR_AUTH_TOKEN)

curl -X POST \
  https://europe-west1-PROJECT_ID.cloudfunctions.net/sendSMS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "to": "+33612345678",
    "message": "Test SMS"
  }'
```

## Vérifier que ça fonctionne

### 1. Logs Firebase

```bash
firebase functions:log --only sendSMS
```

### 2. Console Twilio

Aller sur https://console.twilio.com/us1/monitor/logs/messages

### 3. Collection Firestore

Vérifier la collection `smsLogs` dans Firebase Console

## Intégration dans l'application

### 1. Activer les SMS pour un utilisateur

Ajouter le composant dans les paramètres utilisateur:

```typescript
import { SMSNotificationSettings } from '@/shared/components/SMSNotificationSettings';

// Dans votre page de paramètres
<SMSNotificationSettings />
```

### 2. Envoyer des alertes automatiques

```typescript
import { sendInterventionAlert } from '@/shared/services/smsService';
import { getPreferences } from '@/shared/services/notificationService';

// Lors de la création d'une intervention urgente
if (intervention.priority === 'urgent' && technician.phoneNumber) {
  const prefs = await getPreferences(technician.id, establishmentId);

  if (prefs?.enableSMS) {
    await sendInterventionAlert({
      phoneNumber: technician.phoneNumber,
      intervention: {
        title: intervention.title,
        priority: intervention.priority,
        room: intervention.roomNumber,
      },
    });
  }
}
```

## Compte Twilio Trial - Important

Avec un compte trial (gratuit):

1. **Crédit**: $15 USD offerts
2. **Limitation**: Seuls les numéros vérifiés peuvent recevoir des SMS
3. **Message**: "Sent from your Twilio trial account" ajouté au début du SMS

### Vérifier un numéro de téléphone (Trial)

1. Aller sur https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Cliquer "Add a new Caller ID"
3. Entrer le numéro à vérifier
4. Suivre les instructions (code de vérification par appel ou SMS)

## Dépannage rapide

### Erreur: "Twilio n'est pas configuré"

```bash
# Vérifier la config
firebase functions:config:get

# Re-configurer si nécessaire
firebase functions:config:set twilio.account_sid="AC..." twilio.auth_token="..." twilio.phone_number="+1..."
```

### Erreur: "The number +XXX is unverified"

Compte trial: vérifier le numéro dans la console Twilio (voir ci-dessus)

### Erreur: "Numéro de téléphone invalide"

Vérifier le format E.164: +[code pays][numéro sans 0]
- France: +33612345678 (pas +33 0612345678)
- USA: +14155551234

### SMS non reçu

1. Vérifier les logs: `firebase functions:log --only sendSMS`
2. Vérifier le crédit Twilio
3. Vérifier que le numéro est au bon format
4. Compte trial: vérifier que le numéro est vérifié

## Commandes utiles

```bash
# Build
cd functions && npm run build

# Deploy fonction SMS uniquement
firebase deploy --only functions:sendSMS

# Deploy toutes les fonctions
firebase deploy --only functions

# Logs en temps réel
firebase functions:log --only sendSMS --tail

# Voir la config
firebase functions:config:get

# Supprimer une config
firebase functions:config:unset twilio

# Lister les fonctions déployées
firebase functions:list
```

## Exemples de messages

### Intervention urgente

```
🚨 URGENT - Fuite d'eau
Priorité: urgent
Chambre: 201
Action immédiate requise!
```

### Intervention assignée

```
📋 Vous avez été assigné à: Climatisation défaillante
Chambre: 305
```

### SLA à risque

```
⚠️ SLA à risque: Réparation ascenseur
Temps restant: 25 minutes
```

### SLA dépassé

```
🔴 SLA DÉPASSÉ: Problème électrique
Action urgente requise!
```

## Coûts

### Compte Trial
- Gratuit avec $15 de crédit
- ~200 SMS selon les destinations

### Compte Production
- France: ~0.06-0.08€ par SMS
- USA: ~$0.0075 par SMS
- Pas d'abonnement mensuel
- Facturation à l'usage

### Estimation mensuelle (France)
- 100 SMS/mois: ~6-8€
- 500 SMS/mois: ~30-40€
- 1000 SMS/mois: ~60-80€

## Prochaines étapes

1. [ ] Tester l'envoi d'un SMS
2. [ ] Déployer la fonction sur Firebase
3. [ ] Ajouter le composant SMS Settings dans l'UI
4. [ ] Intégrer avec les interventions
5. [ ] Configurer les triggers automatiques
6. [ ] Passer en compte Twilio production si nécessaire

## Documentation complète

- Setup complet: `/docs/SMS_SETUP.md`
- Exemples d'intégration: `/docs/SMS_INTEGRATION_EXAMPLE.md`
- Résumé implémentation: `/docs/SMS_IMPLEMENTATION_SUMMARY.md`

## Support

- Documentation Twilio: https://www.twilio.com/docs
- Console Twilio: https://console.twilio.com
- Pricing Twilio: https://www.twilio.com/pricing/messaging

---

**Besoin d'aide?** Consultez la documentation complète dans `/docs/SMS_*.md`
