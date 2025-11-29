# Checklist de Configuration CI/CD - GestiHotel v2

Cette checklist vous guide pour activer completement le pipeline CI/CD configure pour GestiHotel v2.

## Statut global

- [ ] Configuration de base complete
- [ ] Secrets GitHub configures
- [ ] Workflows testes
- [ ] Documentation mise a jour
- [ ] Equipe formee

---

## Phase 1 : Configuration des Secrets GitHub

### Acces aux secrets
- [ ] Aller sur https://github.com/votre-username/gestihotel-v2/settings/secrets/actions
- [ ] Verifier que vous avez les droits d'administration

### Secrets Firebase - Base (pour CI/tests)

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

**Ou les trouver :**
1. Firebase Console > Project Settings
2. Sous "Your apps", selectionnez votre application web
3. Copiez les valeurs de configuration

### Secrets Firebase - Staging

- [ ] `STAGING_FIREBASE_API_KEY`
- [ ] `STAGING_FIREBASE_AUTH_DOMAIN`
- [ ] `STAGING_FIREBASE_PROJECT_ID`
- [ ] `STAGING_FIREBASE_STORAGE_BUCKET`
- [ ] `STAGING_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `STAGING_FIREBASE_APP_ID`
- [ ] `STAGING_FIREBASE_MEASUREMENT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_STAGING`

**Pour le Service Account :**
1. Firebase Console > Project Settings > Service Accounts
2. Cliquez sur "Generate new private key"
3. Telecharger le fichier JSON
4. Copiez tout le contenu du fichier
5. Collez-le comme valeur du secret

### Secrets Firebase - Production

- [ ] `PROD_FIREBASE_API_KEY`
- [ ] `PROD_FIREBASE_AUTH_DOMAIN`
- [ ] `PROD_FIREBASE_PROJECT_ID`
- [ ] `PROD_FIREBASE_STORAGE_BUCKET`
- [ ] `PROD_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `PROD_FIREBASE_APP_ID`
- [ ] `PROD_FIREBASE_MEASUREMENT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_PROD`

### Secrets Codecov (optionnel mais recommande)

- [ ] Aller sur https://codecov.io
- [ ] Se connecter avec GitHub
- [ ] Ajouter le repository gestihotel-v2
- [ ] Copier le token genere
- [ ] Ajouter `CODECOV_TOKEN` dans les secrets GitHub

### Secrets Slack (optionnel)

- [ ] Creer un Webhook Slack
- [ ] Ajouter `SLACK_WEBHOOK_URL` dans les secrets GitHub

---

## Phase 2 : Configuration des Environnements GitHub

### Creer l'environnement Staging

- [ ] Aller sur Settings > Environments
- [ ] Cliquer sur "New environment"
- [ ] Nom : `staging`
- [ ] Ajouter URL : `https://staging.gestihotel.app`
- [ ] (Optionnel) Ajouter des reviewers
- [ ] Sauvegarder

### Creer l'environnement Production

