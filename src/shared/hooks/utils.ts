/**
 * ============================================================================
 * UTILITY HOOKS - COMPLET
 * ============================================================================
 *
 * Collection de hooks utilitaires réutilisables
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ============================================================================
// useDebounce - Débouncer une valeur
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// usePagination - Gérer la pagination
// ============================================================================

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination(
  totalItems: number,
  initialPageSize: number = 20
): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const previousPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset à la page 1
  }, []);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    totalPages,
    pageSize,
    setPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    startIndex,
    endIndex,
  };
}

// ============================================================================
// useLocalStorage - Persister une valeur dans localStorage
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================================================
// useModal - Gérer l'état d'une modal
// ============================================================================

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(initialState: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

// ============================================================================
// useOnClickOutside - Détecter les clics en dehors d'un élément
// ============================================================================

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================================================
// useMediaQuery - Détecter les media queries
// ============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// ============================================================================
// useClipboard - Copier dans le presse-papiers
// ============================================================================

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

export function useClipboard(timeout: number = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(reset, timeout);
      return () => clearTimeout(timer);
    }
  }, [copied, timeout, reset]);

  return { copied, copy, reset };
}

// ============================================================================
// useAsync - Gérer les opérations asynchrones
// ============================================================================

interface UseAsyncReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, error, isLoading, execute, reset };
}

// ============================================================================
// useQueryParams - Gérer les query parameters
// ============================================================================

export function useQueryParams(): {
  params: URLSearchParams;
  setParam: (key: string, value: string) => void;
  removeParam: (key: string) => void;
  getParam: (key: string) => string | null;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(key, value);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const removeParam = useCallback(
    (key: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(key);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const getParam = useCallback(
    (key: string) => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  return {
    params: searchParams,
    setParam,
    removeParam,
    getParam,
  };
}

// ============================================================================
// useKeyPress - Détecter les touches du clavier
// ============================================================================

export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

// ============================================================================
// useInterval - Exécuter une fonction à intervalles réguliers
// ============================================================================

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current?.();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ============================================================================
// useToggle - Toggle boolean
// ============================================================================

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}

// ============================================================================
// useArray - Gérer un array avec des helpers
// ============================================================================

interface UseArrayReturn<T> {
  value: T[];
  push: (element: T) => void;
  filter: (callback: (element: T) => boolean) => void;
  update: (index: number, newElement: T) => void;
  remove: (index: number) => void;
  clear: () => void;
  set: (newArray: T[]) => void;
}

export function useArray<T>(initialValue: T[] = []): UseArrayReturn<T> {
  const [value, setValue] = useState<T[]>(initialValue);

  const push = useCallback((element: T) => {
    setValue(prev => [...prev, element]);
  }, []);

  const filter = useCallback((callback: (element: T) => boolean) => {
    setValue(prev => prev.filter(callback));
  }, []);

  const update = useCallback((index: number, newElement: T) => {
    setValue(prev => [...prev.slice(0, index), newElement, ...prev.slice(index + 1)]);
  }, []);

  const remove = useCallback((index: number) => {
    setValue(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
  }, []);

  const clear = useCallback(() => {
    setValue([]);
  }, []);

  const set = useCallback((newArray: T[]) => {
    setValue(newArray);
  }, []);

  return { value, push, filter, update, remove, clear, set };
}

// ============================================================================
// useWindowSize - Obtenir la taille de la fenêtre
// ============================================================================

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// ============================================================================
// useConfirm - Dialog de confirmation
// ============================================================================

interface UseConfirmReturn {
  isOpen: boolean;
  confirm: (message: string) => Promise<boolean>;
  close: () => void;
  message: string;
}

export function useConfirm(): UseConfirmReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolveRef, setResolveRef] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((msg: string): Promise<boolean> => {
    setMessage(msg);
    setIsOpen(true);

    return new Promise(resolve => {
      setResolveRef({ resolve });
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    resolveRef?.resolve(false);
  }, [resolveRef]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef?.resolve(true);
  }, [resolveRef]);

  return { isOpen, confirm, close, message };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  useDebounce,
  usePagination,
  useLocalStorage,
  useModal,
  useOnClickOutside,
  useMediaQuery,
  useClipboard,
  useAsync,
  useQueryParams,
  useKeyPress,
  useInterval,
  useToggle,
  useArray,
  useWindowSize,
  useConfirm,
};
