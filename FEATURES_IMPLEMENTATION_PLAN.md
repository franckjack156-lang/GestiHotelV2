# Plan d'Implémentation des Fonctionnalités Manquantes

**Date**: 2025-11-16
**Objectif**: Créer les fonctionnalités listées au niveau de l'établissement qui n'existent pas encore

---

## 📊 Analyse des Fonctionnalités

### ✅ Fonctionnalités Déjà Implémentées

| Feature | Status | Fichiers/Composants |
|---------|--------|---------------------|
| **interventions** | ✅ Complet | InterventionsPage, InterventionDetailsPage, CreateInterventionPage, InterventionForm |
| **rooms** | ✅ Complet | RoomDetailPage, EditRoomPage, RoomAutocomplete |
| **interventionPlanning** | ✅ Complet | PlanningPage |
| **pushNotifications** | ✅ Complet | NotificationCenterPage, useUnreadNotifications |
| **internalChat** | ✅ Complet | MessagingPage, ChatWindow, ConversationList, MessageInput |
| **interventionPhotos** | ✅ Complet | PhotosTab, photosService, PhotosStep |
| **interventionComments** | ✅ Complet | CommentsTab, CommentsList, commentService |
| **interventionHistory** | ✅ Complet | HistoryTab, historyService |
| **interventionParts** | ✅ Complet | PartsTab, partsService |
| **timeTracking** | ✅ Complet | TimeTrackingTab, timeSessionsService |
| **referenceLists** | ✅ Complet | ReferenceListsManager, ReferenceListsOrchestrator |

### ❌ Fonctionnalités Manquantes (Coming Soon)

#### 🎯 **Priorité HAUTE** (Impact utilisateur élevé)

