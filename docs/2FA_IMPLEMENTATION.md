# Authentification à Deux Facteurs (2FA/MFA) - Documentation

## Vue d'ensemble

Cette implémentation ajoute l'authentification à deux facteurs (2FA) basée sur TOTP (Time-based One-Time Password) au projet GestiHôtel v2. Les utilisateurs peuvent sécuriser leurs comptes avec Google Authenticator, Authy, ou toute autre application d'authentification compatible TOTP.

## Architecture

### Structure des fichiers

```
src/features/auth/
├── components/
│   ├── TwoFactorSetup.tsx        # Composant pour activer/désactiver 2FA
│   ├── TwoFactorVerify.tsx       # Composant de vérification au login
│   └── LoginFormWithTwoFactor.tsx # LoginForm avec support 2FA
├── services/
│   └── twoFactorService.ts       # Service principal 2FA
└── types/
    └── twoFactor.types.ts        # Types TypeScript pour 2FA
```

### Dépendances

- **otplib**: Génération et vérification des codes TOTP
- **qrcode**: Génération de QR codes pour la configuration
- **@types/qrcode**: Types TypeScript pour qrcode

## Fonctionnalités

### 1. Configuration 2FA (TwoFactorSetup)

Le composant `TwoFactorSetup` permet aux utilisateurs de :

- Activer 2FA avec un QR code
- Désactiver 2FA
- Voir et régénérer les codes de secours
- Télécharger les codes de secours

**Emplacement**: Page Paramètres > Sécurité

### 2. Vérification 2FA (TwoFactorVerify)

Le composant `TwoFactorVerify` s'affiche lors du login pour :

- Demander le code à 6 chiffres de l'application d'authentification
- Permettre l'utilisation de codes de secours (8 caractères alphanumériques)
- Gérer les erreurs de vérification

### 3. Service 2FA (twoFactorService)

Le service fournit les fonctions suivantes :

#### Génération de secret

```typescript
generateSecret(email: string): TwoFactorSecret
```

Génère un nouveau secret TOTP pour un utilisateur.

#### Génération de QR code

```typescript
generateQRCode(otpauthUrl: string): Promise<string>
```

Génère une image QR code à partir de l'URL otpauth.

#### Vérification de token

```typescript
verifyToken(secret: string, token: string): boolean
```

Vérifie si un code TOTP est valide.

#### Activation 2FA

```typescript
enable2FA(userId: string, data: TwoFactorSetupData): Promise<void>
```

Active 2FA pour un utilisateur après vérification du code.

#### Désactivation 2FA

```typescript
disable2FA(userId: string): Promise<void>
```

Désactive 2FA pour un utilisateur.

#### Vérification du statut

```typescript
is2FAEnabled(userId: string): Promise<boolean>
```

Vérifie si 2FA est activé pour un utilisateur.

#### Vérification lors du login

```typescript
verify2FAToken(userId: string, token: string): Promise<TwoFactorVerificationResult>
```

Vérifie un code TOTP ou un code de secours lors du login.

#### Codes de secours

```typescript
generateBackupCodes(count: number = 10): string[]
getBackupCodes(userId: string): Promise<string[]>
regenerateBackupCodes(userId: string): Promise<string[]>
```

Gère les codes de secours pour récupération de compte.

## Structure Firestore

Les données 2FA sont stockées dans le document utilisateur :

```typescript
interface UserTwoFactorSettings {
  twoFactorEnabled: boolean; // Statut 2FA
  twoFactorSecret?: string; // Secret chiffré
  twoFactorBackupCodes?: string[]; // Codes de secours chiffrés
  twoFactorEnabledAt?: Date; // Date d'activation
}
```

**Collection**: `users/{userId}`

## Sécurité

### Chiffrement

Les secrets et codes de secours sont chiffrés avant stockage en base de données :

- Algorithme XOR simple (pour développement)
- **IMPORTANT**: Pour la production, utilisez une bibliothèque de chiffrement robuste (ex: crypto-js, node-forge)

### Clé de chiffrement

La clé est définie dans `twoFactorService.ts` :

```typescript
const key = 'GESTIHOTEL_2FA_KEY';
```

**IMPORTANT**: En production, stockez cette clé dans les variables d'environnement.

### Codes de secours

- 10 codes générés par défaut
- Codes alphanumériques de 8 caractères
- Utilisables une seule fois
- Supprimés après utilisation
- Peuvent être régénérés

## Flow utilisateur

### Activation de 2FA

1. L'utilisateur va dans Paramètres > Sécurité
2. Clique sur "Enable Two-Factor Authentication"
3. Scanne le QR code avec son application d'authentification
4. Entre le code à 6 chiffres pour vérifier
5. Sauvegarde les codes de secours

### Login avec 2FA

1. L'utilisateur entre email/mot de passe
2. Le système vérifie si 2FA est activé
3. Si oui, affiche l'écran de vérification 2FA
4. L'utilisateur entre le code à 6 chiffres ou un code de secours
5. Après vérification, redirection vers le dashboard

### Désactivation de 2FA

1. L'utilisateur va dans Paramètres > Sécurité
2. Clique sur "Disable 2FA"
3. Confirme la désactivation
4. Les données 2FA sont supprimées

## Configuration TOTP

```typescript
authenticator.options = {
  window: 1, // Accepte 1 pas avant/après (±30 secondes)
  step: 30, // Fenêtre de validité de 30 secondes
};
```

## Intégration avec LoginForm

Pour utiliser le LoginForm avec support 2FA, importez `LoginFormWithTwoFactor` au lieu de `LoginForm` :

```typescript
import { LoginForm } from '@/features/auth/components/LoginFormWithTwoFactor';
```

Le composant gère automatiquement le flow 2FA.

## Applications d'authentification compatibles

- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator
- 1Password
- Bitwarden
- LastPass Authenticator

## Tests

Pour tester l'implémentation :

1. **Activer 2FA**:
   - Créez un compte de test
   - Activez 2FA dans les paramètres
   - Utilisez une application d'authentification

2. **Vérifier le login**:
   - Déconnectez-vous
   - Reconnectez-vous avec email/mot de passe
   - Entrez le code 2FA

3. **Tester les codes de secours**:
   - Tentez un login avec un code de secours
   - Vérifiez qu'il ne peut être utilisé qu'une fois

4. **Désactiver 2FA**:
   - Désactivez 2FA dans les paramètres
   - Vérifiez que le login ne demande plus de code

## Améliorations futures

- [ ] Support 2FA pour l'authentification Google
- [ ] Notification par email lors de l'activation/désactivation de 2FA
- [ ] Historique des tentatives de connexion
- [ ] Support des clés de sécurité matérielles (WebAuthn/FIDO2)
- [ ] Chiffrement renforcé pour la production
- [ ] Tests unitaires et d'intégration
- [ ] Rate limiting sur les tentatives de vérification
- [ ] Logs d'audit pour les actions 2FA

## Dépannage

### Le QR code ne s'affiche pas

- Vérifiez que la bibliothèque `qrcode` est installée
- Vérifiez les permissions dans la console navigateur

### Le code n'est jamais accepté

- Vérifiez que l'heure de l'appareil est synchronisée
- Vérifiez que le secret est correctement stocké
- Augmentez la fenêtre de tolérance (`window: 2`)

### Impossible de se connecter après activation

- Utilisez un code de secours
- Contactez l'administrateur pour désactiver 2FA manuellement

## Support

Pour toute question ou problème, consultez la documentation ou créez une issue sur le dépôt GitHub.
