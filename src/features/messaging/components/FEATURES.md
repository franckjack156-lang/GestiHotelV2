# Fonctionnalités Détaillées - Composants de Messagerie

Guide visuel de toutes les fonctionnalités implémentées dans les composants de messagerie.

---

## 🗂️ ConversationList

### Vue d'Ensemble
Sidebar gauche affichant toutes les conversations de l'utilisateur.

### Fonctionnalités Visuelles

#### 1. Header
```
┌─────────────────────────────────────┐
│ Messagerie              [+ Nouveau] │
└─────────────────────────────────────┘
```
- Titre "Messagerie"
- Bouton "Nouveau" pour créer une conversation

#### 2. Barre de Recherche
```
┌─────────────────────────────────────┐
│ 🔍 Rechercher...                    │
└─────────────────────────────────────┘
```
- Recherche en temps réel
- Filtre par nom ou contenu du dernier message

#### 3. Filtres par Type
```
┌─────────────────────────────────────┐
│ [Tous] [Direct] [Groupes] [Interv.]│
└─────────────────────────────────────┘
```
- 4 onglets pour filtrer les conversations
- Active visuellement l'onglet sélectionné

#### 4. Liste des Conversations
```
┌─────────────────────────────────────┐
│ 📌 (avatar) Marie Dupont      10:30│
│    ✓✓ Vous: D'accord!          [2] │
├─────────────────────────────────────┤
│ 👥 (avatar) Équipe Technique   Hier │
│    Jean: La réparation...          │
├─────────────────────────────────────┤
│ 🔧 (avatar) Intervention #123  9:15│
│    typing...                        │
└─────────────────────────────────────┘
```

**Éléments d'une conversation**:
- 📌 Icône d'épinglage (si épinglée)
- 👥/🔧 Icône de type (groupe/intervention)
- Avatar avec indicateur en ligne (point vert)
- Nom de la conversation
- Timestamp du dernier message
- Preview du dernier message avec:
  - ✓✓ Double check si lu
  - Nom de l'expéditeur
  - Contenu tronqué
- Badge de messages non lus
- "typing..." si quelqu'un écrit

#### 5. États Spéciaux

**Conversation Épinglée**:
```
┌─────────────────────────────────────┐
│ 📌 [fond bleu clair]                │
│    Marie Dupont               10:30 │
└─────────────────────────────────────┘
```

**Conversation avec Messages Non Lus**:
```
┌─────────────────────────────────────┐
│ Jean Martin (texte gras)      10:30 │
│ Nouveau message (gras)          [5] │
└─────────────────────────────────────┘
```

**Indicateur "Typing"**:
```
┌─────────────────────────────────────┐
│ Sophie Bernard                      │
│ Marie écrit... (en italique bleu)   │
└─────────────────────────────────────┘
```

**État Vide**:
```
┌─────────────────────────────────────┐
│         (icône cercle)              │
│   Aucune conversation trouvée       │
│   [Créer une nouvelle conversation] │
└─────────────────────────────────────┘
```

---

## 💬 ChatWindow

### Vue d'Ensemble
Fenêtre principale de chat avec messages et interactions.

### Fonctionnalités Visuelles

#### 1. Header
```
┌──────────────────────────────────────────────────────┐
│ (avatar●) Marie Dupont                           ⋮   │
│          En ligne                                     │
└──────────────────────────────────────────────────────┘
```
- Avatar avec point vert si en ligne
- Nom de la conversation
- Statut (en ligne / typing...)
- Menu actions (⋮) avec:
  - 📋 Informations
  - 📌 Épingler/Désépingler
  - 📦 Archiver

#### 2. Zone de Messages

**Séparateur de Date**:
```
┌──────────────────────────────────────────────────────┐
│              ┌─────────────┐                         │
│              │ Aujourd'hui │                         │
│              └─────────────┘                         │
└──────────────────────────────────────────────────────┘
```

**Message Reçu**:
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Marie Dupont                                │
│ ┌────────────────────────┐                           │
│ │ Bonjour ! Comment vas- │                           │
│ │ tu ?                   │                           │
│ │                  10:30 │                           │
│ └────────────────────────┘                           │
│   👍2  ❤️1                                           │
└──────────────────────────────────────────────────────┘
```

**Message Envoyé**:
```
┌──────────────────────────────────────────────────────┐
│                          ┌─────────────────────────┐ │
│                          │ Très bien merci !       │ │
│                          │ Et toi ?                │ │
│                          │ 10:31 ✓✓                │ │
│                          └─────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```
- ✓ = Envoyé
- ✓✓ = Lu

**Message avec Réponse**:
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Marie                                       │
│ ┌────────────────────────┐                           │
│ │ ┃ Vous                 │                           │
│ │ ┃ Comment vas-tu ?     │                           │
│ │ ────────────────────── │                           │
│ │ Très bien, merci pour  │                           │
│ │ ta question !          │                           │
│ │                  10:32 │                           │
│ └────────────────────────┘                           │
└──────────────────────────────────────────────────────┘
```

