# 🚀 Guide de Configuration du Monitoring - GestiHôtel v2

Ce guide vous accompagne pour configurer le système de monitoring complet en production.

---

## 📋 Prérequis

- Compte [Sentry.io](https://sentry.io) (gratuit pour commencer)
- Compte [Google Analytics](https://analytics.google.com) (gratuit)
- Application buildée (`npm run build`)

---

## 1️⃣ Configuration Sentry (10 min)

### Étape 1 : Créer un projet Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Cliquer sur "Create Project"
3. Sélectionner "React" comme plateforme
4. Nommer le projet : `gestihotel-v2`
5. Cliquer sur "Create Project"

### Étape 2 : Récupérer le DSN

Après création, Sentry affiche le DSN (Data Source Name) :

```
https://abc123xyz789@o123456.ingest.sentry.io/7654321
```

### Étape 3 : Configurer l'environnement

Ajouter dans votre fichier `.env` (ou `.env.production`) :

```bash
VITE_SENTRY_DSN=https://abc123xyz789@o123456.ingest.sentry.io/7654321
VITE_APP_VERSION=2.0.0
```

### Étape 4 : Tester en local

```bash
# Build de production
npm run build

# Prévisualiser avec les variables d'environnement
npm run preview
```

Visitez l'application et déclenchez une erreur volontaire pour vérifier que Sentry la capture.

### Étape 5 : Configurer les Alertes

1. Dans Sentry, aller dans "Alerts"
2. Créer une alerte pour "High Priority Issues"
3. Configurer : Email quand > 100 erreurs/heure

---

## 2️⃣ Configuration Google Analytics 4 (15 min)

### Étape 1 : Créer une propriété GA4

1. Aller sur [analytics.google.com](https://analytics.google.com)
2. Cliquer sur "Admin" (roue crantée en bas à gauche)
3. Cliquer sur "Create Property"
4. Remplir :
   - **Property name** : GestiHôtel v2
   - **Reporting time zone** : Europe/Paris
   - **Currency** : Euro (EUR)
5. Cliquer sur "Next"
6. Remplir les informations business
7. Cliquer sur "Create"

### Étape 2 : Créer un Data Stream

1. Sélectionner "Web" comme plateforme
2. Remplir :
   - **Website URL** : https://votre-domaine.com
   - **Stream name** : GestiHôtel Production
3. Cliquer sur "Create stream"

### Étape 3 : Récupérer le Measurement ID

Après création, GA4 affiche le Measurement ID (format : `G-XXXXXXXXXX`)

### Étape 4 : Configurer l'environnement

Ajouter dans `.env` (ou `.env.production`) :

```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Étape 5 : Configurer les Événements Custom

Dans GA4, aller dans "Configure" > "Events" et marquer comme conversion :

- `intervention_created`
- `intervention_completed`
- `pwa_installed`

### Étape 6 : Créer un Dashboard

1. Aller dans "Reports" > "Library"
2. Créer un rapport personnalisé avec :
   - Pages vues
   - Utilisateurs actifs
   - Événements par catégorie
   - Web Vitals (FCP, LCP, CLS)

---

## 3️⃣ Configuration Lighthouse CI (5 min)

### Étape 1 : Vérifier la configuration

Le fichier `lighthouserc.json` est déjà configuré avec des budgets optimaux.

### Étape 2 : Exécuter Lighthouse CI

```bash
# Build de production
npm run build

# Exécuter Lighthouse CI
npm run lighthouse
```

### Étape 3 : Analyser les résultats

Lighthouse génère :
- Un rapport console avec les scores
- Un upload temporaire avec les résultats détaillés

**Seuils configurés** :
- Performance : > 90%
- Accessibility : > 90%
- Best Practices : > 90%
- SEO : > 90%
- PWA : > 80%

### Étape 4 : Intégrer dans CI/CD (optionnel)

Ajouter dans `.github/workflows/ci.yml` :

```yaml
- name: Run Lighthouse CI
  run: |
    npm run build
    npm run lighthouse
```

---

## 4️⃣ Vérification du Monitoring (10 min)

### Test Sentry

1. Ouvrir l'application en production
2. Déclencher une erreur (ex: ouvrir DevTools et taper dans la console) :
   ```javascript
   throw new Error('Test Sentry');
   ```
3. Vérifier dans Sentry que l'erreur apparaît

### Test Google Analytics

1. Installer [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) (Chrome Extension)
2. Ouvrir l'application
3. Naviguer entre les pages
4. Vérifier dans GA4 Real-Time que les page views s'affichent
5. Déclencher un événement (ex: créer une intervention)
6. Vérifier dans GA4 Real-Time > Events que l'événement apparaît

### Test Web Vitals

1. Ouvrir DevTools > Network
2. Rafraîchir la page
3. Vérifier dans la console les logs :
   ```
   ✅ Web Vitals monitoring initialized
   📊 FCP: { value: 1234, rating: 'good' }
   📊 LCP: { value: 2345, rating: 'good' }
   ```
4. Vérifier dans GA4 Events que les métriques `FCP`, `LCP`, etc. sont trackées

### Test Lighthouse

```bash
npm run lighthouse
```

Vérifier que tous les scores sont > 90% (sauf PWA > 80%).

---

## 5️⃣ Dashboard Recommandés

### Sentry Dashboard

Créer un dashboard avec :
- **Issues** : Top 10 erreurs par occurrence
- **Performance** : P95 des transactions
- **Users** : Utilisateurs impactés
- **Releases** : Stabilité par version

### GA4 Dashboard

Créer un rapport avec :
- **Engagement** :
  - Pages vues par page
  - Durée moyenne des sessions
  - Taux de rebond
- **Conversions** :
  - Interventions créées
  - Interventions complétées
  - Taux de conversion
- **Performance** :
  - FCP par page
  - LCP par page
  - CLS par page
- **Technologie** :
  - Navigateurs
  - Devices
  - Réseau (3G, 4G, WiFi)

---

## 6️⃣ Alertes à Configurer

### Sentry

- ❌ **Error rate** > 1% des sessions → Email
- 📉 **Crash-free rate** < 99.9% → Email + Slack
- 🐌 **P95 response time** > 3s → Slack

### Google Analytics

Créer des alertes personnalisées :
- 📉 Baisse de > 20% du trafic quotidien
- ⚡ FCP > 3s sur > 10% des sessions
- 📱 Taux d'installation PWA < 15%

---

## 7️⃣ Conformité RGPD

### ✅ Ce qui est déjà fait

- **Sentry** :
  - IP anonymisée
  - Pas d'email dans le contexte utilisateur
  - Masquage automatique du texte en Session Replay

- **Google Analytics** :
  - IP anonymisée (`anonymize_ip: true`)
  - Pas de données personnelles (email, nom)
  - Tracking uniquement par rôle

### 📋 À faire selon votre juridiction

1. Ajouter un bandeau de consentement cookies si nécessaire
2. Documenter le traitement des données dans la politique de confidentialité
3. Permettre l'opt-out du tracking Analytics (déjà supporté via DNT)

---

## 8️⃣ Maintenance

### Quotidien

- ✅ Vérifier les alertes Sentry
- ✅ Check GA4 Real-Time pour traffic anormal

### Hebdomadaire

- 📊 Analyser les top 10 erreurs Sentry
- 📈 Revoir les KPIs GA4 (conversions, engagement)
- ⚡ Vérifier les Web Vitals par page

### Mensuel

- 🔄 Exécuter Lighthouse CI et comparer aux mois précédents
- 📉 Analyser les tendances de performance
- 🎯 Ajuster les budgets performance si nécessaire

---

## 9️⃣ Coûts

| Service | Plan Gratuit | Plan Payant | Recommandation |
|---------|--------------|-------------|----------------|
| **Sentry** | 5K events/mois | $26/mois (50K events) | Gratuit suffisant au démarrage |
| **GA4** | Illimité | - | Toujours gratuit |
| **Lighthouse CI** | - | - | Gratuit (outil open-source) |
| **Web Vitals** | - | - | Gratuit (library open-source) |

**Total estimé** : 0€/mois au démarrage, ~26€/mois en croissance

---

## 🆘 Troubleshooting

### Sentry ne capture pas les erreurs

1. Vérifier que `VITE_SENTRY_DSN` est bien défini
2. Vérifier dans la console : `✅ Sentry initialized`
3. Vérifier que vous n'êtes pas en mode DEV (Sentry désactivé en dev)
4. Tester avec une erreur volontaire :
   ```typescript
   import { captureError } from '@/core/config/sentry';
   captureError(new Error('Test'));
   ```

### GA4 ne track pas les pages

1. Vérifier que `VITE_GA4_MEASUREMENT_ID` est bien défini
2. Vérifier dans la console : `✅ Google Analytics 4 initialized`
3. Installer GA Debugger extension
4. Vérifier dans Network DevTools les requêtes vers `google-analytics.com`

### Lighthouse scores < 90%

1. Vérifier la connexion réseau (utiliser "Desktop" preset)
2. Désactiver les extensions Chrome
3. Exécuter 3 fois et prendre la médiane
4. Analyser les recommandations Lighthouse détaillées

---

## ✅ Checklist Finale

- [ ] Sentry DSN configuré
- [ ] GA4 Measurement ID configuré
- [ ] Build production OK (`npm run build`)
- [ ] Preview production OK (`npm run preview`)
- [ ] Erreur test capturée dans Sentry
- [ ] Page view visible dans GA4 Real-Time
- [ ] Web Vitals visibles dans console
- [ ] Lighthouse CI > 90% (sauf PWA > 80%)
- [ ] Alertes Sentry configurées
- [ ] Dashboard GA4 créé
- [ ] Documentation RGPD mise à jour

---

**Félicitations ! Votre monitoring est opérationnel** 🎉

Pour toute question, consultez :
- [Documentation Sentry](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Documentation GA4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Documentation Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Documentation Web Vitals](https://web.dev/vitals/)
