/**
 * Composant de recherche de messages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2, MessageSquare, Clock, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import type { Message, Conversation } from '../types/message.types';

/**
 * Convertir un timestamp Firebase ou Date en Date
 */
const toDate = (timestamp: Timestamp | Date | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return null;
};

interface SearchResult {
  message: Message;
  conversation: Conversation;
  highlights: string[];
}

interface MessageSearchProps {
  conversations: Conversation[];
  messages: Map<string, Message[]>;
  onResultClick: (conversationId: string, messageId: string) => void;
  isLoading?: boolean;
}

/**
 * Surligner le texte correspondant à la recherche
 */
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export const MessageSearch = ({
  conversations,
  messages,
  onResultClick,
  isLoading = false,
}: MessageSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Recherche avec debounce
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      const searchLower = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Parcourir toutes les conversations et leurs messages
      conversations.forEach(conversation => {
        const conversationMessages = messages.get(conversation.id) || [];

        conversationMessages.forEach(message => {
          // Ignorer les messages supprimés
          if (message.isDeleted) return;

          // Rechercher dans le contenu du message
          if (message.content?.toLowerCase().includes(searchLower)) {
            // Extraire les parties pertinentes du texte
            const contentLower = message.content.toLowerCase();
            const index = contentLower.indexOf(searchLower);
            const start = Math.max(0, index - 30);
            const end = Math.min(message.content.length, index + searchQuery.length + 30);
            const highlight =
              (start > 0 ? '...' : '') +
              message.content.slice(start, end) +
              (end < message.content.length ? '...' : '');

            searchResults.push({
              message,
              conversation,
              highlights: [highlight],
            });
          }
        });
      });

      // Trier par date (plus récent d'abord)
      searchResults.sort((a, b) => {
        const dateA = toDate(a.message.createdAt) || new Date(0);
        const dateB = toDate(b.message.createdAt) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Limiter les résultats
      setResults(searchResults.slice(0, 50));
      setIsSearching(false);
    },
    [conversations, messages]
  );

  // Debounce de la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.conversation.id, result.message.id);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct' && conversation.participants.length === 2) {
      return conversation.participants.map(p => p.name).join(', ');
    }
    return `Conversation ${conversation.id.slice(0, 6)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search size={16} />
          <span className="hidden sm:inline">Rechercher</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rechercher dans les messages</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher des messages..."
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Résultats */}
        <ScrollArea className="flex-1 min-h-0 mt-4">
          {isSearching || isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Recherche en cours...</span>
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p>Tapez au moins 2 caractères pour rechercher</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p>Aucun message trouvé pour "{query}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-4">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé
                {results.length > 1 ? 's' : ''}
              </p>

              {results.map(result => (
                <div
                  key={`${result.conversation.id}-${result.message.id}`}
                  onClick={() => handleResultClick(result)}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {result.conversation.type === 'direct'
                          ? 'Direct'
                          : result.conversation.type === 'group'
                            ? 'Groupe'
                            : 'Intervention'}
                      </Badge>
                      <span className="font-medium text-sm truncate">
                        {getConversationName(result.conversation)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {toDate(result.message.createdAt) &&
                        formatDistanceToNow(toDate(result.message.createdAt)!, {
                          addSuffix: true,
                          locale: fr,
                        })}
                    </span>
                  </div>

                  {/* Expéditeur */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <User size={12} />
                    <span>{result.message.senderName}</span>
                    <span>•</span>
                    <Clock size={12} />
                    <span>
                      {toDate(result.message.createdAt) &&
                        format(toDate(result.message.createdAt)!, 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                    </span>
                  </div>

                  {/* Contenu avec surlignage */}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {result.highlights.map((highlight, i) => (
                      <span key={i}>{highlightText(highlight, query)}</span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
