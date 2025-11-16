# Firebase Cloud Functions - GestiHotel

## Configuration

### 1. Installation des dépendances

```bash
cd functions
npm install
```

### 2. Configuration de Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API dans la section [API Keys](https://resend.com/api-keys)
3. Configurez la clé API pour Firebase :

```bash
# En production
firebase functions:config:set resend.api_key="re_your_actual_api_key_here"

# Pour les émulateurs locaux, créez un fichier .env.local
cp .env.example .env.local
# Puis éditez .env.local et remplacez la clé API
```

### 3. Configuration du domaine d'envoi (Important !)

Par défaut, la fonction utilise `onboarding@resend.dev` comme expéditeur.
Pour un usage en production, vous devez :

1. Aller sur [Resend Domains](https://resend.com/domains)
2. Ajouter et vérifier votre domaine
3. Modifier `functions/src/index.ts` ligne ~170 :

```typescript
from: 'GestiHotel <noreply@votredomaine.com>', // Remplacer par votre domaine vérifié
```

## Développement local

### Lancer les émulateurs

```bash
# Depuis la racine du projet
npm run emulators
```

Les Functions seront disponibles sur `http://localhost:5001`

### Tester la fonction

Vous pouvez tester l'envoi d'email depuis l'application web en utilisant les émulateurs.

## Déploiement

### Déployer uniquement les functions

```bash
firebase deploy --only functions
```

### Déployer tout le projet

```bash
firebase deploy
```

## Functions disponibles

### `sendPartOrderEmail`

Envoie un email de commande de pièces.

**Paramètres :**
```typescript
{
  to: string;                    // Email du destinataire
  establishmentName: string;     // Nom de l'établissement
  interventionNumber?: string;   // Numéro d'intervention
  roomNumber?: string;           // Numéro de chambre
  parts: Array<{                 // Liste des pièces
    name: string;
    reference?: string;
    quantity: number;
    unitPrice: number;
    supplier?: string;
  }>;
  requestedBy: string;           // Nom du demandeur
  requestedAt: string;           // Date de la demande
}
```

**Retour :**
```typescript
{
  success: boolean;
  messageId?: string;
}
```

## Dépannage

### La fonction ne se déploie pas

Vérifiez que vous avez configuré la clé API :
```bash
firebase functions:config:get
```

### L'email n'est pas envoyé

1. Vérifiez les logs :
```bash
firebase functions:log
```

2. Vérifiez que votre clé API Resend est valide
3. Vérifiez que vous avez configuré un domaine vérifié pour la production

### Erreur de permissions

Assurez-vous que l'utilisateur est authentifié. La fonction vérifie `context.auth`.

## Coûts

- **Resend** : Gratuit jusqu'à 3000 emails/mois, puis $20/mois pour 50 000 emails
- **Firebase Functions** : Inclus dans le plan Blaze (pay-as-you-go)
  - 2 millions d'invocations gratuites par mois
  - 400 000 GB-secondes gratuits par mois
