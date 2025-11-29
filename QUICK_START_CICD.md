# Demarrage Rapide - CI/CD GestiHotel v2

> Guide ultra-rapide pour activer le pipeline CI/CD en 30 minutes

## Avant de commencer

Vous aurez besoin de:
- Acces administrateur au repository GitHub
- Acces a la Firebase Console
- 30 minutes de temps disponible

## Etape 1: Secrets GitHub (10 min)

### 1.1 Aller sur GitHub
```
https://github.com/votre-username/gestihotel-v2/settings/secrets/actions
```

### 1.2 Ajouter les secrets Firebase (CI/Tests)

Depuis Firebase Console > Project Settings > Your apps:

```
VITE_FIREBASE_API_KEY              = AIza...
VITE_FIREBASE_AUTH_DOMAIN          = votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID           = votre-projet
VITE_FIREBASE_STORAGE_BUCKET       = votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID  = 123456789
VITE_FIREBASE_APP_ID               = 1:123456789:web:abc123
```

### 1.3 Ajouter le Service Account (Production)

Depuis Firebase Console > Project Settings > Service Accounts > Generate new private key:

```
FIREBASE_SERVICE_ACCOUNT_PROD      = {tout le contenu du fichier JSON}
```

### 1.4 Ajouter les secrets de production

Depuis votre configuration Firebase de production:

```
PROD_FIREBASE_API_KEY              = AIza...
PROD_FIREBASE_AUTH_DOMAIN          = app.gestihotel.fr
PROD_FIREBASE_PROJECT_ID           = gestihotel-prod
PROD_FIREBASE_STORAGE_BUCKET       = gestihotel-prod.appspot.com
PROD_FIREBASE_MESSAGING_SENDER_ID  = 987654321
PROD_FIREBASE_APP_ID               = 1:987654321:web:xyz789
PROD_FIREBASE_MEASUREMENT_ID       = G-XXXXXXXXXX
```

### 1.5 Ajouter Codecov (optionnel)

```
CODECOV_TOKEN                      = votre-token-codecov
```

## Etape 2: Environnements GitHub (5 min)

### 2.1 Aller sur GitHub
```
https://github.com/votre-username/gestihotel-v2/settings/environments
```

### 2.2 Creer les environnements

**Production:**
- Nom: `production`
- URL: `https://app.gestihotel.fr`
- Protection: Activer "Required reviewers" (vous-meme)

**Staging:**
- Nom: `staging`
- URL: `https://staging.gestihotel.app`
- Protection: Aucune

**Preview:**
- Nom: `preview`
- URL: (laisser vide)
- Protection: Aucune

## Etape 3: Test du Pipeline (15 min)

### 3.1 Creer une branche de test

```bash
git checkout -b test/ci-setup
```

### 3.2 Faire un petit changement

```bash
echo "# Test CI/CD" >> TEST.md
git add TEST.md
git commit -m "test: verifier le pipeline CI/CD"
git push origin test/ci-setup
```

### 3.3 Creer une Pull Request

1. Aller sur GitHub
2. Cliquer sur "Compare & pull request"
3. Titre: "Test: Verifier le pipeline CI/CD"
4. Creer la PR

### 3.4 Verifier les workflows

Dans l'onglet "Actions", vous devriez voir:
- CI (lint, type-check, tests, build)
- PR Preview (deploiement preview)

Attendez que tous les checks passent (environ 10 minutes).

### 3.5 Verifier le preview

1. Cherchez le commentaire sur la PR
2. Cliquez sur l'URL de preview
3. Verifiez que l'application fonctionne

### 3.6 Merger et verifier staging

1. Mergez la PR vers `develop`
2. Le deploiement sur staging se lance automatiquement
3. Verifiez sur https://staging.gestihotel.app

## Etape 4: Configuration finale (optionnel)

### 4.1 Branch Protection Rules

```
Settings > Branches > Add rule
Pattern: main
✓ Require status checks to pass before merging
  ✓ ci
✓ Require pull request reviews before merging
```

Repeter pour `develop`.

### 4.2 Activer Dependabot

Deja configure automatiquement!
Attendez lundi prochain a 9h pour les premieres PRs.

## C'est termine!

Votre pipeline CI/CD est maintenant actif!

### Prochaines etapes

1. Lire [CONTRIBUTING.md](CONTRIBUTING.md) pour le workflow de developpement
2. Consulter [CI_CD_SETUP.md](CI_CD_SETUP.md) pour la configuration detaillee
3. Former votre equipe au nouveau workflow

### Workflow quotidien

```bash
# 1. Creer une branche
git checkout -b feature/ma-fonctionnalite

# 2. Developper
npm run dev

# 3. Tester localement
npm run lint
npm test

# 4. Pusher et creer une PR
git push origin feature/ma-fonctionnalite

# 5. Le CI et le preview se lancent automatiquement

# 6. Apres merge vers develop → deploiement sur staging
# 7. Apres merge vers main → deploiement sur production
```

## Aide rapide

### Le CI echoue?
```bash
npm run lint
npm run type-check
npm test -- --run
npm run build
```

### Besoin de rollback?
```bash
git tag --list "backup/deploy-*"
git checkout backup/deploy-YYYYMMDD-HHMMSS
git push origin main --force
```

### Questions?

Consultez:
- [CICD_SUMMARY.md](CICD_SUMMARY.md) - Resume du pipeline
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Checklist complete
- [.github/workflows/README.md](.github/workflows/README.md) - Doc workflows

## Support

Ouvrez une issue avec le label `ci/cd` si vous rencontrez des problemes.

---

Bon deploiement!