1. **interventionTemplates** (Modèles d'intervention)
   - **Catégorie**: interventions
   - **Badge**: coming-soon
   - **Description**: Créer des modèles d'interventions réutilisables
   - **Impact**: Gain de temps énorme pour les interventions récurrentes
   - **Dépendances**: interventions
   - **Estimation**: 3-4 heures

2. **documents** (Gestion documentaire)
   - **Catégorie**: media
   - **Badge**: coming-soon
   - **Description**: Upload et gestion de documents (PDF, Word, etc.)
   - **Impact**: Essentiel pour rapports, factures, devis
   - **Dépendances**: Aucune
   - **Estimation**: 4-5 heures

3. **roomsQRCode** (QR Codes pour chambres)
   - **Catégorie**: rooms
   - **Badge**: coming-soon
   - **Description**: Générer et scanner des QR codes pour identification rapide
   - **Impact**: Améliore l'expérience technicien sur le terrain
   - **Dépendances**: rooms
   - **Estimation**: 2-3 heures

#### 🔶 **Priorité MOYENNE** (Fonctionnalités business)

4. **inventory** (Inventaire)
   - **Catégorie**: parts
   - **Badge**: coming-soon
   - **Description**: Gestion des stocks de pièces détachées
   - **Impact**: Crucial pour la maintenance préventive
   - **Dépendances**: interventionParts
   - **Estimation**: 5-6 heures

5. **suppliers** (Fournisseurs)
   - **Catégorie**: parts
   - **Badge**: coming-soon
   - **Description**: Gestion des fournisseurs de pièces
   - **Impact**: Optimise les commandes et approvisionnements
   - **Dépendances**: Aucune
   - **Estimation**: 3-4 heures

6. **interventionRecurrence** (Récurrence)
   - **Catégorie**: interventions
   - **Badge**: coming-soon
   - **Description**: Planifier des interventions récurrentes
   - **Impact**: Maintenance préventive automatisée
   - **Dépendances**: interventions, interventionPlanning
   - **Estimation**: 4-5 heures

#### 🔷 **Priorité BASSE** (Intégrations tierces)

7. **thirdPartyIntegrations** (Intégrations tierces)
   - **Catégorie**: integrations
   - **Badge**: premium, coming-soon
   - **Description**: Connecteurs API pour systèmes externes
   - **Impact**: Élargit l'écosystème
   - **Dépendances**: Aucune
   - **Estimation**: 8-10 heures

---

## 🏗️ Architecture des Nouvelles Fonctionnalités

### Structure de Dossiers Proposée

```
src/
├── features/
│   ├── templates/                    # 1. interventionTemplates
│   │   ├── components/
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── TemplateForm.tsx
│   │   │   ├── TemplatesList.tsx
│   │   │   └── CreateTemplateDialog.tsx
│   │   ├── hooks/
│   │   │   └── useTemplates.ts
│   │   ├── services/
│   │   │   └── templateService.ts
│   │   └── types/
│   │       └── template.types.ts
│   │
│   ├── documents/                    # 2. documents
│   │   ├── components/
│   │   │   ├── DocumentUploader.tsx
│   │   │   ├── DocumentsList.tsx
│   │   │   ├── DocumentCard.tsx
│   │   │   └── DocumentViewer.tsx
│   │   ├── hooks/
│   │   │   └── useDocuments.ts
│   │   ├── services/
│   │   │   └── documentService.ts
│   │   └── types/
│   │       └── document.types.ts
│   │
│   ├── qrcode/                       # 3. roomsQRCode
│   │   ├── components/
│   │   │   ├── QRCodeGenerator.tsx
│   │   │   ├── QRCodeScanner.tsx
│   │   │   └── QRCodeBatchGenerator.tsx
│   │   ├── hooks/
│   │   │   └── useQRCode.ts
│   │   └── services/
│   │       └── qrcodeService.ts
│   │
│   ├── inventory/                    # 4. inventory
│   │   ├── components/
│   │   │   ├── InventoryList.tsx
│   │   │   ├── InventoryForm.tsx
│   │   │   ├── StockLevelIndicator.tsx
│   │   │   └── LowStockAlert.tsx
│   │   ├── hooks/
│   │   │   └── useInventory.ts
│   │   ├── services/
│   │   │   └── inventoryService.ts
│   │   └── types/
│   │       └── inventory.types.ts
│   │
│   ├── suppliers/                    # 5. suppliers
│   │   ├── components/
│   │   │   ├── SupplierCard.tsx
│   │   │   ├── SupplierForm.tsx
│   │   │   └── SuppliersList.tsx
│   │   ├── hooks/
│   │   │   └── useSuppliers.ts
│   │   ├── services/
│   │   │   └── supplierService.ts
│   │   └── types/
│   │       └── supplier.types.ts
│   │
│   └── recurrence/                   # 6. interventionRecurrence
│       ├── components/
│       │   ├── RecurrenceForm.tsx
│       │   ├── RecurrencePreview.tsx
│       │   └── RecurrenceSchedule.tsx
│       ├── hooks/
│       │   └── useRecurrence.ts
│       ├── services/
│       │   └── recurrenceService.ts
│       └── types/
│           └── recurrence.types.ts
│
├── pages/
│   ├── templates/
│   │   └── TemplatesPage.tsx
│   ├── documents/
│   │   └── DocumentsPage.tsx
│   ├── inventory/
│   │   ├── InventoryPage.tsx
│   │   └── InventoryDetailsPage.tsx
│   └── suppliers/
│       ├── SuppliersPage.tsx
│       └── SupplierDetailsPage.tsx
```

---

## 🎯 Plan d'Implémentation (Ordre Recommandé)

### Phase 1: Fonctionnalités Simples (Jour 1)

#### ✅ **1. roomsQRCode** (2-3h)
**Pourquoi en premier**: Simple, autonome, valeur ajoutée immédiate

**Tâches**:
- [ ] Installer dépendance: `npm install qrcode react-qr-reader`
- [ ] Créer `src/features/qrcode/components/QRCodeGenerator.tsx`
- [ ] Créer `src/features/qrcode/components/QRCodeScanner.tsx`
- [ ] Créer `src/features/qrcode/services/qrcodeService.ts`
- [ ] Intégrer dans RoomDetailPage (bouton "Générer QR Code")
- [ ] Ajouter scanner dans CreateInterventionPage
- [ ] Tests manuels

**Livrables**:
- Génération QR code avec logo établissement
- Scanner QR code pour auto-remplir chambre
- Téléchargement PNG du QR code
- Génération batch pour toutes les chambres

---

#### ✅ **2. interventionTemplates** (3-4h)
**Pourquoi en deuxième**: Forte demande utilisateur, pas de dépendances complexes

**Tâches**:
- [ ] Créer types `template.types.ts`
- [ ] Créer `templateService.ts` (CRUD Firestore)
- [ ] Créer `TemplateForm.tsx` (formulaire de création)
- [ ] Créer `TemplatesList.tsx` (liste des modèles)
- [ ] Créer page `TemplatesPage.tsx`
- [ ] Ajouter route `/app/templates`
- [ ] Intégrer dans CreateInterventionPage (bouton "Utiliser un modèle")
- [ ] Ajouter dans Sidebar (icône FileTemplate)
- [ ] Tests manuels

**Livrables**:
- CRUD complet des modèles
- Application d'un modèle lors de création intervention
- Liste filtrable/recherchable de modèles
- Duplication de modèles

**Types proposés**:
```typescript
interface InterventionTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;

  // Données pré-remplies
  type: InterventionType;
  priority: InterventionPriority;
  title: string;
  description: string;
  estimatedDuration?: number;

  // Métadonnées
  establishmentId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number; // Statistique
}
```

---

### Phase 2: Fonctionnalités Métier (Jour 2)

#### ✅ **3. suppliers** (3-4h)
**Pourquoi en troisième**: Fondation pour inventory

**Tâches**:
- [ ] Créer types `supplier.types.ts`
- [ ] Créer `supplierService.ts` (CRUD Firestore)
- [ ] Créer `SupplierForm.tsx`
- [ ] Créer `SuppliersList.tsx`
- [ ] Créer `SupplierCard.tsx`
- [ ] Créer pages `SuppliersPage.tsx` et `SupplierDetailsPage.tsx`
- [ ] Ajouter routes `/app/suppliers`
- [ ] Ajouter dans Sidebar (icône Truck)
- [ ] Tests manuels

**Livrables**:
- CRUD complet des fournisseurs
- Contact info, délais livraison, notes
- Historique des commandes
- Filtrage et recherche

**Types proposés**:
```typescript
interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;

  // Termes commerciaux
  paymentTerms?: string;
  deliveryDays?: number;
  minimumOrder?: number;

  // Métadonnées
  establishmentId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

#### ✅ **4. inventory** (5-6h)
**Pourquoi en quatrième**: Nécessite suppliers

**Tâches**:
- [ ] Créer types `inventory.types.ts`
- [ ] Créer `inventoryService.ts` (CRUD + stock tracking)
- [ ] Créer `InventoryForm.tsx`
- [ ] Créer `InventoryList.tsx`
- [ ] Créer `StockLevelIndicator.tsx`
- [ ] Créer `LowStockAlert.tsx`
- [ ] Créer pages `InventoryPage.tsx` et `InventoryDetailsPage.tsx`
- [ ] Ajouter routes `/app/inventory`
- [ ] Intégrer avec PartsTab (sélection depuis inventaire)
- [ ] Ajouter dans Sidebar (icône Package)
- [ ] Cloud Function pour alertes stock bas
- [ ] Tests manuels

**Livrables**:
- CRUD pièces en stock
- Gestion quantités (entrées/sorties)
- Alertes stock bas
- Lien avec fournisseurs
- Historique mouvements
- Stats (valeur stock, rotation)

**Types proposés**:
```typescript
interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  description?: string;
  category?: string;

  // Stock
  quantity: number;
  unit: string; // 'pièce', 'mètre', 'kg', etc.
  minStock: number; // Seuil d'alerte
  maxStock?: number;
  location?: string; // Emplacement physique

  // Finances
  unitPrice: number;
  supplierId?: string;

  // Métadonnées
  establishmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  interventionId?: string; // Si lié à une intervention
  userId: string;
  timestamp: Date;
}
```

---

### Phase 3: Fonctionnalités Avancées (Jour 3)

#### ✅ **5. documents** (4-5h)

**Tâches**:
- [ ] Créer types `document.types.ts`
- [ ] Créer `documentService.ts` (upload Firebase Storage)
- [ ] Créer `DocumentUploader.tsx` (drag & drop)
- [ ] Créer `DocumentsList.tsx`
- [ ] Créer `DocumentViewer.tsx` (preview PDF inline)
- [ ] Créer page `DocumentsPage.tsx`
- [ ] Ajouter routes `/app/documents`
- [ ] Intégrer onglet Documents dans InterventionDetails
- [ ] Ajouter dans Sidebar (icône FileText)
- [ ] Cloud Storage Rules pour sécurité
- [ ] Tests upload/download

**Livrables**:
- Upload documents (PDF, DOCX, XLSX, images)
- Preview inline (PDF)
- Téléchargement
- Catégorisation (factures, devis, rapports, etc.)
- Association interventions/établissements
- Versioning optionnel

**Types proposés**:
```typescript
interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'quote' | 'report' | 'contract' | 'other';
  description?: string;

  // Fichier
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  storageUrl: string; // Firebase Storage path
  downloadUrl: string;

  // Relations
  establishmentId: string;
  interventionId?: string;
  userId?: string;

  // Métadonnées
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
}
```

---

#### ✅ **6. interventionRecurrence** (4-5h)

**Tâches**:
- [ ] Installer dépendance: `npm install rrule`
- [ ] Créer types `recurrence.types.ts`
- [ ] Créer `recurrenceService.ts` (CRUD + génération occurrences)
- [ ] Créer `RecurrenceForm.tsx` (UI conviviale RRULE)
- [ ] Créer `RecurrencePreview.tsx` (preview prochaines dates)
- [ ] Intégrer dans CreateInterventionPage (checkbox "Récurrent")
- [ ] Cloud Function pour créer interventions automatiquement
- [ ] Affichage badge "Récurrent" sur InterventionCard
- [ ] Tests manuels

**Livrables**:
- Définition récurrence (quotidien, hebdo, mensuel, custom)
- Génération automatique interventions futures
- Preview calendrier récurrence
- Modification/suppression série complète
- Exception dates (skip certaines occurrences)

**Types proposés**:
```typescript
interface RecurrenceRule {
  id: string;

