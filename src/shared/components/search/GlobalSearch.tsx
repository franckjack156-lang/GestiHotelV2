/**
 * ============================================================================
 * GLOBAL SEARCH - Cmd+K
 * ============================================================================
 *
 * Composant de recherche globale accessible via Cmd+K (ou Ctrl+K)
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  User,
  Building2,
  Settings,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Boxes,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useSearch } from './SearchContext';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'intervention' | 'user' | 'room' | 'page' | 'setting';
  url: string;
  icon: React.ReactNode;
}

/**
 * Pages de l'application
 */
const PAGES: SearchResult[] = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    type: 'page',
    url: '/app',
    icon: <Home className="w-4 h-4" />,
  },
  {
    id: 'interventions',
    title: 'Interventions',
    type: 'page',
    url: '/app/interventions',
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    id: 'rooms',
    title: 'Chambres',
    type: 'page',
    url: '/app/rooms',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: 'users',
    title: 'Utilisateurs',
    type: 'page',
    url: '/app/users',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'planning',
    title: 'Planning',
    type: 'page',
    url: '/app/planning',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'messaging',
    title: 'Messagerie',
    type: 'page',
    url: '/app/messaging',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: 'suppliers',
    title: 'Fournisseurs',
    type: 'page',
    url: '/app/suppliers',
    icon: <Boxes className="w-4 h-4" />,
  },
  {
    id: 'settings',
    title: 'Paramètres',
    type: 'page',
    url: '/app/settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const { isOpen, closeSearch, toggleSearch } = useSearch();
  const [query, setQuery] = useState('');
  const { establishmentId } = useCurrentEstablishment();

  // Charger les données
  const { interventions } = useInterventions();
  const { users } = useUsers();
  const { rooms } = useRooms(establishmentId || '');

  /**
   * Gérer Cmd+K / Ctrl+K
   */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSearch();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggleSearch]);

  /**
   * Convertir les interventions en résultats de recherche
   */
  const interventionResults: SearchResult[] = useMemo(() => {
    if (!interventions) return [];

    return interventions.slice(0, 5).map((intervention) => ({
      id: intervention.id,
      title: intervention.title,
      subtitle: `#${intervention.reference || intervention.id.slice(0, 8)} • ${intervention.status}`,
      type: 'intervention' as const,
      url: `/app/interventions/${intervention.id}`,
      icon: <Wrench className="w-4 h-4" />,
    }));
  }, [interventions]);

  /**
   * Convertir les utilisateurs en résultats de recherche
   */
  const userResults: SearchResult[] = useMemo(() => {
    if (!users) return [];

    return users.slice(0, 5).map((user) => ({
      id: user.id,
      title: user.displayName || user.email,
      subtitle: user.role,
      type: 'user' as const,
      url: `/app/users/${user.id}`,
      icon: <User className="w-4 h-4" />,
    }));
  }, [users]);

  /**
   * Convertir les chambres en résultats de recherche
   */
  const roomResults: SearchResult[] = useMemo(() => {
    if (!rooms) return [];

    return rooms.slice(0, 5).map((room) => ({
      id: room.id,
      title: `Chambre ${room.number}`,
      subtitle: `${room.type} • Étage ${room.floor}`,
      type: 'room' as const,
      url: `/app/rooms/${room.id}`,
      icon: <Building2 className="w-4 h-4" />,
    }));
  }, [rooms]);

  /**
   * Filtrer les résultats selon la requête
   */
  const filteredResults = useMemo(() => {
    if (!query) {
      return {
        pages: PAGES,
        interventions: [],
        users: [],
        rooms: [],
      };
    }

    const lowerQuery = query.toLowerCase();

    return {
      pages: PAGES.filter((page) => page.title.toLowerCase().includes(lowerQuery)),
      interventions: interventionResults.filter(
        (result) =>
          result.title.toLowerCase().includes(lowerQuery) ||
          result.subtitle?.toLowerCase().includes(lowerQuery)
      ),
      users: userResults.filter(
        (result) =>
          result.title.toLowerCase().includes(lowerQuery) ||
          result.subtitle?.toLowerCase().includes(lowerQuery)
      ),
      rooms: roomResults.filter(
        (result) =>
          result.title.toLowerCase().includes(lowerQuery) ||
          result.subtitle?.toLowerCase().includes(lowerQuery)
      ),
    };
  }, [query, interventionResults, userResults, roomResults]);

  /**
   * Naviguer vers un résultat
   */
  const handleSelect = (url: string) => {
    closeSearch();
    setQuery('');
    navigate(url);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={closeSearch}>
      <CommandInput
        placeholder="Rechercher des interventions, utilisateurs, chambres..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        {/* Pages */}
        {filteredResults.pages.length > 0 && (
          <>
            <CommandGroup heading="Pages">
              {filteredResults.pages.map((page) => (
                <CommandItem key={page.id} onSelect={() => handleSelect(page.url)}>
                  {page.icon}
                  <span className="ml-2">{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Interventions */}
        {filteredResults.interventions.length > 0 && (
          <>
            <CommandGroup heading="Interventions">
              {filteredResults.interventions.map((result) => (
                <CommandItem key={result.id} onSelect={() => handleSelect(result.url)}>
                  {result.icon}
                  <div className="ml-2 flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-gray-500">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Utilisateurs */}
        {filteredResults.users.length > 0 && (
          <>
            <CommandGroup heading="Utilisateurs">
              {filteredResults.users.map((result) => (
                <CommandItem key={result.id} onSelect={() => handleSelect(result.url)}>
                  {result.icon}
                  <div className="ml-2 flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-gray-500">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Chambres */}
        {filteredResults.rooms.length > 0 && (
          <CommandGroup heading="Chambres">
            {filteredResults.rooms.map((result) => (
              <CommandItem key={result.id} onSelect={() => handleSelect(result.url)}>
                {result.icon}
                <div className="ml-2 flex flex-col">
                  <span>{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-gray-500">{result.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
