# Initialisation des Listes Déroulantes

## Fonctionnalité

Lors de la création d'un nouvel établissement, l'application propose maintenant d'initialiser automatiquement les listes déroulantes avec des valeurs par défaut.

## Flux Utilisateur

### 1. Création d'un Établissement

1. L'utilisateur remplit le formulaire de création d'établissement
2. Il clique sur "Créer"
3. L'établissement est créé dans Firestore

### 2. Dialogue d'Initialisation

Après la création réussie, un dialogue s'affiche avec :

#### Titre
**"Établissement créé avec succès"** avec une icône de liste ✓

#### Description
"Voulez-vous initialiser les listes déroulantes par défaut ?"

#### Informations
Un encadré bleu explique ce que contiennent les listes par défaut :
- Types d'interventions (Plomberie, Électricité, Climatisation, etc.)
- Catégories (Maintenance, Réparation, Installation, etc.)
- Priorités (Basse, Normale, Haute, Urgente, Critique)
- Statuts d'interventions
- Localisations (Chambre, Couloir, Hall, Cuisine, etc.)
- Et bien d'autres listes essentielles...

#### Actions Disponibles

**Bouton "Ignorer pour le moment"** (outline)
- Redirige vers la liste des établissements
- Les listes pourront être initialisées plus tard manuellement

**Bouton "Initialiser les listes"** (primary)
- Lance l'initialisation des listes
- Affiche un spinner pendant le chargement
- Message de succès : "Listes déroulantes initialisées avec succès"
- Redirige vers la liste des établissements

## Architecture Technique

### Composant
**Fichier**: `src/pages/establishments/EstablishmentsPages.tsx`
**Composant**: `CreateEstablishmentPage`

### États
```typescript
const [isCreating, setIsCreating] = useState(false);
const [isInitializingLists, setIsInitializingLists] = useState(false);
const [createdEstablishmentId, setCreatedEstablishmentId] = useState<string | null>(null);
```

### Service d'Initialisation
**Fichier**: `src/features/establishments/services/establishmentInitService.ts`
**Fonction**: `initializeEstablishmentLists(establishmentId: string, userId: string)`

### Listes Par Défaut

Les listes par défaut sont définies dans :
**Fichier**: `src/shared/services/defaultReferenceLists.ts`

#### Listes Essentielles

1. **Types d'interventions** (12 items)
   - Plomberie, Électricité, Climatisation, Chauffage, Serrurerie, Menuiserie, Peinture, Nettoyage, Jardinage, IT/Informatique, Sécurité, Autre

2. **Catégories** (6 items)
   - Maintenance préventive, Maintenance corrective, Réparation, Installation, Remplacement, Amélioration

3. **Priorités** (5 items)
   - Basse, Normale, Haute, Urgente, Critique

4. **Statuts** (8 items)
   - Nouveau, En attente, Assigné, En cours, En pause, Terminé, Annulé, Reporté

5. **Localisations** (18 items)
   - Chambre, Salle de bain, Couloir, Hall d'entrée, Réception, etc.

6. **Équipements** (15 items)
   - Climatisation, Chauffage, TV, Coffre-fort, etc.

7. **Services** (features: interventionImportExport)
   - 10 items : Room service, Petit-déjeuner, Blanchisserie, etc.

8. **Étages** (features: rooms)
   - RDC, 1er étage, 2ème étage, 3ème étage, 4ème étage, 5ème étage

9. **Bâtiments** (features: rooms)
   - Bâtiment principal, Annexe A, Annexe B

## Firestore

### Collection
```
establishments/{establishmentId}/config/reference-lists
```

### Structure du Document
```typescript
{
  establishmentId: string;
  version: number;
  lastModified: Timestamp;
  modifiedBy: string;
  lists: {
    [listKey: string]: {
      id: string;
      name: string;
      items: Array<{
        id: string;
        value: string;
        label: string;
        color?: string;
        order: number;
        isActive: boolean;
        isDefault: boolean;
      }>;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}
```

## Utilisation

### À la Création d'un Établissement

1. Créer l'établissement via le formulaire
2. Le dialogue s'affiche automatiquement
3. Choisir "Initialiser les listes" ou "Ignorer"

### Initialisation Manuelle Ultérieure

Si l'utilisateur a choisi "Ignorer", les listes peuvent être initialisées plus tard via :
- Page des paramètres de l'établissement
- Fonction `initializeEstablishmentLists()` du service

## Avantages

### Pour l'Utilisateur
- **Gain de temps** : Pas besoin de créer toutes les listes manuellement
- **Cohérence** : Valeurs standardisées dans tous les établissements
- **Productivité immédiate** : L'établissement est prêt à l'emploi

### Pour le Système
- **Données structurées** : Listes cohérentes facilitant les statistiques
- **Évolutif** : Possibilité d'ajouter de nouvelles listes par défaut
- **Personnalisable** : L'utilisateur peut modifier les listes après l'initialisation

## Cas d'Usage

### Hôtel Nouveau
Un nouvel hôtel est créé dans l'application. L'utilisateur choisit d'initialiser les listes pour démarrer rapidement avec des valeurs standard.

### Hôtel Existant avec Processus Spécifique
Un hôtel avec des processus très spécifiques choisit "Ignorer" et crée ses propres listes personnalisées.

### Migration depuis un Autre Système
Lors d'une migration, l'utilisateur peut ignorer l'initialisation et importer ses propres listes depuis un fichier Excel.

## Tests Manuels

### Test 1 : Création avec Initialisation
1. ✅ Créer un établissement
2. ✅ Cliquer sur "Initialiser les listes"
3. ✅ Vérifier le message de succès
4. ✅ Aller dans Paramètres → Listes de référence
5. ✅ Vérifier que toutes les listes sont présentes

### Test 2 : Création sans Initialisation
1. ✅ Créer un établissement
2. ✅ Cliquer sur "Ignorer pour le moment"
3. ✅ Vérifier la redirection
4. ✅ Aller dans Paramètres → Listes de référence
5. ✅ Vérifier que les listes sont vides

### Test 3 : Gestion des Erreurs
1. ✅ Simuler une erreur réseau
2. ✅ Tenter l'initialisation
3. ✅ Vérifier le message d'erreur
4. ✅ Vérifier que l'utilisateur peut réessayer

## Améliorations Futures

### Prévisualisation
Afficher un aperçu des listes avant l'initialisation

### Initialisation Partielle
Permettre de choisir quelles listes initialiser

### Templates Personnalisés
Créer des templates de listes selon le type d'établissement (Hôtel, Resort, Motel, etc.)

### Import/Export
Permettre d'exporter les listes d'un établissement pour les réutiliser dans un autre

### Historique
Conserver un historique des modifications des listes de référence
