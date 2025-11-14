# Guide de Tests - Composants de Messagerie

Ce document décrit comment tester les composants de messagerie de GestiHôtel v2.

---

## 🧪 Configuration de Test

### Installation des dépendances de test

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

---

## 📝 Exemples de Tests

### 1. ConversationList.test.tsx

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversationList } from './ConversationList';
import type { Conversation } from '../types/message.types';

describe('ConversationList', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      type: 'direct',
      participantIds: ['user-1', 'user-2'],
      participants: [
        {
          userId: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          joinedAt: new Date(),
        },
        {
          userId: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          joinedAt: new Date(),
          isOnline: true,
        },
      ],
      unreadCount: { 'user-1': 2, 'user-2': 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      establishmentId: 'hotel-1',
    },
  ];

  it('should render conversation list', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={vi.fn()}
        onNewConversation={vi.fn()}
      />
    );

    expect(screen.getByText('Messagerie')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show unread badge', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={vi.fn()}
        onNewConversation={vi.fn()}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should call onSelect when clicking conversation', () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={onSelect}
        onNewConversation={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Jane Smith'));
    expect(onSelect).toHaveBeenCalledWith('conv-1');
  });

  it('should filter conversations by search', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={vi.fn()}
        onNewConversation={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show online status', () => {
    const { container } = render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={vi.fn()}
        onNewConversation={vi.fn()}
      />
    );

    // Chercher l'indicateur de présence en ligne (green dot)
    const onlineIndicator = container.querySelector('.bg-green-500');
    expect(onlineIndicator).toBeInTheDocument();
  });

  it('should show typing indicator', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        currentUserId="user-1"
        onSelect={vi.fn()}
        onNewConversation={vi.fn()}
        typingIndicators={{
          'conv-1': [{ userId: 'user-2', userName: 'Jane Smith' }],
        }}
      />
    );

    expect(screen.getByText('Jane Smith écrit...')).toBeInTheDocument();
  });
});
```

---

### 2. ChatWindow.test.tsx

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWindow } from './ChatWindow';
import type { Conversation, Message } from '../types/message.types';

describe('ChatWindow', () => {
  const mockConversation: Conversation = {
    id: 'conv-1',
    type: 'direct',
    participantIds: ['user-1', 'user-2'],
    participants: [
      {
        userId: 'user-1',
        name: 'You',
        email: 'you@example.com',
        joinedAt: new Date(),
      },
      {
        userId: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        joinedAt: new Date(),
      },
    ],
    unreadCount: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    establishmentId: 'hotel-1',
  };

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      type: 'text',
      content: 'Hello!',
      senderId: 'user-1',
      senderName: 'You',
      readBy: ['user-1'],
      createdAt: new Date(),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      type: 'text',
      content: 'Hi there!',
      senderId: 'user-2',
      senderName: 'Jane Smith',
      readBy: ['user-1', 'user-2'],
      createdAt: new Date(),
    },
  ];

  it('should render chat window', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display messages', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );

    expect(screen.getByText('Aucun message pour le moment')).toBeInTheDocument();
  });

  it('should call onSendMessage when sending', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={onSendMessage}
        onLoadMore={vi.fn()}
        hasMore={false}
      />
    );

    const input = screen.getByPlaceholderText(/Écrivez votre message/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'New message',
        })
      );
    });
  });

  it('should show typing indicator', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
        onLoadMore={vi.fn()}
        hasMore={false}
        typingUsers={[{ userId: 'user-2', userName: 'Jane Smith' }]}
      />
    );

    expect(screen.getByText('Jane Smith écrit...')).toBeInTheDocument();
  });
});
```

---

