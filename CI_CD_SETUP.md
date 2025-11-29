# Configuration CI/CD - GestiHotel v2

Ce document recapitule la configuration complete du pipeline CI/CD pour le projet GestiHotel v2.

## Date de configuration

29 novembre 2025

## Fichiers crees

### Workflows GitHub Actions (.github/workflows/)

1. **ci.yml** (existant, ameliore)
   - Pipeline d'integration continue complet
   - Linting, type-checking, tests unitaires et E2E
   - Verification du build
   - Upload de la couverture de code vers Codecov

2. **deploy.yml** (nouveau)
   - Deploiement automatique sur Firebase pour la branche `main`
   - Validation des checks CI avant deploiement
   - Creation de tags de backup
   - Creation de GitHub Releases
   - Notifications Slack optionnelles

3. **deploy-staging.yml** (existant)
   - Deploiement automatique sur l'environnement de staging
   - Declenchement sur la branche `develop`

4. **deploy-prod.yml** (existant)
   - Deploiement manuel sur la production
   - Requiert confirmation explicite ("DEPLOY")
   - Protection maximale pour l'environnement de production

5. **pr-preview.yml** (nouveau)
   - Preview automatique pour chaque Pull Request
   - Deploiement sur Firebase Preview Channels (7 jours)
   - Commentaire automatique avec l'URL de preview

6. **README.md** (nouveau)
   - Documentation complete des workflows
   - Guide de troubleshooting
   - Instructions de configuration

### Configuration Dependabot (.github/)

7. **dependabot.yml** (nouveau)
   - Mises a jour automatiques des dependances npm
   - Mises a jour des GitHub Actions
   - Regroupement intelligent des packages (React, Firebase, Testing, etc.)
   - Schedule : Tous les lundis a 9h (Europe/Paris)

### Templates GitHub (.github/)

8. **pull_request_template.md** (nouveau)
   - Template standardise pour les Pull Requests
   - Checklist complete (code quality, tests, documentation, security)
   - Sections pour description, captures d'ecran, breaking changes

9. **ISSUE_TEMPLATE/bug_report.yml** (nouveau)
   - Formulaire structure pour les rapports de bugs
   - Champs : description, etapes de reproduction, environnement, severite
   - Validation automatique des informations requises

10. **ISSUE_TEMPLATE/feature_request.yml** (nouveau)
    - Formulaire structure pour les demandes de fonctionnalites
    - Champs : description, probleme, solution, priorite, categorie
    - Options de contribution

11. **ISSUE_TEMPLATE/config.yml** (nouveau)
    - Configuration des issues GitHub
    - Liens vers documentation et discussions

### Documentation

12. **CONTRIBUTING.md** (nouveau)
    - Guide complet pour les contributeurs
    - Standards de code et conventions
    - Workflow Git et processus de PR
    - Instructions pour les tests

## Architecture du Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                         DEVELOPPEMENT                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      PULL REQUEST (PR)                            │
│  - Lint + Type Check + Tests                                     │
│  - Build Verification                                            │
│  - Preview Deployment (Firebase Channel - 7 jours)              │
│  - Commentaire automatique avec URL                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    BRANCHE DEVELOP                                │
│  - Merge de la PR                                                │
│  - CI complet (lint, tests, build)                              │
│  - Deploiement automatique → STAGING                             │
│  URL: https://staging.gestihotel.app                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     BRANCHE MAIN                                  │
│  - Merge depuis develop                                          │
│  - CI complet + E2E tests                                        │
│  - Deploiement automatique → PRODUCTION                          │
│  - Creation de backup tag                                        │
│  - Creation de GitHub Release                                    │
│  URL: https://app.gestihotel.fr                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Environnements

### 1. Preview (PR)
- **Type** : Temporaire
- **Duree** : 7 jours
- **URL** : Generee dynamiquement par Firebase
- **Declenchement** : Automatique sur chaque PR
- **Usage** : Tests et validation avant merge

