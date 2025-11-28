/**
 * ============================================================================
 * SEARCH BUTTON
 * ============================================================================
 *
 * Bouton pour ouvrir la recherche globale
 */

import { Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useSearch } from './SearchContext';

export const SearchButton = () => {
  const { openSearch } = useSearch();

  const handleClick = () => {
    openSearch();
  };

  return (
    <Button
      variant="outline"
      className="relative justify-start text-sm text-muted-foreground h-9 sm:h-10 px-3 sm:pr-12 w-9 sm:w-auto md:w-40 lg:w-56"
      onClick={handleClick}
    >
      <Search className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline-flex truncate">Rechercher...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
};
