# Authentification à Deux Facteurs (2FA) - Guide Rapide

## Activation pour un utilisateur

1. Allez dans **Paramètres** > **Sécurité**
2. Section "Two-Factor Authentication"
3. Cliquez sur **"Enable Two-Factor Authentication"**
4. Scannez le QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
5. Entrez le code à 6 chiffres affiché dans l'application
6. **IMPORTANT**: Sauvegardez les 10 codes de secours affichés

## Login avec 2FA

Une fois 2FA activé, lors de la connexion :

1. Entrez votre email et mot de passe normalement
2. Un écran de vérification 2FA apparaît
3. Entrez le code à 6 chiffres de votre application d'authentification
4. Vous êtes redirigé vers le dashboard

## Utiliser un code de secours

Si vous n'avez pas accès à votre application d'authentification :

1. Sur l'écran de vérification 2FA, cliquez sur **"Use backup code instead"**
2. Entrez un de vos codes de secours (8 caractères)
3. **Note**: Chaque code ne peut être utilisé qu'une seule fois

## Gérer les codes de secours

Dans **Paramètres** > **Sécurité** :

- **View Backup Codes**: Affiche vos codes de secours restants
- **Regenerate Codes**: Génère 10 nouveaux codes (les anciens sont invalidés)
- **Download**: Télécharge les codes dans un fichier texte

## Désactiver 2FA

1. Allez dans **Paramètres** > **Sécurité**
2. Cliquez sur **"Disable 2FA"**
3. Confirmez la désactivation
4. 2FA est désactivé, vous pouvez vous connecter uniquement avec email/mot de passe

## Applications d'authentification recommandées

- **Google Authenticator** (gratuit, iOS/Android)
- **Authy** (gratuit, iOS/Android/Desktop, avec backup cloud)
- **Microsoft Authenticator** (gratuit, iOS/Android)
- **1Password** (payant, multi-plateforme, avec gestionnaire de mots de passe)

## Sécurité

- Les codes de secours sont chiffrés dans la base de données
- Les secrets TOTP sont chiffrés
- Les codes changent toutes les 30 secondes
- Fenêtre de tolérance : ±30 secondes (pour compenser les décalages d'horloge)

## Dépannage

### Le code n'est jamais accepté

1. Vérifiez que l'heure de votre appareil est synchronisée
2. Assurez-vous d'utiliser le bon code (il change toutes les 30 secondes)
3. Essayez le code suivant si vous êtes à la limite des 30 secondes

### J'ai perdu mon téléphone et mes codes de secours

Contactez un administrateur pour désactiver 2FA sur votre compte.

### Le QR code ne s'affiche pas

1. Réessayez
2. Utilisez la saisie manuelle du secret (affiché sous le QR code)
3. Vérifiez votre connexion internet

## Pour les développeurs

- **Service**: `src/features/auth/services/twoFactorService.ts`
- **Composants**:
  - `src/features/auth/components/TwoFactorSetup.tsx`
  - `src/features/auth/components/TwoFactorVerify.tsx`
- **Types**: `src/features/auth/types/twoFactor.types.ts`
- **Documentation complète**: `docs/2FA_IMPLEMENTATION.md`