**Message avec Pièce Jointe (Image)**:
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Jean                                        │
│ ┌────────────────────────┐                           │
│ │ Voici la photo !       │                           │
│ │ ┌──────────────────┐   │                           │
│ │ │   [IMAGE]        │   │                           │
│ │ │                  │   │                           │
│ │ └──────────────────┘   │                           │
│ │                  10:35 │                           │
│ └────────────────────────┘                           │
└──────────────────────────────────────────────────────┘
```

**Message avec Fichier**:
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Pierre                                      │
│ ┌────────────────────────┐                           │
│ │ 📄 rapport.pdf         │                           │
│ │    1.2 MB          ⬇️  │                           │
│ │                  10:40 │                           │
│ └────────────────────────┘                           │
└──────────────────────────────────────────────────────┘
```

**Message Système**:
```
┌──────────────────────────────────────────────────────┐
│              ┌───────────────────────┐                │
│              │ Jean a rejoint le    │                │
│              │ groupe               │                │
│              └───────────────────────┘                │
└──────────────────────────────────────────────────────┘
```

**Message avec Mention**:
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Sophie                                      │
│ ┌────────────────────────┐                           │
│ │ @Pierre peux-tu voir   │ ← @Pierre en surbrillance │
│ │ ça ?                   │                           │
│ │                  10:45 │                           │
│ └────────────────────────┘                           │
└──────────────────────────────────────────────────────┘
```

#### 3. Actions au Hover
```
┌──────────────────────────────────────────────────────┐
│ (avatar) Marie                                       │
│ ┌────────────────────────┐ ┌──────────────┐         │
│ │ Bonjour !              │ │ 😊 Répondre │         │
│ │                  10:30 │ └──────────────┘         │
│ └────────────────────────┘                           │
└──────────────────────────────────────────────────────┘
```
- Bouton réaction (😊)
- Bouton répondre

#### 4. État Vide
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              (icône cercle)                          │
│        Aucun message pour le moment                  │
│    Envoyez un message pour démarrer                  │
│         la conversation                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 5. Chargement de Plus
```
┌──────────────────────────────────────────────────────┐
│         [Charger plus de messages]                   │
│                                                      │
│ ou pendant le chargement:                            │
│                                                      │
│         [⟳ Chargement...]                           │
└──────────────────────────────────────────────────────┘
```

---

## ✍️ MessageInput

### Vue d'Ensemble
Zone de saisie et d'envoi de messages.

### Fonctionnalités Visuelles

#### 1. Preview de Réponse
```
┌──────────────────────────────────────────────────────┐
│ ┃ Réponse à Marie                              ✕    │
│ ┃ Bonjour ! Comment vas-tu ?                        │
└──────────────────────────────────────────────────────┘
```

#### 2. Preview de Fichiers

**Images**:
```
┌──────────────────────────────────────────────────────┐
│ ┌────────┐ ┌────────┐                                │
│ │[IMAGE] │ │[IMAGE] │                                │
│ │   ✕    │ │   ✕    │                                │
│ └────────┘ └────────┘                                │
└──────────────────────────────────────────────────────┘
```

**Documents**:
```
┌──────────────────────────────────────────────────────┐
│ 📄 rapport.pdf (1.2 MB) ✕                            │
│ 📄 facture.xlsx (500 KB) ✕                           │
└──────────────────────────────────────────────────────┘
```

#### 3. Emoji Picker
```
┌──────────────────────────────────────────────────────┐
│ ┌─────────────────────────────┐                      │
│ │ 😀 😃 😄 😁 😅 😂 🤣 😊       │                      │
│ │ 😇 🙂 😉 😌 😍 🥰 😘 😗       │                      │
│ │ ... (scrollable)             │                      │
│ └─────────────────────────────┘                      │
│                                                      │
│ 📎 😊 [Écrivez votre message...]           [Envoyer] │
└──────────────────────────────────────────────────────┘
```

#### 4. Input Principal
```
┌──────────────────────────────────────────────────────┐
│ 📎 😊 [Écrivez votre message...              ] 🚀    │
│                                                      │
│ Enter pour envoyer, Shift+Enter pour nouvelle ligne │
└──────────────────────────────────────────────────────┘
```
- 📎 Attach (fichiers)
- 😊 Emoji picker
- Textarea auto-resize
- 🚀 Send button

#### 5. États de Chargement
```
┌──────────────────────────────────────────────────────┐
│ 📎 😊 [Écrivez votre message...              ] ⟳     │
└──────────────────────────────────────────────────────┘
```
- Bouton envoyer devient spinner pendant l'envoi

---

## 🆕 NewConversationDialog

### Vue d'Ensemble
Modal de création de nouvelle conversation.

### Fonctionnalités Visuelles

#### 1. Header
```
┌──────────────────────────────────────────────────────┐
│ Nouvelle conversation                            ✕   │
└──────────────────────────────────────────────────────┘
```

#### 2. Sélection de Type
```
┌──────────────────────────────────────────────────────┐
│ [👤 Conversation directe] [👥 Groupe]                │
└──────────────────────────────────────────────────────┘
```

#### 3. Formulaire Groupe (si groupe sélectionné)
```
┌──────────────────────────────────────────────────────┐
│ Nom du groupe *                                      │
│ [Ex: Équipe technique                            ]   │
│                                                      │
│ Description (optionnelle)                            │
│ [Description du groupe...                        ]   │
└──────────────────────────────────────────────────────┘
```

#### 4. Utilisateurs Sélectionnés
```
┌──────────────────────────────────────────────────────┐
│ Membres sélectionnés (3)                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ Marie ✕    │ │ Jean ✕     │ │ Sophie ✕   │        │
│ └────────────┘ └────────────┘ └────────────┘        │
└──────────────────────────────────────────────────────┘
```

#### 5. Recherche
```
┌──────────────────────────────────────────────────────┐
│ Sélectionner les membres (minimum 2)                 │
│ 🔍 [Rechercher par nom, email...              ]      │
└──────────────────────────────────────────────────────┘
```

#### 6. Liste Utilisateurs
```
┌──────────────────────────────────────────────────────┐
│ ☐ (avatar) Marie Dupont                              │
│            marie.dupont@gestihotel.fr    [Admin]     │
├──────────────────────────────────────────────────────┤
│ ☑ (avatar) Jean Martin                          ✓    │
│            jean.martin@gestihotel.fr     [Tech]      │
├──────────────────────────────────────────────────────┤
│ ☑ (avatar) Sophie Bernard                       ✓    │
│            sophie.bernard@gestihotel.fr  [Manager]   │
└──────────────────────────────────────────────────────┘
```
- Checkbox pour sélection
- Avatar
- Nom + Role badge
- Email
- Checkmark (✓) si sélectionné

#### 7. Footer
```
┌──────────────────────────────────────────────────────┐
│                          [Annuler] [👥 Créer le groupe]│
└──────────────────────────────────────────────────────┘
```

#### 8. Validation
```
┌──────────────────────────────────────────────────────┐
│ ⚠️ Un groupe nécessite au moins 2 membres.          │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 Thème et Couleurs

