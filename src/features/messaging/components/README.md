# Composants de Messagerie - GestiHôtel v2

Composants React pour le système de messagerie interne de GestiHôtel v2.

## 📦 Composants disponibles

### 1. ConversationList

Liste des conversations avec filtres, recherche et gestion des états.

**Fichier**: `ConversationList.tsx`

**Props**:

```typescript
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  currentUserId: string;
  typingIndicators?: Record<string, { userId: string; userName: string }[]>;
}
```

**Fonctionnalités**:

- ✅ Liste scrollable des conversations
- ✅ Filtres par type (Tous / Direct / Groupes / Interventions)
- ✅ Barre de recherche en temps réel
- ✅ Badges de compteur non lu
- ✅ Indicateur de présence (en ligne/hors ligne)
- ✅ Indicateur "typing..."
- ✅ Conversations épinglées en haut
- ✅ Preview du dernier message
- ✅ Formatage des dates (aujourd'hui, hier, date)
- ✅ État vide avec CTA

**Exemple d'utilisation**:

```tsx
import { ConversationList } from '@/features/messaging/components';

<ConversationList
  conversations={conversations}
  selectedId={selectedConversationId}
  onSelect={setSelectedConversationId}
  onNewConversation={() => setShowNewDialog(true)}
  currentUserId={currentUser.id}
  typingIndicators={typingIndicators}
/>;
```

---

### 2. ChatWindow

Fenêtre de chat principale avec messages, header et input.

**Fichier**: `ChatWindow.tsx`

**Props**:

```typescript
interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (data: SendMessageData) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  typingUsers?: { userId: string; userName: string }[];
  onReaction?: (messageId: string, emoji: string) => void;
  onPinConversation?: () => void;
  onArchiveConversation?: () => void;
  onShowInfo?: () => void;
}
```

**Fonctionnalités**:

- ✅ Header avec avatar, nom, statut en ligne
- ✅ Menu actions (épingler, archiver, info)
- ✅ Messages groupés par date avec séparateurs
- ✅ Bulles de messages différenciées (envoyé/reçu)
- ✅ Support des pièces jointes (images inline, fichiers téléchargeables)
- ✅ Réactions emoji avec compteur
- ✅ Répondre à un message avec preview
- ✅ Indicateurs de lecture (check simple/double)
- ✅ Messages système
- ✅ Mentions en surbrillance (@user)
- ✅ Scroll automatique vers le bas
- ✅ Chargement de plus de messages (scroll vers le haut)
- ✅ Indicateur "typing..."
- ✅ État vide

**Exemple d'utilisation**:

```tsx
import { ChatWindow } from '@/features/messaging/components';

<ChatWindow
  conversation={selectedConversation}
  messages={messages}
  currentUserId={currentUser.id}
  onSendMessage={handleSendMessage}
  onLoadMore={loadMoreMessages}
  hasMore={hasMoreMessages}
  isLoading={isLoadingMessages}
  typingUsers={typingUsers}
  onReaction={handleReaction}
  onPinConversation={handlePin}
  onArchiveConversation={handleArchive}
  onShowInfo={() => setShowInfo(true)}
/>;
```

---

### 3. MessageInput

Composant d'envoi de messages avec support multimédia.

**Fichier**: `MessageInput.tsx`

**Props**:

```typescript
interface MessageInputProps {
  onSend: (data: SendMessageData) => Promise<void>;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  conversationId: string;
  currentUserId: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}
```

**Fonctionnalités**:

- ✅ Textarea auto-resize (max 200px)
- ✅ Upload de fichiers (drag & drop, click)
- ✅ Preview des fichiers avant envoi
- ✅ Validation taille fichier (max 10MB)
- ✅ Validation type de fichier
- ✅ Emoji picker (emojis populaires)
- ✅ Extraction automatique des mentions (@user)
- ✅ Répondre à un message avec preview
- ✅ Indicateur de frappe automatique
- ✅ Raccourcis clavier (Enter = envoyer, Shift+Enter = nouvelle ligne)
- ✅ États de chargement
- ✅ Gestion des erreurs avec toast

**Exemple d'utilisation**:

```tsx
import { MessageInput } from '@/features/messaging/components';

<MessageInput
  onSend={handleSendMessage}
  replyTo={replyToMessage}
  onCancelReply={() => setReplyToMessage(undefined)}
  conversationId={conversation.id}
  currentUserId={currentUser.id}
  onTypingStart={handleTypingStart}
  onTypingStop={handleTypingStop}
/>;
```

---

### 4. NewConversationDialog

Dialog de création de nouvelle conversation.

**Fichier**: `NewConversationDialog.tsx`

**Props**:

```typescript
interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (data: CreateConversationData) => Promise<void>;
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  }[];
}
```

**Fonctionnalités**:

- ✅ Sélection type (Direct / Groupe)
- ✅ Multi-select utilisateurs avec checkboxes
- ✅ Recherche utilisateurs (nom, email, rôle)
- ✅ Nom du groupe (requis pour groupe)
- ✅ Description optionnelle
- ✅ Validation (min 1 user pour direct, min 2 pour groupe)
- ✅ Badges des utilisateurs sélectionnés
- ✅ État vide
- ✅ Gestion des erreurs
- ✅ Reset automatique après création

**Exemple d'utilisation**:

```tsx
import { NewConversationDialog } from '@/features/messaging/components';

<NewConversationDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  onCreateConversation={handleCreateConversation}
  users={availableUsers}
/>;
```

---

## 🎨 Design System

### Couleurs

- **Primary**: Messages envoyés, boutons principaux
- **Muted**: Messages reçus, backgrounds secondaires
- **Green**: Statut en ligne
- **Blue**: Indicateurs de lecture, épinglé
- **Destructive**: Suppression, erreurs

### Icônes (lucide-react)

- `User`: Conversation directe
- `Users`: Groupe
- `Wrench`: Intervention
- `Send`: Envoyer message
- `Paperclip`: Pièce jointe
- `Smile`: Emoji
- `Pin`: Épingler
- `Archive`: Archiver
- `Check/CheckCheck`: Indicateurs de lecture

### Animations

- `transition-all`: Hover effects
- `hover:bg-accent`: Backgrounds cliquables
- `animate-spin`: Loading states

---

## 📝 Types

Tous les types sont définis dans `src/features/messaging/types/message.types.ts`:

- `Conversation`: Structure d'une conversation
- `Message`: Structure d'un message
- `SendMessageData`: Données pour envoyer un message
- `CreateConversationData`: Données pour créer une conversation
- `ConversationType`: 'direct' | 'group' | 'intervention'
- `MessageType`: 'text' | 'file' | 'image' | 'system'

---

## 🛠️ Dépendances

### UI Components (shadcn/ui)

- `avatar`
- `badge`
- `button`
- `input`
- `textarea`
- `dialog`
- `scroll-area`
- `tabs`
- `checkbox`
- `dropdown-menu`
- `label`
- `separator`

### Utilitaires

- `date-fns`: Formatage des dates
- `lucide-react`: Icônes
- `sonner`: Toast notifications
- `@/lib/utils`: Utilitaires (cn)

---

## 🚀 Installation

Toutes les dépendances sont déjà installées. Pour utiliser les composants :

```tsx
import {
  ConversationList,
  ChatWindow,
  MessageInput,
  NewConversationDialog,
} from '@/features/messaging/components';
```

---

## 📱 Responsive

Tous les composants sont **mobile-first** et s'adaptent automatiquement :

- **Desktop**: Sidebar + Chat côte à côte
- **Mobile**: Vue unique avec navigation

Utiliser `ConversationList` dans une `Sheet` sur mobile pour un drawer.

---

## ✅ Checklist d'intégration

- [ ] Importer les composants dans votre page
- [ ] Connecter aux services Firebase (messageService)
- [ ] Gérer les états (selected conversation, messages, etc.)
- [ ] Implémenter les websockets/listeners pour temps réel
- [ ] Gérer les typing indicators
- [ ] Implémenter l'upload de fichiers vers storage
- [ ] Gérer les notifications
- [ ] Ajouter la gestion des erreurs

---

## 🎯 Exemple complet

Voir `src/features/messaging/pages/MessagingPage.tsx` pour un exemple d'intégration complète.

---

## 📄 Licence

© 2025 GestiHôtel v2 - Tous droits réservés