### 2. Staging
- **Type** : Permanent
- **URL** : https://staging.gestihotel.app
- **Declenchement** : Automatique sur push vers `develop`
- **Usage** : Tests d'integration et validation pre-production

### 3. Production
- **Type** : Permanent
- **URL** : https://app.gestihotel.fr
- **Declenchement** : Automatique sur push vers `main`
- **Protection** : Validation CI complete + backup automatique
- **Usage** : Application en production

## Secrets GitHub requis

### CI/CD
```
GITHUB_TOKEN                      # Fourni automatiquement par GitHub
CODECOV_TOKEN                     # Token Codecov pour la couverture
```

### Firebase - Staging
```
STAGING_FIREBASE_API_KEY
STAGING_FIREBASE_AUTH_DOMAIN
STAGING_FIREBASE_PROJECT_ID
STAGING_FIREBASE_STORAGE_BUCKET
STAGING_FIREBASE_MESSAGING_SENDER_ID
STAGING_FIREBASE_APP_ID
STAGING_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_STAGING
```

### Firebase - Production
```
PROD_FIREBASE_API_KEY
PROD_FIREBASE_AUTH_DOMAIN
PROD_FIREBASE_PROJECT_ID
PROD_FIREBASE_STORAGE_BUCKET
PROD_FIREBASE_MESSAGING_SENDER_ID
PROD_FIREBASE_APP_ID
PROD_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_PROD
```

### Firebase - Preview/Tests
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Optionnel
```
SLACK_WEBHOOK_URL                 # Notifications Slack
```

## Configuration des secrets

### Etape 1 : Acces aux parametres
1. Allez sur https://github.com/votre-username/gestihotel-v2/settings/secrets/actions
2. Cliquez sur "New repository secret"

### Etape 2 : Firebase Service Account
1. Allez dans Firebase Console : https://console.firebase.google.com
2. Selectionnez votre projet
3. Project Settings > Service Accounts
4. Click "Generate new private key"
5. Copiez le contenu du fichier JSON
6. Ajoutez-le comme secret `FIREBASE_SERVICE_ACCOUNT_PROD` et `FIREBASE_SERVICE_ACCOUNT_STAGING`

### Etape 3 : Configuration Firebase
1. Dans Firebase Console, allez dans Project Settings
2. Sous "Your apps", selectionnez votre application web
3. Copiez chaque valeur de configuration
4. Ajoutez-les comme secrets GitHub avec les prefixes appropries

### Etape 4 : Codecov (optionnel mais recommande)
1. Allez sur https://codecov.io
2. Connectez-vous avec votre compte GitHub
3. Ajoutez votre repository
4. Copiez le token genere
5. Ajoutez-le comme secret `CODECOV_TOKEN`

## Workflow de developpement recommande

### 1. Creer une nouvelle branche
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-fonctionnalite
```

### 2. Developper et tester localement
```bash
# Developper votre fonctionnalite
npm run dev