- [ ] Cliquer sur "New environment"
- [ ] Nom : `production`
- [ ] Ajouter URL : `https://app.gestihotel.fr`
- [ ] Activer "Required reviewers" (recommande)
- [ ] Ajouter des reviewers (vous-meme et/ou d'autres mainteneurs)
- [ ] (Optionnel) Ajouter un timer de 5 minutes avant deploiement
- [ ] Sauvegarder

### Creer l'environnement Preview

- [ ] Cliquer sur "New environment"
- [ ] Nom : `preview`
- [ ] Pas d'URL fixe (generee dynamiquement)
- [ ] Aucune protection necessaire
- [ ] Sauvegarder

---

## Phase 3 : Configuration Firebase

### Verifier les projets Firebase

- [ ] Projet de staging existe et est configure
- [ ] Projet de production existe et est configure
- [ ] Firebase Hosting est active sur les deux projets

### Configurer Firebase Hosting

**Pour chaque projet (staging et production) :**

- [ ] Aller dans Firebase Console > Hosting
- [ ] Verifier que le domaine est configure
- [ ] Activer "Preview channels" pour le projet de preview
- [ ] Verifier les regles de securite (storage.rules, firestore.rules)

### Generer les Service Accounts

**Staging :**
- [ ] Firebase Console > Project Settings > Service Accounts
- [ ] Generer une cle privee
- [ ] Sauvegarder le fichier JSON en securite
- [ ] Ajouter comme secret `FIREBASE_SERVICE_ACCOUNT_STAGING`

**Production :**
- [ ] Firebase Console > Project Settings > Service Accounts
- [ ] Generer une cle privee
- [ ] Sauvegarder le fichier JSON en securite
- [ ] Ajouter comme secret `FIREBASE_SERVICE_ACCOUNT_PROD`

---

## Phase 4 : Tests des Workflows

### Test 1 : CI sur une branche de test

- [ ] Creer une branche de test : `git checkout -b test/ci-setup`
- [ ] Faire un petit changement
- [ ] Pusher : `git push origin test/ci-setup`
- [ ] Verifier que le workflow CI se lance
- [ ] Verifier que tous les jobs passent (lint, type-check, test, build)
- [ ] Consulter les logs pour toute erreur

**Resultat attendu :**
- Tous les jobs en vert
- Duree : ~8-12 minutes

### Test 2 : PR Preview

- [ ] Creer une PR depuis votre branche de test vers `develop`
- [ ] Verifier que le workflow `pr-preview.yml` se lance
- [ ] Attendre la fin de l'execution
- [ ] Verifier qu'un commentaire a ete poste avec l'URL de preview
- [ ] Cliquer sur l'URL et verifier que l'application fonctionne

**Resultat attendu :**
- Commentaire avec URL de preview
- Application accessible et fonctionnelle
- Duree : ~8-10 minutes

### Test 3 : Deploiement Staging

- [ ] Merger la PR de test vers `develop`
- [ ] Verifier que le workflow `deploy-staging.yml` se lance
- [ ] Attendre la fin de l'execution
- [ ] Acceder a https://staging.gestihotel.app
- [ ] Verifier que les changements sont deployes

**Resultat attendu :**
- Deploiement reussi
- Application staging a jour
- Duree : ~6-8 minutes

### Test 4 : Deploiement Production (optionnel)

**ATTENTION : Ne faire que si vous etes pret a deployer en production !**

- [ ] Merger `develop` vers `main`
- [ ] Verifier que le workflow `deploy.yml` se lance
- [ ] Verifier la validation CI
- [ ] Attendre la fin de l'execution
- [ ] Verifier qu'un tag de backup a ete cree
- [ ] Verifier qu'une GitHub Release a ete creee
- [ ] Acceder a https://app.gestihotel.fr
- [ ] Verifier que les changements sont deployes

**Resultat attendu :**
- Deploiement reussi
- Tag de backup cree
- GitHub Release creee
- Application production a jour
- Duree : ~10-15 minutes

---

## Phase 5 : Configuration Dependabot

### Activer Dependabot

- [ ] Aller sur Settings > Security > Dependabot
- [ ] Verifier que "Dependabot alerts" est active
- [ ] Verifier que "Dependabot security updates" est active
- [ ] Verifier que "Dependabot version updates" est active

### Tester Dependabot

- [ ] Attendre le lundi suivant a 9h (ou declencher manuellement)
- [ ] Verifier que des PRs Dependabot sont creees
- [ ] Examiner une PR Dependabot
- [ ] Verifier que les labels sont corrects
- [ ] Merger une PR Dependabot de test

---

## Phase 6 : Documentation et Formation

### Mettre a jour la documentation

- [ ] Lire [CI_CD_SETUP.md](CI_CD_SETUP.md)
- [ ] Lire [.github/workflows/README.md](.github/workflows/README.md)
- [ ] Lire [CONTRIBUTING.md](CONTRIBUTING.md)
- [ ] Mettre a jour les URLs si necessaire
- [ ] Mettre a jour les usernames GitHub

### Partager avec l'equipe

- [ ] Presenter le pipeline CI/CD a l'equipe
- [ ] Expliquer le workflow de developpement
- [ ] Montrer comment creer une PR
- [ ] Montrer comment utiliser les previews
- [ ] Expliquer le processus de deploiement

### Creer un guide rapide

- [ ] Creer un document resume pour l'equipe
- [ ] Inclure les commandes Git essentielles
- [ ] Inclure le workflow de developpement
- [ ] Inclure les contacts en cas de probleme

---

## Phase 7 : Securite et Monitoring

### Securite

- [ ] Activer "Require status checks to pass before merging" sur `main`
- [ ] Activer "Require status checks to pass before merging" sur `develop`
- [ ] Activer "Require review from Code Owners" (optionnel)
- [ ] Activer "Require signed commits" (optionnel)
- [ ] Configurer les branch protection rules

**Pour configurer :**
1. Settings > Branches
2. Add branch protection rule
3. Pattern : `main`
4. Cocher les options souhaitees
5. Repeter pour `develop`

### Monitoring

- [ ] Configurer les notifications GitHub Actions
- [ ] Configurer Codecov (si active)
- [ ] Configurer Slack (si active)
- [ ] Definir qui recoit les notifications d'echec

### Sauvegardes

- [ ] Verifier que les tags de backup sont crees automatiquement
- [ ] Tester un rollback (en environnement de test)
- [ ] Documenter la procedure de rollback pour l'equipe

---

## Phase 8 : Optimisations (optionnel)

### Performance

- [ ] Analyser la duree des workflows
- [ ] Optimiser les jobs lents
- [ ] Ajouter plus de parallelisation si possible
- [ ] Optimiser le cache npm

### Ameliorations futures

- [ ] Ajouter Lighthouse CI pour les performances
- [ ] Ajouter des tests de securite (SAST)
- [ ] Ajouter des tests de charge
- [ ] Implementer le blue-green deployment
- [ ] Ajouter le monitoring avec Sentry

---

## Verification Finale

### Checklist de verification

- [ ] Tous les secrets sont configures
- [ ] Tous les environnements sont crees
- [ ] Tous les workflows fonctionnent
- [ ] Les deploiements fonctionnent (staging et production)
- [ ] Les PR previews fonctionnent
- [ ] Dependabot est actif
- [ ] La documentation est a jour
- [ ] L'equipe est formee
- [ ] Les branch protections sont activees
- [ ] Le monitoring est en place

### Test complet du workflow

**Scenario de test complet :**

1. [ ] Creer une branche feature
2. [ ] Faire des modifications
3. [ ] Pusher et creer une PR
4. [ ] Verifier le CI
5. [ ] Verifier le preview
6. [ ] Faire une review
7. [ ] Merger vers develop
8. [ ] Verifier le deploiement staging
9. [ ] Tester sur staging
10. [ ] Merger vers main
11. [ ] Verifier le deploiement production
12. [ ] Verifier la GitHub Release
13. [ ] Tester en production

---

## Troubleshooting

### Problemes courants

#### Le workflow ne se lance pas

**Verification :**
- [ ] Le fichier YAML est valide
- [ ] Le trigger (on:) est correct
- [ ] Les permissions GitHub Actions sont activees

**Solution :**
1. Settings > Actions > General
2. Activer "Allow all actions and reusable workflows"
3. Sauvegarder

#### Les secrets ne fonctionnent pas

**Verification :**
- [ ] Les noms des secrets correspondent exactement
- [ ] Les secrets sont dans le bon repository
- [ ] Les secrets sont dans le bon environnement

**Solution :**
1. Verifier l'orthographe exacte des noms
2. Recreer les secrets si necessaire

#### Firebase deploiement echoue

**Verification :**
- [ ] Le service account est valide
- [ ] Le project ID est correct
- [ ] Les permissions Firebase sont correctes

**Solution :**
1. Regenerer le service account
2. Verifier les permissions dans Firebase Console
3. Verifier les logs detailles

---

## Support

Si vous rencontrez des problemes :

1. **Documentation**
   - [CI_CD_SETUP.md](CI_CD_SETUP.md)
   - [.github/workflows/README.md](.github/workflows/README.md)
   - [CONTRIBUTING.md](CONTRIBUTING.md)

2. **Logs**
   - Consulter les logs GitHub Actions
   - Consulter les logs Firebase Console
   - Consulter les logs Codecov

3. **Aide**
   - Ouvrir une issue avec le label `ci/cd`
   - Consulter les discussions GitHub
   - Contacter l'equipe de developpement

---

**Date de creation :** 29 novembre 2025

**Statut :** En attente de configuration

**Responsable :** [Votre nom]

**Prochaine revue :** [Date de revue prevue]
