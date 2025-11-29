# Pull Request

## Description

<!-- Decrivez les changements apportes dans cette PR de maniere claire et concise -->

## Type de changement

<!-- Cochez les cases appropriees en remplaçant [ ] par [x] -->

- [ ] Bug fix (changement non-breaking qui corrige un probleme)
- [ ] Nouvelle fonctionnalite (changement non-breaking qui ajoute une fonctionnalite)
- [ ] Breaking change (correction ou fonctionnalite qui pourrait casser des fonctionnalites existantes)
- [ ] Refactoring (amelioration du code sans changer le comportement)
- [ ] Documentation
- [ ] Mise a jour de dependances
- [ ] Performance
- [ ] Tests

## Issues liees

<!-- Listez les issues GitHub resolues par cette PR -->

Resolves #(issue_number)
Related to #(issue_number)

## Comment a-t-il ete teste ?

<!-- Decrivez les tests que vous avez effectues pour verifier vos changements -->

- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Tests manuels

**Description des tests :**


## Captures d'ecran (si applicable)

<!-- Ajoutez des captures d'ecran pour illustrer les changements visuels -->

### Avant


### Apres


## Checklist

<!-- Verifiez que tous les elements suivants sont respectes -->

### Code Quality

- [ ] Mon code suit les standards de style du projet
- [ ] J'ai effectue une auto-revue de mon code
- [ ] J'ai commente mon code, particulierement dans les zones difficiles a comprendre
- [ ] J'ai supprime les console.log et les commentaires de debug

### Documentation

- [ ] J'ai mis a jour la documentation si necessaire
- [ ] J'ai ajoute/mis a jour les commentaires JSDoc pour les fonctions publiques
- [ ] J'ai mis a jour le README.md si les changements l'exigent

### Tests

- [ ] J'ai ajoute des tests qui prouvent que ma correction est efficace ou que ma fonctionnalite fonctionne
- [ ] Les tests unitaires nouveaux et existants passent localement (`npm test`)
- [ ] Les tests E2E passent localement (`npm run test:e2e`)
- [ ] La couverture de code n'a pas diminue

### Build & CI

- [ ] Le linting passe sans erreur (`npm run lint`)
- [ ] Le type checking passe sans erreur (`npm run type-check`)
- [ ] Le build reussit localement (`npm run build`)
- [ ] Aucun nouveau warning n'a ete introduit

### Dependencies

- [ ] Les nouvelles dependances sont necessaires et justifiees
- [ ] J'ai verifie les licences des nouvelles dependances
- [ ] Les versions sont fixees (pas de versions `^` ou `~` pour les nouvelles deps)

### Security

- [ ] Je n'ai pas expose de secrets ou de donnees sensibles
- [ ] J'ai verifie qu'il n'y a pas de failles de securite evidentes
- [ ] Les inputs utilisateurs sont valides et securises

## Impact sur les performances

<!-- Decrivez l'impact potentiel sur les performances -->

- [ ] Pas d'impact sur les performances
- [ ] Amelioration des performances
- [ ] Possible degradation des performances (justifiee ci-dessous)

**Details :**


## Breaking Changes

<!-- Si cette PR introduit des breaking changes, listez-les ici -->

- [ ] Aucun breaking change
- [ ] Breaking changes (decrits ci-dessous)

**Details des breaking changes :**


## Migration Guide

<!-- Si des breaking changes necessitent une migration, decrivez les etapes ici -->


## Informations supplementaires

<!-- Tout autre contexte pertinent pour cette PR -->


## Pour les reviewers

<!-- Instructions ou points d'attention specifiques pour les reviewers -->

**Points d'attention particuliers :**
-

**Comment tester :**
1.
2.
3.

---

<!-- N'oubliez pas de lier cette PR a un projet ou un milestone si applicable -->
