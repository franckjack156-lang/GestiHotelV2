# .github Directory - GestiHotel v2

Ce repertoire contient toute la configuration GitHub pour le projet GestiHotel v2, incluant les workflows CI/CD, les templates et la configuration Dependabot.

## Structure du repertoire

```
.github/
├── workflows/                      # GitHub Actions workflows
│   ├── ci.yml                     # Integration continue (lint, tests, build)
│   ├── deploy.yml                 # Deploiement automatique sur main → production
│   ├── deploy-staging.yml         # Deploiement automatique sur develop → staging
│   ├── deploy-prod.yml            # Deploiement manuel production (avec confirmation)
│   ├── pr-preview.yml             # Preview automatique pour les Pull Requests
│   └── README.md                  # Documentation complete des workflows
│
├── ISSUE_TEMPLATE/                # Templates pour les issues GitHub
│   ├── bug_report.yml             # Formulaire de rapport de bug
│   ├── feature_request.yml        # Formulaire de demande de fonctionnalite
│   └── config.yml                 # Configuration des templates d'issues
│
├── dependabot.yml                 # Configuration Dependabot (mises a jour auto)
├── pull_request_template.md       # Template pour les Pull Requests
└── README.md                      # Ce fichier
```

## Fichiers principaux

### Workflows CI/CD

| Fichier | Declenchement | Description | Duree |
|---------|---------------|-------------|-------|
| **ci.yml** | Push/PR sur main/develop | CI complet : lint, type-check, tests, build | ~8-12 min |
| **deploy.yml** | Push sur main | Deploiement automatique production | ~10-15 min |
| **deploy-staging.yml** | Push sur develop | Deploiement automatique staging | ~6-8 min |
| **deploy-prod.yml** | Manuel uniquement | Deploiement production avec confirmation | ~12-15 min |
| **pr-preview.yml** | PR vers main/develop | Preview temporaire (7 jours) | ~8-10 min |

### Templates

- **pull_request_template.md** : Template standardise pour toutes les PRs avec checklist complete
- **bug_report.yml** : Formulaire structure pour les rapports de bugs
- **feature_request.yml** : Formulaire structure pour les demandes de fonctionnalites

### Configuration

- **dependabot.yml** : Mises a jour automatiques des dependances (npm + GitHub Actions)

## Liens rapides

- [Documentation complete des workflows](workflows/README.md)
- [Guide de contribution](../CONTRIBUTING.md)
- [Configuration CI/CD](../CI_CD_SETUP.md)

## Workflows disponibles

### 1. Integration Continue (ci.yml)

**Quand ?** A chaque push ou PR sur main/develop

**Que fait-il ?**
1. Lint le code (ESLint + Prettier)
2. Verifie les types TypeScript
3. Execute les tests unitaires (avec couverture)
4. Execute les tests E2E (Playwright)
5. Build l'application
6. Upload les artifacts

**Status requis :** Tous les jobs doivent reussir avant de merger une PR

### 2. Preview de PR (pr-preview.yml)

**Quand ?** A chaque PR ouverte ou mise a jour

**Que fait-il ?**
1. Execute le CI complet
2. Build l'application
3. Deploie sur un Firebase Preview Channel
4. Commente la PR avec l'URL de preview

**Duree du preview :** 7 jours (expire automatiquement)

### 3. Deploiement Staging (deploy-staging.yml)

**Quand ?** A chaque push sur develop

**Que fait-il ?**
1. Execute les tests
2. Build pour staging
3. Deploie sur https://staging.gestihotel.app

**Environnement :** Staging (configuration de test)

### 4. Deploiement Production (deploy.yml)

**Quand ?** A chaque push sur main

**Que fait-il ?**
1. Valide que le CI est passe
2. Execute lint + type-check + tests
3. Build pour production
4. Cree un tag de backup
5. Deploie sur https://app.gestihotel.fr
6. Cree une GitHub Release

**Environnement :** Production (configuration live)

### 5. Deploiement Production Manuel (deploy-prod.yml)

**Quand ?** Declenchement manuel uniquement

