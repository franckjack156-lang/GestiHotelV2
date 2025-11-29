# Guide de Test - Authentification 2FA

## Prérequis

1. Application d'authentification installée sur votre téléphone :
   - Google Authenticator (recommandé pour les tests)
   - Authy
   - Microsoft Authenticator

2. Projet démarré en mode développement :

   ```bash
   npm run dev
   ```

3. Compte utilisateur de test créé

## Scénario 1 : Activation de 2FA

### Étapes

1. **Connexion**
   - Connectez-vous avec vos identifiants
   - Email : test@example.com
   - Mot de passe : votreMotDePasse

2. **Navigation vers Paramètres**
   - Cliquez sur votre profil (coin supérieur droit)
   - Sélectionnez "Paramètres"
   - Allez dans l'onglet "Sécurité"

3. **Activer 2FA**
   - Localisez la section "Two-Factor Authentication"
   - Statut actuel : "Inactive"
   - Cliquez sur "Enable Two-Factor Authentication"

4. **Scanner le QR Code**
   - Une modal s'ouvre avec un QR code
   - Ouvrez Google Authenticator sur votre téléphone
   - Appuyez sur "+" puis "Scanner un code QR"
   - Scannez le QR code affiché

5. **Alternative : Saisie manuelle**
   - Si le QR code ne fonctionne pas :
     - Cliquez sur le bouton copier à côté du secret
     - Dans Google Authenticator : "+" → "Saisir une clé de configuration"
     - Nom du compte : GestiHôtel Test
     - Clé : collez le secret copié
     - Type : Temporel

6. **Vérification**
   - Cliquez sur "Next: Verify Code"
   - Entrez le code à 6 chiffres affiché dans Google Authenticator
   - Cliquez sur "Enable 2FA"

7. **Codes de secours**
   - 10 codes de secours s'affichent
   - **IMPORTANT** : Téléchargez-les ou copiez-les
   - Cliquez sur "Download" pour sauvegarder dans un fichier
   - Cliquez sur "Done"

### Résultat attendu

- Section 2FA affiche maintenant "Active"
- Badge vert "Active" visible
- Boutons "View Backup Codes" et "Disable 2FA" disponibles

## Scénario 2 : Login avec 2FA

### Étapes

1. **Déconnexion**
   - Cliquez sur votre profil
   - Sélectionnez "Se déconnecter"

2. **Login classique**
   - Entrez votre email
   - Entrez votre mot de passe
   - Cliquez sur "Se connecter"

3. **Vérification 2FA**
   - Un nouvel écran apparaît : "Two-Factor Authentication"
   - Un champ pour le code à 6 chiffres est affiché
   - Ouvrez Google Authenticator
   - Trouvez le compte "GestiHôtel Test"
   - Notez le code à 6 chiffres

4. **Saisie du code**
   - Entrez le code dans le champ
   - Cliquez sur "Verify"

### Résultat attendu

- Redirection vers le dashboard
- Connexion réussie

### Erreurs possibles

- **"Invalid verification code"** :
  - Attendez que le code change (cercle de progression)
  - Réessayez avec le nouveau code
  - Vérifiez que l'heure de votre appareil est synchronisée

## Scénario 3 : Utilisation d'un code de secours

### Étapes

1. **Déconnexion**
   - Déconnectez-vous

2. **Login classique**
   - Entrez email et mot de passe
   - Cliquez sur "Se connecter"

3. **Basculer vers code de secours**
   - Sur l'écran 2FA, cliquez sur "Use backup code instead"
   - Le champ change pour accepter 8 caractères alphanumériques

4. **Entrer un code de secours**
   - Ouvrez votre fichier de codes de secours
   - Copiez un code (ex: ABC12345)
   - Collez-le dans le champ
   - Cliquez sur "Verify"

### Résultat attendu

- Connexion réussie
- Le code de secours utilisé ne peut plus être réutilisé

### Test de réutilisation

1. Déconnectez-vous
2. Tentez de vous reconnecter avec le même code de secours
3. **Résultat attendu** : Erreur "Invalid verification code"

## Scénario 4 : Gestion des codes de secours

### Visualiser les codes

1. **Navigation**
   - Paramètres > Sécurité
   - Section "Two-Factor Authentication"
   - Cliquez sur "View Backup Codes"

2. **Vérification**
   - Modal affiche les codes restants
   - Le code utilisé précédemment ne doit plus apparaître
   - Seulement 9 codes visibles maintenant

### Régénérer les codes

1. **Régénération**
   - Dans la modal des codes de secours
   - Cliquez sur "Regenerate Codes"

2. **Confirmation**
   - 10 nouveaux codes sont générés
   - Les anciens codes sont invalidés

3. **Téléchargement**
   - Cliquez sur "Download"
   - Vérifiez que le fichier contient les nouveaux codes

### Résultat attendu

- Nouveaux codes différents des précédents
- Anciens codes ne fonctionnent plus

## Scénario 5 : Désactivation de 2FA

### Étapes

1. **Navigation**
   - Paramètres > Sécurité
   - Section "Two-Factor Authentication"

2. **Désactivation**
   - Cliquez sur "Disable 2FA"
   - Modal de confirmation s'affiche
   - Lisez l'avertissement

