# Guide de Migration - Authentification à Deux Facteurs (2FA)

## Vue d'ensemble

Ce guide explique comment activer l'authentification à deux facteurs dans votre projet GestiHôtel v2.

## Prérequis

Assurez-vous que les dépendances sont installées :

```bash
npm install otplib qrcode @types/qrcode
```

## Étapes de Migration

### Étape 1 : Utiliser le nouveau LoginForm

#### Option A : Remplacer le LoginForm existant

Renommez le fichier existant et utilisez la nouvelle version :

```bash
mv src/features/auth/components/LoginForm.tsx src/features/auth/components/LoginForm.old.tsx
mv src/features/auth/components/LoginFormWithTwoFactor.tsx src/features/auth/components/LoginForm.tsx
```

#### Option B : Import conditionnel

Dans votre page de login, importez le nouveau composant :

```typescript
// Avant
import { LoginForm } from '@/features/auth/components/LoginForm';

// Après
import { LoginForm } from '@/features/auth/components/LoginFormWithTwoFactor';
```

### Étape 2 : Vérifier l'intégration dans Settings

La section 2FA devrait déjà être intégrée dans `SecuritySection.tsx`. Vérifiez que l'import est présent :

```typescript
import { TwoFactorSetup } from '@/features/auth/components/TwoFactorSetup';
```

Et que le composant est rendu :

```tsx
return (
  <div className="space-y-6">
    {/* Two-Factor Authentication Section */}
    <TwoFactorSetup />

    {/* Password Change Section */}
    <Card>{/* ... */}</Card>
  </div>
);
```

### Étape 3 : Configurer Firestore

Assurez-vous que les règles Firestore autorisent les utilisateurs à lire et écrire leurs données 2FA :

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Étape 4 : Configuration de production

Pour la production, configurez les variables d'environnement :

```env
# .env.production
VITE_2FA_ENCRYPTION_KEY=your-super-secret-key-here-min-32-chars
```

Puis modifiez `twoFactorService.ts` :

```typescript
// Avant
const key = 'GESTIHOTEL_2FA_KEY';

// Après
const key = import.meta.env.VITE_2FA_ENCRYPTION_KEY || 'GESTIHOTEL_2FA_KEY';
```

**IMPORTANT** : Utilisez une bibliothèque de chiffrement robuste pour la production :

```bash
npm install crypto-js @types/crypto-js
```

Puis remplacez les fonctions `encryptSecret` et `decryptSecret` :

```typescript
import CryptoJS from 'crypto-js';

const encryptSecret = (secret: string): string => {
  const key = import.meta.env.VITE_2FA_ENCRYPTION_KEY || 'GESTIHOTEL_2FA_KEY';
  return CryptoJS.AES.encrypt(secret, key).toString();
};

const decryptSecret = (encrypted: string): string => {
  const key = import.meta.env.VITE_2FA_ENCRYPTION_KEY || 'GESTIHOTEL_2FA_KEY';
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

## Test de la Migration

### Test 1 : Activer 2FA

1. Connectez-vous à votre application
2. Allez dans Paramètres > Sécurité
3. Cliquez sur "Enable Two-Factor Authentication"
4. Scannez le QR code avec Google Authenticator
5. Entrez le code de vérification
6. Sauvegardez les codes de secours

### Test 2 : Login avec 2FA

1. Déconnectez-vous
2. Reconnectez-vous avec vos identifiants
3. Vérifiez que l'écran 2FA s'affiche
4. Entrez le code de votre application d'authentification
5. Vérifiez que vous êtes redirigé vers le dashboard

### Test 3 : Code de secours

1. Déconnectez-vous
2. Reconnectez-vous avec vos identifiants
3. Cliquez sur "Use backup code instead"
4. Entrez un code de secours
5. Vérifiez que vous êtes connecté
6. Vérifiez que le code ne peut plus être réutilisé

### Test 4 : Désactiver 2FA

1. Allez dans Paramètres > Sécurité
2. Cliquez sur "Disable 2FA"
3. Confirmez la désactivation
4. Déconnectez-vous et reconnectez-vous
5. Vérifiez que 2FA n'est plus demandé

## Compatibilité

Cette implémentation est compatible avec :

- Firebase Auth (Email/Password et Google)
- Firestore pour le stockage des données
- Toutes les applications d'authentification TOTP standard

## Rollback

Si vous rencontrez des problèmes, vous pouvez revenir à l'ancienne version :

```bash
# Si vous avez renommé le fichier
mv src/features/auth/components/LoginForm.old.tsx src/features/auth/components/LoginForm.tsx
```

Ou commentez simplement la section 2FA dans `SecuritySection.tsx` :

```typescript
// <TwoFactorSetup />
```

## Support

Si vous rencontrez des problèmes lors de la migration :

1. Vérifiez que toutes les dépendances sont installées
2. Vérifiez les logs de la console navigateur
3. Vérifiez les règles Firestore
4. Consultez la documentation complète dans `2FA_IMPLEMENTATION.md`

## Checklist de Migration

- [ ] Dépendances installées (otplib, qrcode)
- [ ] LoginForm mis à jour
- [ ] SecuritySection vérifié
- [ ] Règles Firestore configurées
- [ ] Variables d'environnement configurées (production)
- [ ] Chiffrement renforcé (production)
- [ ] Tests effectués
- [ ] Documentation lue

## Prochaines étapes

Après la migration, envisagez :

1. Ajouter des notifications par email pour les changements 2FA
2. Implémenter un historique des connexions
3. Ajouter le support WebAuthn/FIDO2
4. Créer des tests automatisés
5. Mettre en place des logs d'audit

## Questions fréquentes

### Q: Que se passe-t-il si un utilisateur perd son téléphone ?

R: Il peut utiliser les codes de secours sauvegardés. Si perdus, un administrateur doit désactiver 2FA manuellement.

### Q: Le 2FA est-il obligatoire pour tous les utilisateurs ?

R: Non, il est optionnel. Les utilisateurs peuvent l'activer dans leurs paramètres.

### Q: Comment désactiver 2FA pour un utilisateur en tant qu'admin ?

R: Accédez à Firestore et modifiez le document utilisateur :

```javascript
{
  twoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorBackupCodes: null
}
```

### Q: Les codes de secours expirent-ils ?

R: Non, ils restent valides jusqu'à utilisation ou régénération.