**Que fait-il ?**
- Meme chose que deploy.yml mais avec confirmation requise
- Securite supplementaire pour les deploiements critiques

## Configuration Dependabot

Mises a jour automatiques tous les lundis a 9h (Europe/Paris) :

**Packages regroupes :**
- React & React-related
- Firebase packages
- Testing tools (Vitest, Playwright, Testing Library)
- Radix UI components
- ESLint & TypeScript
- Vite & build tools

**Limites :**
- 10 PRs max ouvertes simultanement
- Ignore les mises a jour majeures de React et TypeScript (review manuelle)

## Templates GitHub

### Pull Request Template

Checklist complete incluant :
- Code quality (lint, format, type-check)
- Documentation
- Tests (unit, E2E, coverage)
- Build & CI
- Dependencies
- Security
- Performance impact
- Breaking changes

### Issue Templates

**Bug Report :**
- Description du bug
- Etapes de reproduction
- Comportement attendu vs actuel
- Environnement (OS, navigateur, version)
- Severite et frequence
- Console errors

**Feature Request :**
- Description de la fonctionnalite
- Probleme a resoudre
- Solution proposee
- Alternatives
- Priorite et categorie
- Cas d'utilisation

## Variables d'environnement requises

### Pour le CI
```
CODECOV_TOKEN
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Pour Staging
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

### Pour Production
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

### Optionnel
```
SLACK_WEBHOOK_URL  # Notifications Slack
```

## Comment utiliser

### Pour un contributeur

1. **Creer une branche**
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```

2. **Developper et commiter**
   ```bash
   git add .
   git commit -m "feat: ma fonctionnalite"
   git push origin feature/ma-fonctionnalite
   ```

3. **Creer une PR**
   - Le workflow `ci.yml` se lance automatiquement
   - Le workflow `pr-preview.yml` cree un preview
   - Remplir le template de PR
   - Attendre la review

4. **Apres merge**
   - Si merge vers `develop` → deploiement sur staging
   - Si merge vers `main` → deploiement sur production

### Pour un mainteneur

**Deployer sur staging :**
```bash
git checkout develop
git merge feature/ma-fonctionnalite
git push origin develop
# → Deploiement automatique sur staging
```

**Deployer sur production :**
```bash
git checkout main
git merge develop
git push origin main
# → Deploiement automatique sur production
```

**Deploiement manuel (avec confirmation) :**
1. Aller dans Actions > Deploy to Production
2. Cliquer sur "Run workflow"
3. Taper "DEPLOY" pour confirmer
4. Cliquer sur "Run workflow"

## Monitoring

### GitHub Actions
- Vue d'ensemble : https://github.com/votre-username/gestihotel-v2/actions
- Workflows : Onglet "Actions"
- Logs : Cliquer sur un run specifique

### Firebase Console
- Hosting : https://console.firebase.google.com/project/[PROJECT_ID]/hosting
- Historique des deploiements
- Rollback possible

### Codecov
- Dashboard : https://codecov.io/gh/votre-username/gestihotel-v2
- Couverture de code par fichier
- Evolution dans le temps

## Troubleshooting

### Le CI echoue

1. Verifier les logs dans GitHub Actions
2. Executer localement :
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```
3. Corriger les erreurs
4. Pusher les corrections

### Le deploiement echoue

1. Verifier les secrets GitHub
2. Verifier les logs du workflow
3. Verifier la configuration Firebase
4. Consulter [workflows/README.md](workflows/README.md)

### Le preview ne fonctionne pas

1. Verifier que le workflow est termine
2. Chercher le commentaire sur la PR
3. Attendre quelques minutes
4. Verifier les logs Firebase

## Resources

- [Documentation complete des workflows](workflows/README.md)
- [Guide de contribution](../CONTRIBUTING.md)
- [Configuration CI/CD](../CI_CD_SETUP.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

## Support

Pour toute question :
1. Consultez la documentation
2. Ouvrez une issue avec le label `ci/cd`
3. Consultez les discussions GitHub

---

Derniere mise a jour : 29 novembre 2025