3. **Confirmation**
   - Cliquez sur "Disable 2FA" (bouton rouge)

### Résultat attendu

- Section 2FA affiche "Inactive"
- Badge gris "Inactive"
- Bouton "Enable Two-Factor Authentication" réapparaît

### Vérification

1. **Test de login**
   - Déconnectez-vous
   - Reconnectez-vous avec email/mot de passe
   - **Résultat attendu** : Redirection directe au dashboard (pas de 2FA)

## Scénario 6 : Tests d'erreur

### Code expiré

1. Notez un code TOTP
2. Attendez 30 secondes qu'il change
3. Tentez de vous connecter avec l'ancien code
4. **Résultat attendu** : Erreur "Invalid verification code"

### Code invalide

1. Entrez "123456" (code aléatoire)
2. **Résultat attendu** : Erreur "Invalid verification code"

### Annulation du login

1. Commencez un login
2. Sur l'écran 2FA, cliquez sur "Cancel"
3. **Résultat attendu** : Retour à l'écran de login

### Code de secours invalide

1. Entrez "INVALID1" comme code de secours
2. **Résultat attendu** : Erreur "Invalid verification code"

## Checklist de Test Complète

### Activation

- [ ] Affichage du QR code
- [ ] Scan QR code avec Google Authenticator
- [ ] Saisie manuelle du secret
- [ ] Vérification du code TOTP
- [ ] Affichage des codes de secours
- [ ] Téléchargement des codes de secours
- [ ] Statut passe à "Active"

### Login

- [ ] Login avec code TOTP valide
- [ ] Login avec code de secours valide
- [ ] Erreur avec code TOTP invalide
- [ ] Erreur avec code de secours invalide
- [ ] Erreur avec code expiré
- [ ] Annulation du processus
- [ ] Basculement TOTP ↔ Backup code

### Gestion

- [ ] Visualisation des codes de secours
- [ ] Copie d'un code de secours
- [ ] Régénération des codes
- [ ] Invalidation des anciens codes
- [ ] Téléchargement des codes

### Désactivation

- [ ] Désactivation réussie
- [ ] Suppression des données 2FA
- [ ] Login sans 2FA après désactivation

### Sécurité

- [ ] Code de secours utilisé ne peut être réutilisé
- [ ] Codes régénérés invalident les anciens
- [ ] Secrets chiffrés dans Firestore
- [ ] Déconnexion si annulation 2FA

## Outils de Debug

### Console navigateur

Ouvrez la console (F12) pour voir les logs :

```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');

// Voir les erreurs 2FA
// Les erreurs s'affichent avec le préfixe [2FA]
```

### Firestore

1. Ouvrez la console Firebase
2. Allez dans Firestore
3. Collection `users` > Document de votre utilisateur
4. Vérifiez les champs :
   - `twoFactorEnabled`: boolean
   - `twoFactorSecret`: string (chiffré)
   - `twoFactorBackupCodes`: array (chiffrés)
   - `twoFactorEnabledAt`: timestamp

### Network

1. Onglet Network de la console
2. Filtrez par "firestore"
3. Vérifiez les requêtes :
   - GET/POST vers collection `users`
   - Pas de secrets en clair dans les requêtes

## Problèmes Courants

### Le QR code ne s'affiche pas

**Solution** :

1. Vérifiez la console pour les erreurs
2. Vérifiez que qrcode est installé : `npm list qrcode`
3. Rechargez la page

### Code toujours rejeté

**Solution** :

1. Vérifiez l'heure de votre appareil
2. Synchronisez l'heure (Paramètres > Date et heure > Auto)
3. Attendez le prochain code (30s)

### Impossibilité de se connecter

**Solution** :

1. Utilisez un code de secours
2. Si aucun code de secours :
   - Accédez à Firestore
   - Trouvez votre document utilisateur
   - Mettez `twoFactorEnabled` à `false`
   - Reconnectez-vous

### Codes de secours perdus

**Solution** :

1. Si connecté : Régénérez dans Settings
2. Si non connecté : Demandez à un admin de désactiver 2FA

## Métriques de Performance

Tests à effectuer :

1. **Temps d'activation**
   - De l'ouverture de la modal à "Done"
   - Cible : < 2 minutes

2. **Temps de login**
   - De la saisie du code 2FA à la redirection
   - Cible : < 2 secondes

3. **Génération QR code**
   - Affichage du QR code
   - Cible : < 500ms

## Rapport de Test

Après les tests, documentez :

| Scénario           | Statut | Notes |
| ------------------ | ------ | ----- |
| Activation 2FA     | ✅/❌  |       |
| Login avec TOTP    | ✅/❌  |       |
| Login avec backup  | ✅/❌  |       |
| Régénération codes | ✅/❌  |       |
| Désactivation 2FA  | ✅/❌  |       |

## Support

Si vous rencontrez des problèmes pendant les tests :

1. Vérifiez la console navigateur
2. Vérifiez Firestore
3. Consultez `docs/2FA_IMPLEMENTATION.md`
4. Créez une issue avec :
   - Scénario testé
   - Résultat attendu
   - Résultat obtenu
   - Logs de la console
   - Captures d'écran
