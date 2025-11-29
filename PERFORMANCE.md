# Guide d'Optimisation des Performances - GestiHotel v2

Ce document detaille toutes les optimisations de performance mises en place dans l'application GestiHotel v2.

## Table des matieres

1. [Optimisation des Images](#optimisation-des-images)
2. [Optimisation des Fonts](#optimisation-des-fonts)
3. [Optimisation du Bundle](#optimisation-du-bundle)
4. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
5. [Mise en Cache (Service Worker)](#mise-en-cache-service-worker)
6. [Monitoring des Performances](#monitoring-des-performances)
7. [Scripts d'Analyse](#scripts-danalyse)
8. [Recommandations](#recommandations)

---

## Optimisation des Images

### Configuration automatique (vite-plugin-image-optimizer)

Le plugin optimise automatiquement toutes les images lors du build avec une qualite de 80% pour PNG/JPEG/WebP et optimisation SVG sans perte.

**Gains attendus :**
- Reduction de 30-50% de la taille des images
- Optimisation SVG sans perte de qualite
- Support WebP pour les navigateurs compatibles

### Lazy Loading natif

Toutes les images de l'application utilisent le lazy loading natif du navigateur via CSS :

```css
img {
  loading: lazy;
  decoding: async;
}
```

Pour les images critiques (above the fold), utilisez l'attribut data-priority="high".

---

## Optimisation des Fonts

### Preconnect

Configuration dans index.html pour preconnect vers Firebase :
- firestore.googleapis.com
- firebasestorage.googleapis.com

### Font Display Swap

Le projet utilise les fonts systeme via Tailwind CSS, evitant tout telechargement de fonts externes.

---

## Optimisation du Bundle

### Configuration Terser

Build avec Terser pour minification avancee :
- Suppression de console.log/info/debug en production
- Suppression des debugger
- Suppression des commentaires

**Gains :** Reduction de 10-20% de la taille du bundle

### Code Splitting Intelligent

Les dependances sont divisees en chunks logiques :
- vendor-react : React core
- vendor-router : React Router
- vendor-firebase : Firebase SDK
- vendor-ui : Radix UI components
- vendor-form : Formulaires (react-hook-form, zod)
- vendor-charts : Recharts (lazy loadable)
- vendor-calendar : React Big Calendar (lazy loadable)
- vendor-export : PDF/Excel (jspdf, xlsx)
- vendor-qr : QR/Barcode

**Avantages :**
- Meilleur cache browser (vendors changent rarement)
- Parallelisation du telechargement
- Reduction du temps de First Contentful Paint

### Optimisation des Assets

- Inline assets < 4KB en base64
- Avertissement si chunk > 800KB
- Split CSS par route
- Cache-busting avec hash dans les noms de fichiers

---

## Code Splitting & Lazy Loading

### Router avec Lazy Loading

Toutes les pages utilisent le lazy loading via router.lazy.tsx

**Gains :**
- Initial bundle reduit de 60-70%
- Time to Interactive (TTI) ameliore
- Chargement a la demande des pages

### Feature Flags & Guards

Les fonctionnalites optionnelles sont protegees et lazy-loadees avec FeatureGuard.

---

## Mise en Cache (Service Worker)

### Strategies de Cache

#### 1. Cache First (Assets statiques)
- Images : cache 7 jours, max 100 entrees
- Fonts : cache 1 an, max 30 entrees
- Firebase Storage : cache 30 jours, max 200 entrees

#### 2. Network First (API Firestore)
- Timeout reseau : 10s
- Cache fallback : 24 heures
- Max 100 entrees

### Nettoyage Automatique

Le service worker nettoie automatiquement les anciens caches avec skipWaiting et clientsClaim actives.

---

## Monitoring des Performances

### Web Vitals

Metriques suivies :
- LCP (Largest Contentful Paint) - Cible : < 2.5s
- FID (First Input Delay) - Cible : < 100ms
- CLS (Cumulative Layout Shift) - Cible : < 0.1
- FCP (First Contentful Paint) - Cible : < 1.8s
- TTFB (Time to First Byte) - Cible : < 800ms

### Lighthouse CI

Scripts disponibles :
```bash
npm run lighthouse          # Audit complet
npm run lighthouse:collect  # Collecte des metriques
npm run lighthouse:assert   # Verification des seuils
```

---

## Scripts d'Analyse

### Analyse du Bundle

```bash
npm run build:analyze    # Build + ouverture auto de stats.html
npm run analyze          # Build uniquement
npm run analyze:open     # Ouvrir stats.html
```

Le fichier dist/stats.html contient :
- Treemap visualisant la taille des modules
- Taille gzip et brotli
- Detection des dependances dupliquees
- Analyse des imports inutiles

---

## Recommandations

### 1. Images
- Utilisez des formats modernes (WebP, AVIF)
- Dimensionnez les images a leur taille d'affichage
- Ajoutez data-priority="high" pour les images critiques
- Utilisez des placeholders pendant le chargement

### 2. Fonts
- Limitez le nombre de variantes (regular, bold max)
- Preferez les fonts systeme si possible
- Subset les fonts (caracteres utilises uniquement)

### 3. Bundle
- Analysez regulierement avec npm run build:analyze
- Limitez les chunks a < 800KB
- Evitez les imports barrel (index.ts)
- Utilisez les dynamic imports pour les gros composants

### 4. Code
- Evitez les re-renders inutiles (React.memo, useMemo, useCallback)
- Virtualisez les longues listes
- Utilisez les web workers pour les calculs lourds
- Preferez CSS animations aux JS animations

### 5. Network
- Activez la compression gzip/brotli (serveur)
- Utilisez HTTP/2 ou HTTP/3
- Configurez les headers de cache appropries
- Utilisez un CDN pour les assets statiques

### 6. PWA
- Activez le mode offline
- Configurez les strategies de cache appropriees
- Testez sur connexion lente (3G)
- Implementez le background sync

---

## Metriques Cibles (Core Web Vitals)

| Metrique | Bon      | A ameliorer | Mauvais |
|----------|----------|-------------|---------|
| LCP      | <= 2.5s  | 2.5s - 4.0s | > 4.0s  |
| FID      | <= 100ms | 100-300ms   | > 300ms |
| CLS      | <= 0.1   | 0.1 - 0.25  | > 0.25  |
| FCP      | <= 1.8s  | 1.8s - 3.0s | > 3.0s  |
| TTI      | <= 3.8s  | 3.8s - 7.3s | > 7.3s  |
| TBT      | <= 200ms | 200-600ms   | > 600ms |

---

## Ressources Utiles

- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Derniere mise a jour :** 2025-11-29
**Version :** 1.0.0
