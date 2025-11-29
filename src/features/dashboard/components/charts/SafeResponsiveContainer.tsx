/**
 * SafeResponsiveContainer Component
 *
 * Wrapper qui gère les dimensions de manière sécurisée pour éviter les erreurs
 * de dimensions négatives de Recharts. Passe directement les dimensions
 * calculées aux enfants plutôt que d'utiliser ResponsiveContainer.
 */

import { useState, useEffect, useRef, cloneElement, isValidElement, type ReactNode } from 'react';

interface SafeResponsiveContainerProps {
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  minHeight?: number;
  minWidth?: number;
  className?: string;
}

export const SafeResponsiveContainer = ({
  children,
  width = '100%',
  height = '100%',
  minHeight = 200,
  minWidth = 200,
  className,
}: SafeResponsiveContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let rafId: number;
    let mounted = true;

    const updateDimensions = () => {
      if (!mounted || !containerRef.current) return;

      const { offsetWidth, offsetHeight } = containerRef.current;

      // Ne mettre à jour que si les dimensions sont valides
      if (offsetWidth > 0 && offsetHeight > 0) {
        setDimensions(prev => {
          // Éviter les re-renders inutiles
          if (prev && prev.width === offsetWidth && prev.height === offsetHeight) {
            return prev;
          }
          return { width: offsetWidth, height: offsetHeight };
        });
      } else {
        // Si pas encore prêt, réessayer au prochain frame
        rafId = requestAnimationFrame(updateDimensions);
      }
    };

    // Premier check après un court délai pour laisser le layout se stabiliser
    rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateDimensions);
    });

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(entries => {
      if (!mounted) return;

      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          setDimensions(prev => {
            if (prev && prev.width === w && prev.height === h) {
              return prev;
            }
            return { width: w, height: h };
          });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  // Calcul des dimensions effectives avec les minimums
  const effectiveWidth = dimensions ? Math.max(dimensions.width, minWidth) : minWidth;
  const effectiveHeight = dimensions ? Math.max(dimensions.height, minHeight) : minHeight;
  const isReady = dimensions !== null && effectiveWidth > 0 && effectiveHeight > 0;

  // Clone l'enfant avec les dimensions injectées
  const renderChildWithDimensions = () => {
    if (!isReady || !isValidElement(children)) {
      return null;
    }

    // Injecter width et height dans le composant enfant (le chart Recharts)
    return cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, {
      width: effectiveWidth,
      height: effectiveHeight,
    });
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width,
        height: height,
        minHeight: minHeight,
        minWidth: minWidth,
        position: 'relative',
      }}
    >
      {isReady ? (
        renderChildWithDimensions()
      ) : (
        <div className="flex items-center justify-center h-full w-full" style={{ minHeight }}>
          <div className="animate-pulse text-gray-400 text-sm">Chargement...</div>
        </div>
      )}
    </div>
  );
};
