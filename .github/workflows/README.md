# GitHub Actions Workflows - Documentation

Ce repertoire contient tous les workflows GitHub Actions pour l'integration continue (CI) et le deploiement continu (CD) de GestiHotel v2.

## Table des matieres

- [Vue d'ensemble](#vue-densemble)
- [Workflows disponibles](#workflows-disponibles)
- [Configuration requise](#configuration-requise)
- [Variables d'environnement](#variables-denvironnement)
- [Secrets GitHub](#secrets-github)
- [Deploiements](#deploiements)
- [Troubleshooting](#troubleshooting)

## Vue d'ensemble

Le pipeline CI/CD est compose de plusieurs workflows complementaires qui garantissent la qualite du code et automatisent les deploiements :

```
┌─────────────────────────────────────────────────────────────┐
│                         CI Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│  1. Linting (ESLint + Prettier)                             │
│  2. Type Checking (TypeScript)                              │
│  3. Unit Tests (Vitest + Coverage)                          │
│  4. E2E Tests (Playwright)                                  │
│  5. Build Verification                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                         CD Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│  Develop → Staging (automatique)                            │
│  Main → Production (automatique avec validation)            │
│  PR → Preview Channel (7 jours)                             │
└─────────────────────────────────────────────────────────────┘
```

## Workflows disponibles

### 1. CI (ci.yml)

**Declenchement :**
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

**Jobs :**
1. **lint** - Verifie le code avec ESLint et Prettier
2. **type-check** - Verifie les types TypeScript
3. **test-unit** - Execute les tests unitaires avec couverture
4. **test-e2e** - Execute les tests E2E avec Playwright
5. **build** - Verifie que l'application se build correctement
6. **success** - Confirmation que tous les checks sont passes

**Duree moyenne :** ~8-12 minutes

**Cache :**
- Node modules (npm cache)
- Playwright browsers

### 2. Deploy (deploy.yml)

**Declenchement :**
- Push sur `main`
- Declenchement manuel (workflow_dispatch)

**Jobs :**
1. **validate** - Attend que tous les checks CI passent
2. **deploy** - Build et deploie sur Firebase Hosting
3. **notify-slack** - Envoie une notification Slack (optionnel)

**Actions executees :**
- Validation complete du code (lint, type-check, tests)
- Build optimise pour la production
- Creation d'un tag de backup
- Deploiement sur Firebase
- Creation d'une GitHub Release
- Notifications de succes/echec

**Duree moyenne :** ~10-15 minutes

### 3. Deploy to Staging (deploy-staging.yml)

**Declenchement :**
- Push sur `develop`
- Declenchement manuel

**Environment :** staging
**URL :** https://staging.gestihotel.app

**Actions executees :**
- Tests rapides
- Build avec configuration staging
- Deploiement sur l'environnement de staging

**Duree moyenne :** ~6-8 minutes

### 4. Deploy to Production (deploy-prod.yml)

**Declenchement :**
- Declenchement manuel uniquement
- Requiert confirmation ("DEPLOY")

**Environment :** production
**URL :** https://app.gestihotel.fr

**Actions executees :**
- Validation de la confirmation
- Tests complets (unit + lint + type-check)
- Build pour la production
- Creation d'un tag de backup
- Deploiement sur Firebase
- Creation d'une GitHub Release

**Duree moyenne :** ~12-15 minutes

### 5. PR Preview (pr-preview.yml)

**Declenchement :**
- Pull request ouverte/synchronisee vers `main` ou `develop`

**Actions executees :**
- Linting et type checking
- Tests unitaires
- Build de l'application
- Deploiement sur un Firebase Preview Channel (7 jours)
- Commentaire automatique sur la PR avec l'URL de preview

**Duree moyenne :** ~8-10 minutes

## Configuration requise

### Node.js

Tous les workflows utilisent Node.js 20 avec cache npm pour accelerer les installations.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

### Firebase CLI

Les deploiements utilisent l'action officielle Firebase :

```yaml
- uses: FirebaseExtended/action-hosting-deploy@v0
```

## Variables d'environnement

### Variables de build

Ces variables sont necessaires pour builder l'application :

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optionnel)
- `VITE_APP_ENV` (staging/production/preview)

### Environnements

Le projet utilise 3 environnements GitHub :

1. **production**
   - URL : https://app.gestihotel.fr
   - Deploiement : Manuel uniquement
   - Protection : Confirmation requise

2. **staging**
   - URL : https://staging.gestihotel.app
   - Deploiement : Automatique sur `develop`
   - Protection : Aucune

3. **preview**
   - URL : Generee dynamiquement par Firebase
   - Deploiement : Automatique sur PR
   - Duree : 7 jours

## Secrets GitHub

### Secrets requis

#### Pour tous les workflows

```
GITHUB_TOKEN (fourni automatiquement par GitHub)
```

#### Pour le CI

```
CODECOV_TOKEN                     # Token pour Codecov (couverture de code)
VITE_FIREBASE_API_KEY            # Configuration Firebase pour les tests
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

#### Pour le deploiement Staging

```
STAGING_FIREBASE_API_KEY
STAGING_FIREBASE_AUTH_DOMAIN
STAGING_FIREBASE_PROJECT_ID
STAGING_FIREBASE_STORAGE_BUCKET
STAGING_FIREBASE_MESSAGING_SENDER_ID
STAGING_FIREBASE_APP_ID
STAGING_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_STAGING  # Service account JSON
```

#### Pour le deploiement Production

```
PROD_FIREBASE_API_KEY
PROD_FIREBASE_AUTH_DOMAIN
PROD_FIREBASE_PROJECT_ID
PROD_FIREBASE_STORAGE_BUCKET
PROD_FIREBASE_MESSAGING_SENDER_ID
PROD_FIREBASE_APP_ID
PROD_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_PROD     # Service account JSON
```

#### Optionnel

```
SLACK_WEBHOOK_URL                 # Pour les notifications Slack
```

### Comment configurer les secrets

1. Allez dans les parametres du repository GitHub
2. Selectionnez "Secrets and variables" > "Actions"
3. Cliquez sur "New repository secret"
4. Ajoutez chaque secret avec son nom et sa valeur

### Generer un Firebase Service Account

```bash
# Via Firebase Console
1. Allez dans Project Settings > Service Accounts
2. Cliquez sur "Generate new private key"
3. Copiez le contenu du fichier JSON genere
4. Ajoutez-le comme secret GitHub

# Via Firebase CLI
firebase login
firebase projects:list
firebase apps:sdkconfig web
```

## Deploiements

### Deploiement automatique

#### Staging (develop)

```bash
git checkout develop
git pull origin develop
# Faire vos modifications
git add .
git commit -m "feat: nouvelle fonctionnalite"
git push origin develop
# → Deploiement automatique sur staging
```

#### Production (main)

```bash
git checkout main
git merge develop
git push origin main
# → Deploiement automatique sur production
```

### Deploiement manuel

#### Via GitHub Actions UI

1. Allez dans l'onglet "Actions"
2. Selectionnez le workflow "Deploy to Production"
3. Cliquez sur "Run workflow"
4. Tapez "DEPLOY" pour confirmer
5. Cliquez sur "Run workflow"

#### Via GitHub CLI

```bash
# Deployer sur production
gh workflow run deploy-prod.yml -f confirm=DEPLOY

# Deployer sur staging
gh workflow run deploy-staging.yml
```

### Rollback

En cas de probleme apres un deploiement :

1. **Methode 1 : Deployer une version anterieure**
   ```bash
   git checkout <commit-sha>
   git push origin main --force
   ```

2. **Methode 2 : Utiliser un tag de backup**
   ```bash
   git tag --list "backup/deploy-*"
   git checkout backup/deploy-20231129-143022
   git push origin main --force
   ```

3. **Methode 3 : Via Firebase Console**
   - Allez dans Firebase Hosting
   - Selectionnez une version anterieure
   - Cliquez sur "Rollback"

## Troubleshooting

### Le workflow CI echoue

#### Erreur de linting

```bash
# Localement, corrigez les erreurs
npm run lint:fix
npm run format
git add .
git commit -m "fix: corriger les erreurs de linting"
git push
```

#### Erreur de type checking

```bash
# Verifiez les erreurs TypeScript
npm run type-check
# Corrigez les erreurs
git add .
git commit -m "fix: corriger les erreurs TypeScript"
git push
```

#### Tests qui echouent

```bash
# Lancez les tests localement
npm test
# Debuggez et corrigez
git add .
git commit -m "fix: corriger les tests"
git push
```

### Le deploiement echoue

#### Erreur "Firebase service account invalid"

- Verifiez que le secret `FIREBASE_SERVICE_ACCOUNT_*` est correct
- Regenerez le service account si necessaire
- Mettez a jour le secret GitHub

#### Erreur "Build failed"

- Verifiez que toutes les variables d'environnement sont definies
- Testez le build localement : `npm run build`
- Verifiez les logs du workflow pour plus de details

#### Erreur "Firebase project not found"

- Verifiez que `VITE_FIREBASE_PROJECT_ID` est correct
- Verifiez les permissions du service account

### Le preview de PR ne s'affiche pas

1. Verifiez que le workflow s'est execute avec succes
2. Verifiez que le commentaire a ete poste sur la PR
3. Cliquez sur le lien dans le commentaire
4. Attendez quelques minutes pour la propagation DNS

### Cache problems

Si vous rencontrez des problemes de cache :

```yaml
# Ajoutez ceci dans le workflow pour vider le cache
- name: Clear cache
  run: |
    npm cache clean --force
    rm -rf node_modules
```

## Optimisations

### Accelerer les workflows

1. **Parallelisation des jobs**
   - Les jobs independants s'executent en parallele
   - Utilisez `needs: []` seulement si necessaire

2. **Cache**
   - npm cache (automatique avec `cache: 'npm'`)
   - Playwright browsers cache

3. **Conditions**
   - Utilisez `if` pour eviter les jobs inutiles
   - Exemple : `if: github.event_name == 'push'`

### Reduire les couts

1. **Limitez les branches surveillees**
   ```yaml
   on:
     push:
       branches: [main, develop]  # Pas sur toutes les branches
   ```

2. **Utilisez des runners self-hosted si possible**

3. **Optimisez les tests E2E**
   - Executez uniquement sur les PRs importantes
   - Utilisez le parallelisme Playwright

## Monitoring

### Visualisation des workflows

- GitHub Actions tab : Vue d'ensemble de tous les runs
- Insights > Dependency graph : Dependances et securite
- Settings > Environments : Status des deploiements

### Metriques a surveiller

1. **Duree des workflows** : Devrait rester < 15 minutes
2. **Taux de succes** : Devrait etre > 95%
3. **Couverture de code** : Devrait etre > 80%
4. **Performance du build** : Devrait rester stable

### Notifications

Configurez les notifications pour :
- Echecs de deploiement en production
- Echecs de tests sur `main`
- Problemes de securite detectes par Dependabot

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Codecov Documentation](https://docs.codecov.com)

## Support

Pour toute question ou probleme :
1. Consultez ce document
2. Verifiez les [issues GitHub](https://github.com/votre-username/gestihotel-v2/issues)
3. Ouvrez une nouvelle issue avec le label `ci/cd`
4. Consultez le [guide de contribution](../../CONTRIBUTING.md)