# Tester
npm run lint
npm run type-check
npm test
npm run build
```

### 3. Commiter et pusher
```bash
git add .
git commit -m "feat: ajouter ma nouvelle fonctionnalite"
git push origin feature/ma-fonctionnalite
```

### 4. Creer une Pull Request
1. Allez sur GitHub
2. Cliquez sur "Compare & pull request"
3. Remplissez le template de PR
4. Attendez les checks CI
5. Verifiez le preview deployment
6. Demandez une review

### 5. Merge vers develop
1. Apres approbation, mergez la PR
2. Le deploiement sur staging se fera automatiquement
3. Testez sur https://staging.gestihotel.app

### 6. Release en production
```bash
git checkout main
git pull origin main
git merge develop
git push origin main
# Deploiement automatique sur production
```

## Fonctionnalites du CI/CD

### Integration Continue (CI)

1. **Linting**
   - ESLint avec configuration stricte
   - Prettier pour le formatage
   - Execution sur chaque PR et push

2. **Type Checking**
   - TypeScript en mode strict
   - Verification complete des types
   - Prevention des erreurs de type

3. **Tests**
   - Tests unitaires avec Vitest
   - Tests E2E avec Playwright
   - Couverture de code avec Coverage
   - Upload vers Codecov

4. **Build Verification**
   - Build complet de l'application
   - Verification des assets generes
   - Upload des artifacts

### Deploiement Continu (CD)

1. **Preview Deployments**
   - URL unique pour chaque PR
   - Expire apres 7 jours
   - Commentaire automatique sur la PR

2. **Staging Deployment**
   - Automatique sur `develop`
   - Tests rapides avant deploiement
   - URL stable pour les tests

3. **Production Deployment**
   - Automatique sur `main`
   - Validation CI complete
   - Backup automatique
   - GitHub Release

4. **Rollback**
   - Tags de backup automatiques
   - Possibilite de revenir a une version anterieure
   - Documentation du processus

### Dependabot

1. **Mises a jour automatiques**
   - Dependencies npm
   - GitHub Actions
   - Schedule hebdomadaire (lundi 9h)

2. **Regroupement intelligent**
   - React packages ensemble
   - Firebase packages ensemble
   - Testing tools ensemble
   - Build tools ensemble

3. **Configuration**
   - 10 PRs max ouvertes simultanement
   - Labels automatiques
   - Assignation automatique

## Metriques et Monitoring

### Metriques a surveiller

1. **Pipeline CI**
   - Duree moyenne : ~8-12 minutes
   - Taux de succes : > 95%
   - Couverture de code : > 80%

2. **Deploiements**
   - Duree moyenne staging : ~6-8 minutes
   - Duree moyenne production : ~12-15 minutes
   - Taux de succes : > 98%

3. **Qualite de code**
   - Zero warnings ESLint
   - Zero erreurs TypeScript
   - Tests qui passent a 100%

### Outils de monitoring

1. **GitHub Actions**
   - Vue d'ensemble des workflows
   - Historique des runs
   - Logs detailles

2. **Codecov**
   - Evolution de la couverture
   - Code coverage par fichier
   - Pull Request comments

3. **Firebase Console**
   - Status des deploiements
   - Historique des versions
   - Analytics et performances

## Troubleshooting rapide

### Le CI echoue

```bash
# Executer localement ce que le CI execute
npm ci
npm run lint
npm run type-check
npm test -- --run
npm run build
```

### Le deploiement echoue

1. Verifier les secrets GitHub
2. Verifier les logs du workflow
3. Tester le build localement
4. Verifier la configuration Firebase

### Le preview ne s'affiche pas

1. Verifier que le workflow est termine
2. Chercher le commentaire sur la PR
3. Attendre quelques minutes pour la propagation
4. Verifier les logs Firebase

## Prochaines etapes recommandees

### Court terme
- [ ] Configurer tous les secrets GitHub
- [ ] Tester le workflow complet avec une PR de test
- [ ] Configurer Codecov
- [ ] Tester le deploiement sur staging

### Moyen terme
- [ ] Ajouter des tests de performance (Lighthouse CI)
- [ ] Configurer les notifications Slack
- [ ] Ajouter des tests de securite (SAST)
- [ ] Mettre en place des environments GitHub

### Long terme
- [ ] Ajouter des tests de charge
- [ ] Implementer le blue-green deployment
- [ ] Ajouter le monitoring avec Sentry
- [ ] Implementer des feature flags

## Resources

- [Documentation CI/CD](.github/workflows/README.md)
- [Guide de contribution](CONTRIBUTING.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)

## Support

Pour toute question :
1. Consultez la [documentation CI/CD](.github/workflows/README.md)
2. Ouvrez une issue avec le label `ci/cd`
3. Consultez les [discussions GitHub](https://github.com/votre-username/gestihotel-v2/discussions)

---

Configuration realisee le 29 novembre 2025