### Palette de Couleurs

**Messages**:
- Envoyé: Bleu primary (bg-primary)
- Reçu: Gris clair (bg-muted)

**États**:
- En ligne: Vert (bg-green-500)
- Hors ligne: Gris (bg-gray-400)
- Typing: Bleu (text-primary)

**Indicateurs**:
- Non lu: Badge bleu (bg-primary)
- Lu: Double check bleu (text-blue-600)
- Épinglé: Fond bleu clair (bg-blue-50)

**Actions**:
- Hover: bg-accent/50
- Active: bg-accent
- Disabled: opacity-50

### Icônes Utilisées

**Navigation**:
- 🔍 Search
- ➕ Plus
- 📌 Pin
- 📦 Archive
- ℹ️ Info
- ⋮ MoreVertical

**Types**:
- 👤 User (direct)
- 👥 Users (groupe)
- 🔧 Wrench (intervention)

**Messages**:
- 📎 Paperclip (attach)
- 😊 Smile (emoji)
- 🚀 Send
- ✓ Check (envoyé)
- ✓✓ CheckCheck (lu)
- ⬇️ Download

**Fichiers**:
- 📄 File
- 🖼️ Image
- ⟳ Loader2 (loading)

---

## 📱 Responsive

### Desktop (>1024px)
```
┌────────────────────────────────────────────────┐
│ ConversationList │ ChatWindow                  │
│     (320px)      │       (flex-1)              │
│                  │                             │
└────────────────────────────────────────────────┘
```

### Tablet (768-1024px)
```
┌────────────────────────────────────────────────┐
│ ConversationList │ ChatWindow                  │
│     (280px)      │       (flex-1)              │
│                  │                             │
└────────────────────────────────────────────────┘
```

### Mobile (<768px)
Recommandation: Utiliser Sheet pour le ConversationList
```
┌────────────────────────────────────────────────┐
│ [☰] ChatWindow                                 │
│                                                │
│                                                │
└────────────────────────────────────────────────┘

Au clic sur ☰:
┌────────────────────────────────────────────────┐
│ ConversationList (Sheet/Drawer)                │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
```

---

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Enter` | Envoyer le message |
| `Shift+Enter` | Nouvelle ligne |
| `Ctrl+F` | Focus recherche (suggéré) |
| `Esc` | Annuler réponse (suggéré) |

---

## 🎭 Animations

**Transitions**:
- Hover: `transition-all` (200ms)
- Messages: Fade in
- Scroll: Smooth scroll

**Loading**:
- Spinner: `animate-spin`
- Skeleton: Pulse (suggéré)

**Interactions**:
- Button click: Scale effect (suggéré)
- Toast: Slide in from bottom

---

**Légende des Symboles**:
- ✅ Implémenté
- ⏳ À implémenter
- 📌 Important
- 💡 Suggestion
- ⚠️ Attention
