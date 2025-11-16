/**
 * ============================================================================
 * EMOJI PICKER COMPONENT
 * ============================================================================
 *
 * Sélecteur d'émojis custom avec design moderne
 */

import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Search } from 'lucide-react';

// ============================================================================
// PROPS
// ============================================================================

export interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  width?: number;
  height?: number;
}

// ============================================================================
// EMOJI DATA
// ============================================================================

const EMOJI_CATEGORIES = {
  smileys: {
    label: '😊 Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '☹️',
    ],
  },
  gestures: {
    label: '👍 Gestes',
    emojis: [
      '👍',
      '👎',
      '👊',
      '✊',
      '🤛',
      '🤜',
      '🤞',
      '✌️',
      '🤟',
      '🤘',
      '👌',
      '🤏',
      '👈',
      '👉',
      '👆',
      '👇',
      '☝️',
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💪',
      '🦾',
      '🦿',
      '🦵',
      '🦶',
      '👂',
      '🦻',
      '👃',
      '🧠',
      '🦷',
      '🦴',
    ],
  },
  hearts: {
    label: '❤️ Cœurs',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉️',
      '☸️',
    ],
  },
  animals: {
    label: '🐶 Animaux',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐽',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🐣',
      '🐥',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
    ],
  },
  food: {
    label: '🍕 Nourriture',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🌽',
      '🥕',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🥗',
      '🥘',
    ],
  },
  activities: {
    label: '⚽ Activités',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️',
      '🤸',
      '🤺',
      '🤾',
      '🏌️',
      '🧘',
    ],
  },
  symbols: {
    label: '🎉 Symboles',
    emojis: [
      '🎉',
      '🎊',
      '🎈',
      '🎁',
      '🏆',
      '🏅',
      '🥇',
      '🥈',
      '🥉',
      '⭐',
      '🌟',
      '✨',
      '💫',
      '💥',
      '💢',
      '💯',
      '🔥',
      '⚡',
      '☄️',
      '💧',
      '💦',
      '🌈',
      '☀️',
      '🌙',
      '⭐',
      '🌠',
      '🌌',
      '☁️',
      '⛅',
      '🌤️',
      '🌥️',
      '🌦️',
      '✅',
      '❌',
      '❗',
      '❓',
      '⁉️',
      '‼️',
      '💬',
      '💭',
    ],
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiClick,
  width = 350,
  height = 400,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');

  // Filtrer les émojis par recherche
  const getFilteredEmojis = () => {
    if (!search) {
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].emojis;
    }

    // Recherche dans toutes les catégories
    const allEmojis: string[] = [];
    Object.values(EMOJI_CATEGORIES).forEach(category => {
      allEmojis.push(...category.emojis);
    });

    return allEmojis;
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      className="bg-background border rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Search */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un émoji..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Categories */}
      {!search && (
        <div className="border-b flex-shrink-0">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start rounded-none h-12 bg-muted/50">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="px-3 data-[state=active]:bg-background"
                >
                  {category.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Emoji Grid */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => onEmojiClick(emoji)}
                className="hover:bg-accent rounded p-2 transition-colors aspect-square flex items-center justify-center text-2xl"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Aucun émoji trouvé</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
