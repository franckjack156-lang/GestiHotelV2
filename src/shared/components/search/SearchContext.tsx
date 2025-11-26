/**
 * ============================================================================
 * SEARCH CONTEXT
 * ============================================================================
 *
 * Contexte pour partager l'état du dialogue de recherche globale
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => {
    setIsOpen(true);
  };
  const closeSearch = () => {
    setIsOpen(false);
  };
  const toggleSearch = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
