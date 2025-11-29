# Guide de Contribution - GestiHotel v2

Merci de votre interet pour contribuer a GestiHotel v2! Ce document fournit les directives et les bonnes pratiques pour contribuer au projet.

## Table des matieres

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Configuration de l'Environnement de Developpement](#configuration-de-lenvironnement-de-developpement)
- [Workflow Git](#workflow-git)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Processus de Pull Request](#processus-de-pull-request)
- [Rapporter des Bugs](#rapporter-des-bugs)
- [Proposer des Fonctionnalites](#proposer-des-fonctionnalites)

## Code de Conduite

En participant a ce projet, vous acceptez de respecter notre code de conduite implicite :
- Etre respectueux et inclusif
- Accepter les critiques constructives
- Se concentrer sur ce qui est meilleur pour la communaute
- Faire preuve d'empathie envers les autres membres de la communaute

## Comment Contribuer

Il existe plusieurs façons de contribuer a GestiHotel v2 :

1. **Rapporter des bugs** - Utilisez les issues GitHub pour rapporter des bugs
2. **Proposer des ameliorations** - Suggerez de nouvelles fonctionnalites via les issues
3. **Ameliorer la documentation** - Aidez a ameliorer la documentation
4. **Ecrire du code** - Soumettez des pull requests pour corriger des bugs ou ajouter des fonctionnalites

## Configuration de l'Environnement de Developpement

### Prerequis

- Node.js 20.x ou superieur
- npm 10.x ou superieur
- Git
- Un compte Firebase (pour le developpement local)

### Installation

1. **Clonez le depot**
   ```bash
   git clone https://github.com/votre-username/gestihotel-v2.git
   cd gestihotel-v2
   ```

2. **Installez les dependances**
   ```bash
   npm install
   ```

3. **Configurez les variables d'environnement**

   Creez un fichier `.env.local` a la racine du projet avec vos configurations Firebase :
   ```env
   VITE_FIREBASE_API_KEY=votre_api_key
   VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
   VITE_FIREBASE_PROJECT_ID=votre_project_id
   VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   VITE_FIREBASE_APP_ID=votre_app_id
   ```

4. **Lancez le serveur de developpement**
   ```bash
   npm run dev
   ```

5. **Lancez les tests**
   ```bash
   npm test
   ```

## Workflow Git

Nous utilisons le workflow Git Flow avec quelques adaptations :

### Branches

- `main` - Branche de production (deploiement automatique)
- `develop` - Branche de developpement (staging)
- `feature/*` - Nouvelles fonctionnalites
- `fix/*` - Corrections de bugs
- `hotfix/*` - Corrections urgentes en production
- `refactor/*` - Refactoring de code
- `docs/*` - Documentation

### Conventions de Nommage

```bash
# Nouvelle fonctionnalite
git checkout -b feature/nom-de-la-fonctionnalite

# Correction de bug
git checkout -b fix/description-du-bug

# Hotfix
git checkout -b hotfix/description-du-probleme

# Refactoring
git checkout -b refactor/description-du-refactor

# Documentation
git checkout -b docs/description-de-la-doc
```

### Commits

Nous suivons la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types de commits :**
- `feat`: Nouvelle fonctionnalite
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Changements de formatage (espaces, virgules, etc.)
- `refactor`: Refactoring de code (ni bug fix ni nouvelle fonctionnalite)
- `perf`: Amelioration de performance
- `test`: Ajout ou modification de tests
- `chore`: Modifications des outils, configurations, dependances

**Exemples :**
```bash
git commit -m "feat(reservations): ajouter filtre par date"
git commit -m "fix(auth): corriger la redirection apres login"
git commit -m "docs(readme): mettre a jour les instructions d'installation"
git commit -m "refactor(components): simplifier la logique du composant Calendar"
```

## Standards de Code

### TypeScript

- Utilisez TypeScript de maniere stricte (mode `strict` active)
- Definissez des types explicites pour les fonctions publiques
- Evitez l'utilisation de `any`, preferez `unknown` si necessaire
- Utilisez des interfaces pour les objets complexes

### React

- Utilisez des composants fonctionnels avec Hooks
- Decomposez les composants complexes en composants plus petits
- Utilisez `memo()` pour optimiser les rendus si necessaire
- Suivez les conventions de nommage React (PascalCase pour les composants)

### Style et Formatage

Le projet utilise :
- **ESLint** pour le linting
- **Prettier** pour le formatage
- **Tailwind CSS** pour le styling

**Avant de commiter :**
```bash
# Verifier le linting
npm run lint

# Corriger automatiquement les problemes de linting
npm run lint:fix

# Verifier le formatage
npm run format:check

# Formater le code
npm run format

# Verifier les types TypeScript
npm run type-check
```

### Architecture

```
src/
├── components/       # Composants reutilisables
│   ├── ui/          # Composants UI de base (shadcn/ui)
│   └── features/    # Composants specifiques aux fonctionnalites
├── pages/           # Pages de l'application
├── hooks/           # Hooks React personnalises
├── lib/             # Utilitaires et helpers
├── services/        # Services (Firebase, API, etc.)
├── store/           # State management (Zustand)
├── types/           # Definitions de types TypeScript
├── styles/          # Styles globaux
└── utils/           # Fonctions utilitaires
```

## Tests

### Types de Tests

1. **Tests Unitaires** - Avec Vitest
   ```bash
   npm test                 # Mode watch
   npm run test:coverage    # Avec couverture
   ```

2. **Tests E2E** - Avec Playwright
   ```bash
   npm run test:e2e        # Lancer les tests E2E
   npm run test:e2e:ui     # Interface graphique
   ```

### Couverture de Code

Nous visons une couverture de code minimale de **80%** pour :
- Les fonctions critiques (authentification, paiements, reservations)
- Les hooks personnalises
- Les utilitaires

### Ecriture de Tests

**Exemple de test unitaire :**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Processus de Pull Request

### Avant de Soumettre

1. Assurez-vous que votre code respecte tous les standards
2. Lancez tous les tests et assurez-vous qu'ils passent
3. Mettez a jour la documentation si necessaire
4. Testez votre code dans differents navigateurs si possible

### Soumettre une PR

1. **Creez votre branche** depuis `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```

2. **Faites vos modifications** et commitez
   ```bash
   git add .
   git commit -m "feat: description de la fonctionnalite"
   ```

3. **Pushez votre branche**
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```

4. **Ouvrez une Pull Request** sur GitHub
   - Ciblez la branche `develop`
   - Remplissez le template de PR
   - Ajoutez des captures d'ecran si pertinent
   - Liez les issues concernees

### Template de Pull Request

```markdown
## Description
[Description claire et concise des changements]

## Type de changement
- [ ] Bug fix (changement non-breaking qui corrige un probleme)
- [ ] Nouvelle fonctionnalite (changement non-breaking qui ajoute une fonctionnalite)
- [ ] Breaking change (correction ou fonctionnalite qui casserait des fonctionnalites existantes)
- [ ] Documentation

## Comment a-t-il ete teste ?
[Decrivez les tests que vous avez effectues]

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai effectue une auto-revue de mon code
- [ ] J'ai commente mon code, particulierement dans les zones complexes
- [ ] J'ai mis a jour la documentation si necessaire
- [ ] Mes changements ne generent pas de nouveaux warnings
- [ ] J'ai ajoute des tests qui prouvent que ma correction est efficace ou que ma fonctionnalite fonctionne
- [ ] Les tests unitaires passent localement
- [ ] Les tests E2E passent localement

## Captures d'ecran (si applicable)
[Ajoutez des captures d'ecran ici]
```

### Revue de Code

Votre PR sera revue par au moins un mainteneur. Attendez-vous a :
- Des questions de clarification
- Des demandes de changements
- Des suggestions d'amelioration

**Soyez patient et ouvert aux feedbacks !**

## Rapporter des Bugs

### Avant de Rapporter

1. Verifiez que le bug n'a pas deja ete rapporte
2. Assurez-vous que c'est bien un bug et non une question d'utilisation
3. Collectez les informations pertinentes

### Template de Bug Report

```markdown
## Description du Bug
[Description claire et concise du bug]

## Pour Reproduire
Etapes pour reproduire le comportement :
1. Allez sur '...'
2. Cliquez sur '...'
3. Faites defiler jusqu'a '...'
4. Voyez l'erreur

## Comportement Attendu
[Description de ce qui devrait se passer]

## Comportement Actuel
[Description de ce qui se passe reellement]

## Captures d'ecran
[Si applicable, ajoutez des captures d'ecran]

## Environnement
- OS: [ex: Windows 11, macOS 14]
- Navigateur: [ex: Chrome 120, Firefox 121]
- Version de l'application: [ex: 1.2.3]

## Informations Supplementaires
[Tout autre contexte pertinent]
```

## Proposer des Fonctionnalites

### Template de Feature Request

```markdown
## Description de la Fonctionnalite
[Description claire et concise de la fonctionnalite souhaitee]

## Probleme a Resoudre
[Quel probleme cette fonctionnalite resout-elle ?]

## Solution Proposee
[Description de la solution que vous envisagez]

## Alternatives Considerees
[Description des alternatives que vous avez envisagees]

## Informations Supplementaires
[Tout autre contexte, capture d'ecran, ou exemple]
```

## Questions ?

Si vous avez des questions qui ne sont pas couvertes dans ce guide :
1. Consultez la [documentation](./README.md)
2. Ouvrez une [issue GitHub](https://github.com/votre-username/gestihotel-v2/issues)
3. Contactez l'equipe de developpement

## Ressources Utiles

- [Documentation React](https://react.dev)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Vite](https://vite.dev)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

Merci pour votre contribution ! Ensemble, nous construisons un meilleur GestiHotel.