### 3. MessageInput.test.tsx

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('should render message input', () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        conversationId="conv-1"
        currentUserId="user-1"
      />
    );

    expect(
      screen.getByPlaceholderText(/Écrivez votre message/)
    ).toBeInTheDocument();
  });

  it('should call onSend when clicking send button', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(
      <MessageInput
        onSend={onSend}
        conversationId="conv-1"
        currentUserId="user-1"
      />
    );

    const input = screen.getByPlaceholderText(/Écrivez votre message/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    await userEvent.type(input, 'Hello world');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello world',
        })
      );
    });
  });

  it('should send message on Enter key', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(
      <MessageInput
        onSend={onSend}
        conversationId="conv-1"
        currentUserId="user-1"
      />
    );

    const input = screen.getByPlaceholderText(/Écrivez votre message/);

    await userEvent.type(input, 'Hello{Enter}');

    await waitFor(() => {
      expect(onSend).toHaveBeenCalled();
    });
  });

  it('should show reply preview', () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        conversationId="conv-1"
        currentUserId="user-1"
        replyTo={{
          messageId: 'msg-1',
          content: 'Original message',
          senderName: 'Jane',
        }}
      />
    );

    expect(screen.getByText('Réponse à Jane')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('should extract mentions', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(
      <MessageInput
        onSend={onSend}
        conversationId="conv-1"
        currentUserId="user-1"
      />
    );

    const input = screen.getByPlaceholderText(/Écrivez votre message/);
    await userEvent.type(input, '@john hello{Enter}');

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          mentions: ['john'],
        })
      );
    });
  });

  it('should show emoji picker', async () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        conversationId="conv-1"
        currentUserId="user-1"
      />
    );

    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);

    // Vérifier que le picker est affiché
    await waitFor(() => {
      expect(screen.getByText('😀')).toBeInTheDocument();
    });
  });
});
```

---

### 4. NewConversationDialog.test.tsx

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewConversationDialog } from './NewConversationDialog';

describe('NewConversationDialog', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/john.jpg',
      role: 'Admin',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://example.com/jane.jpg',
      role: 'User',
    },
  ];

  it('should render dialog when open', () => {
    render(
      <NewConversationDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreateConversation={vi.fn()}
        users={mockUsers}
      />
    );

    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <NewConversationDialog
        open={false}
        onOpenChange={vi.fn()}
        onCreateConversation={vi.fn()}
        users={mockUsers}
      />
    );

    expect(screen.queryByText('Nouvelle conversation')).not.toBeInTheDocument();
  });

  it('should show users list', () => {
    render(
      <NewConversationDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreateConversation={vi.fn()}
        users={mockUsers}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should filter users by search', async () => {
    render(
      <NewConversationDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreateConversation={vi.fn()}
        users={mockUsers}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Rechercher par nom/);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should create direct conversation', async () => {
    const onCreateConversation = vi.fn().mockResolvedValue(undefined);
    render(
      <NewConversationDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreateConversation={onCreateConversation}
        users={mockUsers}
      />
    );

    // Sélectionner un utilisateur
    fireEvent.click(screen.getByText('John Doe'));

    // Créer
    const createButton = screen.getByRole('button', { name: /Créer la conversation/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onCreateConversation).toHaveBeenCalledWith({
        type: 'direct',
        participantIds: ['user-1'],
      });
    });
  });

  it('should require group name for group conversation', async () => {
    render(
      <NewConversationDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreateConversation={vi.fn()}
        users={mockUsers}
      />
    );

    // Switch to group
    const groupTab = screen.getByRole('tab', { name: /Groupe/i });
    fireEvent.click(groupTab);

    // Sélectionner 2 utilisateurs
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Jane Smith'));

    // Le bouton devrait être désactivé sans nom
    const createButton = screen.getByRole('button', { name: /Créer le groupe/i });
    expect(createButton).toBeDisabled();

    // Ajouter un nom
    const nameInput = screen.getByLabelText(/Nom du groupe/i);
    fireEvent.change(nameInput, { target: { value: 'Team Chat' } });

    // Maintenant le bouton devrait être activé
    expect(createButton).not.toBeDisabled();
  });
});
```

---

## 🎯 Tests d'Intégration

### Example d'intégration complète

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessagingExample } from './MessagingExample';

describe('Messaging Integration', () => {
  it('should create conversation and send message', async () => {
    render(<MessagingExample />);

    // Ouvrir le dialog de nouvelle conversation
    const newButton = screen.getByRole('button', { name: /Nouveau/i });
    fireEvent.click(newButton);

    // Sélectionner un utilisateur
    fireEvent.click(screen.getByText('Marie Dupont'));

    // Créer la conversation
    const createButton = screen.getByRole('button', { name: /Créer la conversation/i });
    fireEvent.click(createButton);

    // Attendre que la conversation soit créée
    await waitFor(() => {
      expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    });

    // Envoyer un message
    const input = screen.getByPlaceholderText(/Écrivez votre message/);
    fireEvent.change(input, { target: { value: 'Hello!' } });

    const sendButton = screen.getByRole('button', { name: /envoyer/i });
    fireEvent.click(sendButton);

    // Vérifier que le message apparaît
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });
});
```

---

## 🔍 Coverage

Pour exécuter les tests avec coverage :

```bash
npm run test:coverage
```

Objectifs de coverage :
- **Statements** : > 80%
- **Branches** : > 75%
- **Functions** : > 80%
- **Lines** : > 80%

---

## 📋 Checklist de Tests

### ConversationList
- [ ] Affichage de la liste
- [ ] Filtres par type
- [ ] Recherche
- [ ] Sélection de conversation
- [ ] Badges non lus
- [ ] Indicateur en ligne
- [ ] Indicateur typing
- [ ] État vide

### ChatWindow
- [ ] Affichage des messages
- [ ] Envoi de message
- [ ] Réponse à un message
- [ ] Réactions
- [ ] Upload de fichiers
- [ ] Scroll automatique
- [ ] Load more
- [ ] État vide

### MessageInput
- [ ] Saisie de texte
- [ ] Envoi au click
- [ ] Envoi au Enter
- [ ] Shift+Enter nouvelle ligne
- [ ] Upload de fichiers
- [ ] Emoji picker
- [ ] Extraction mentions
- [ ] Preview réponse
- [ ] Typing indicators

### NewConversationDialog
- [ ] Affichage du dialog
- [ ] Recherche utilisateurs
- [ ] Sélection utilisateurs
- [ ] Création conversation directe
- [ ] Création groupe (avec nom)
- [ ] Validation
- [ ] Reset après création

---

## 🚀 CI/CD

Exemple de configuration GitHub Actions :

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 📚 Ressources

- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