  // Template intervention
  templateData: Partial<Intervention>;

  // Règle de récurrence (rrule format)
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // tous les X jours/semaines/mois
  daysOfWeek?: number[]; // pour weekly: [0,2,4] = lun, mer, ven
  dayOfMonth?: number; // pour monthly: 15 = le 15 du mois

  // Limites
  startDate: Date;
  endDate?: Date;
  count?: number; // ou nombre d'occurrences

  // État
  isActive: boolean;
  lastGenerated?: Date;
  nextGeneration?: Date;

  // Métadonnées
  establishmentId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Phase 4: Intégrations (Optionnel)

#### ✅ **7. thirdPartyIntegrations** (8-10h)
**Note**: Premium feature, nécessite architecture robuste

**Tâches**:
- [ ] Créer système de webhooks (incoming/outgoing)
- [ ] API REST pour systèmes externes
- [ ] OAuth2 pour authentification tierce
- [ ] Connecteurs pré-configurés (Zapier, Make, etc.)
- [ ] Logs d'intégration
- [ ] Interface de gestion API keys
- [ ] Documentation API (Swagger/OpenAPI)

**Livrables**:
- Webhooks entrants/sortants
- API REST publique
- OAuth2 authentication
- Logs et monitoring
- Connecteurs populaires

---

## 🗄️ Base de Données Firestore

### Collections à Créer

```
/establishments/{establishmentId}/
  ├── interventionTemplates/    # Phase 1.2
  ├── suppliers/                # Phase 2.1
  ├── inventory/                # Phase 2.2
  │   └── movements/            # Sous-collection
  ├── documents/                # Phase 3.1
  └── recurrenceRules/          # Phase 3.2
```

### Storage Firebase

```
/establishments/{establishmentId}/
  └── documents/
      ├── invoices/
      ├── quotes/
      ├── reports/
      └── contracts/
```

---

## 📱 Routes à Ajouter

```typescript
// router.lazy.tsx - Nouvelles routes

// Templates
{
  path: 'templates',
  element: <FeatureGuard feature="interventionTemplates">{withSuspense(TemplatesPage)}</FeatureGuard>,
}

// Documents
{
  path: 'documents',
  element: <FeatureGuard feature="documents">{withSuspense(DocumentsPage)}</FeatureGuard>,
}

// Inventory
{
  path: 'inventory',
  element: <FeatureGuard feature="inventory">{withSuspense(InventoryPage)}</FeatureGuard>,
},
{
  path: 'inventory/:id',
  element: <FeatureGuard feature="inventory">{withSuspense(InventoryDetailsPage)}</FeatureGuard>,
}

// Suppliers
{
  path: 'suppliers',
  element: <FeatureGuard feature="suppliers">{withSuspense(SuppliersPage)}</FeatureGuard>,
},
{
  path: 'suppliers/:id',
  element: <FeatureGuard feature="suppliers">{withSuspense(SupplierDetailsPage)}</FeatureGuard>,
}
```

---

## 🎨 Sidebar Navigation

Ajouter dans `Sidebar.tsx`:

```typescript
const allNavItems: NavItem[] = [
  // ... existant
  {
    translationKey: 'templates',
    href: '/app/templates',
    icon: FileTemplate,
    requiredFeature: 'interventionTemplates',
  },
  {
    translationKey: 'documents',
    href: '/app/documents',
    icon: FileText,
    requiredFeature: 'documents',
  },
  {
    translationKey: 'inventory',
    href: '/app/inventory',
    icon: Package,
    requiredFeature: 'inventory',
  },
  {
    translationKey: 'suppliers',
    href: '/app/suppliers',
    icon: Truck,
    requiredFeature: 'suppliers',
  },
];
```

---

## 📦 Dépendances NPM à Installer

```bash
# QR Code
npm install qrcode react-qr-reader
npm install -D @types/qrcode

# Récurrence
npm install rrule

# Documents (optionnel)
npm install react-pdf  # Si preview PDF
npm install file-saver # Pour download
```

---

## 🔒 Règles de Sécurité Firestore

```javascript
// firestore.rules - Ajouter

// Templates
match /establishments/{establishmentId}/interventionTemplates/{templateId} {
  allow read: if isEstablishmentUser(establishmentId);
  allow write: if isEstablishmentAdmin(establishmentId);
}

// Suppliers
match /establishments/{establishmentId}/suppliers/{supplierId} {
  allow read: if isEstablishmentUser(establishmentId);
  allow write: if isEstablishmentAdmin(establishmentId);
}

// Inventory
match /establishments/{establishmentId}/inventory/{itemId} {
  allow read: if isEstablishmentUser(establishmentId);
  allow write: if isEstablishmentUser(establishmentId); // Tous peuvent modifier stock

  match /movements/{movementId} {
    allow read: if isEstablishmentUser(establishmentId);
    allow create: if isEstablishmentUser(establishmentId);
    allow update, delete: if false; // Mouvements immuables
  }
}

// Documents
match /establishments/{establishmentId}/documents/{documentId} {
  allow read: if isEstablishmentUser(establishmentId);
  allow create: if isEstablishmentUser(establishmentId);
  allow update, delete: if isDocumentOwner(documentId) || isEstablishmentAdmin(establishmentId);
}

// Recurrence Rules
match /establishments/{establishmentId}/recurrenceRules/{ruleId} {
  allow read: if isEstablishmentUser(establishmentId);
  allow write: if isEstablishmentAdmin(establishmentId);
}
```

---

## 🧪 Tests à Effectuer

### Tests Fonctionnels par Feature

#### interventionTemplates
- [ ] Créer un modèle
- [ ] Lister les modèles
- [ ] Modifier un modèle
- [ ] Supprimer un modèle
- [ ] Appliquer un modèle lors de création intervention
- [ ] Vérifier pré-remplissage correct des champs

#### roomsQRCode
- [ ] Générer QR code pour une chambre
- [ ] Télécharger QR code en PNG
- [ ] Scanner QR code
- [ ] Vérifier auto-remplissage chambre
- [ ] Générer batch QR codes

#### suppliers
- [ ] CRUD complet fournisseurs
- [ ] Recherche et filtrage
- [ ] Association avec inventory

#### inventory
- [ ] CRUD articles
- [ ] Ajout stock (mouvement IN)
- [ ] Retrait stock (mouvement OUT)
- [ ] Alerte stock bas
- [ ] Utilisation dans PartsTab
- [ ] Historique mouvements

#### documents
- [ ] Upload document
- [ ] Preview PDF
- [ ] Téléchargement
- [ ] Catégorisation
- [ ] Association intervention
- [ ] Suppression

#### interventionRecurrence
- [ ] Créer règle récurrence simple (hebdomadaire)
- [ ] Preview prochaines occurrences
- [ ] Génération automatique interventions
- [ ] Modification série
- [ ] Désactivation règle

---

## 📊 Estimation Totale

| Feature | Heures | Complexité |
|---------|--------|------------|
| roomsQRCode | 2-3h | Basse |
| interventionTemplates | 3-4h | Basse |
| suppliers | 3-4h | Moyenne |
| inventory | 5-6h | Moyenne |
| documents | 4-5h | Moyenne |
| interventionRecurrence | 4-5h | Haute |
| **TOTAL** | **21-27h** | - |

**Planning recommandé**: 3-4 jours de développement concentré

---

## ✅ Checklist de Démarrage

Avant de commencer:
- [ ] Lire ce plan en entier
- [ ] Installer toutes les dépendances NPM
- [ ] Créer branches Git par feature (`feature/templates`, etc.)
- [ ] Préparer environnement de test

Par feature:
- [ ] Créer types TypeScript
- [ ] Créer service Firestore
- [ ] Créer composants UI
- [ ] Créer pages
- [ ] Ajouter routes
- [ ] Ajouter navigation Sidebar
- [ ] Mettre à jour règles Firestore
- [ ] Tests manuels
- [ ] Documentation

---

## 🚀 Prochaine Étape

**Commencer par Phase 1: roomsQRCode** (le plus simple, valeur ajoutée immédiate)

Prêt à démarrer l'implémentation ?
