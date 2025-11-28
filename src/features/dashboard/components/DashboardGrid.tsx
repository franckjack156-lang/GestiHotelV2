/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DashboardGrid Component
 *
 * Grille interactive avec drag & drop, redimensionnement et réorganisation des widgets
 * Responsive: adapte automatiquement le layout selon la taille de l'écran
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { WidgetRenderer } from './WidgetRenderer';
import type {
  WidgetConfig,
  WidgetHeight,
  InterventionStats,
  TimelineData,
  RoomStats,
  TechnicianPerformance,
} from '../types/dashboard.types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  widgets: WidgetConfig[];
  interventionStats?: InterventionStats | null;
  timelineData?: TimelineData[];
  roomStats?: RoomStats | null;
  technicianPerformance?: TechnicianPerformance[];
  calculatedStats?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    urgent: number;
    completionRate: number;
    avgDuration: string;
  };
  chartData?: {
    evolutionData: any[];
    statusData: any[];
    priorityData: any[];
  };
  onNavigate?: (path: string) => void;
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
  isEditMode?: boolean;
}

// Breakpoints pour le responsive
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

// Multiplicateur de hauteur selon la propriété height
const getHeightMultiplier = (height?: WidgetHeight): number => {
  switch (height) {
    case 'tall':
      return 2;
    case 'extra-tall':
      return 3;
    default:
      return 1;
  }
};

// Conversion de WidgetSize vers dimensions de grille selon le breakpoint
const getWidgetSizeMap = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
  switch (breakpoint) {
    case 'mobile':
      // Sur mobile, tous les widgets en pleine largeur
      return {
        small: { w: 12, h: 4 },
        medium: { w: 12, h: 5 },
        large: { w: 12, h: 7 },
        full: { w: 12, h: 8 },
      };
    case 'tablet':
      // Sur tablette, widgets medium/large adaptés
      return {
        small: { w: 6, h: 4 },
        medium: { w: 6, h: 5 },
        large: { w: 12, h: 6 },
        full: { w: 12, h: 8 },
      };
    default:
      // Desktop - layout original
      return {
        small: { w: 3, h: 4 },
        medium: { w: 6, h: 5 },
        large: { w: 9, h: 6 },
        full: { w: 12, h: 8 },
      };
  }
};

export const DashboardGrid = ({
  widgets,
  interventionStats,
  timelineData,
  roomStats,
  technicianPerformance,
  calculatedStats,
  chartData,
  onNavigate,
  onLayoutChange,
  isEditMode = false,
}: DashboardGridProps) => {
  // Responsive width
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);

        // Déterminer le breakpoint
        if (width < BREAKPOINTS.mobile) {
          setBreakpoint('mobile');
        } else if (width < BREAKPOINTS.tablet) {
          setBreakpoint('tablet');
        } else {
          setBreakpoint('desktop');
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Obtenir la map de tailles selon le breakpoint
  const widgetSizeMap = useMemo(() => getWidgetSizeMap(breakpoint), [breakpoint]);

  // Filtrer les widgets sur mobile selon showOnMobile (défaut: true pour small, false pour autres)
  const filteredWidgets = useMemo(() => {
    if (breakpoint !== 'mobile') return widgets;

    return widgets.filter(widget => {
      // Si showOnMobile est explicitement défini, l'utiliser
      if (widget.showOnMobile !== undefined) {
        return widget.showOnMobile;
      }
      // Sinon, par défaut: afficher seulement les petits widgets sur mobile
      return widget.size === 'small';
    });
  }, [widgets, breakpoint]);

  // Convertir les widgets en layout pour react-grid-layout
  const layout: Layout[] = useMemo(() => {
    let currentRow = 0;
    let currentCol = 0;

    return filteredWidgets.map(widget => {
      const size = widgetSizeMap[widget.size] || widgetSizeMap.medium;
      const heightMultiplier = getHeightMultiplier(widget.height);
      const finalHeight = size.h * heightMultiplier;

      // Sur mobile, forcer la position en colonne unique
      if (breakpoint === 'mobile') {
        const layoutItem = {
          i: widget.id,
          x: 0,
          y: currentRow,
          w: 12,
          h: finalHeight,
          minW: 12,
          minH: 3,
          maxW: 12,
          maxH: 24,
          static: !isEditMode, // Empêcher le déplacement sur mobile
        };
        currentRow += finalHeight;
        return layoutItem;
      }

      // Si le widget a déjà une position définie, l'utiliser (desktop/tablet)
      if (widget.position?.col !== undefined && widget.position?.row !== undefined) {
        // Adapter la position au breakpoint tablette
        let x = widget.position.col;
        if (breakpoint === 'tablet' && x + size.w > 12) {
          x = 0;
        }

        return {
          i: widget.id,
          x,
          y: widget.position.row,
          w: size.w,
          h: finalHeight,
          minW: breakpoint === 'tablet' ? 6 : 3,
          minH: 3,
          maxW: 12,
          maxH: 24,
        };
      }

      // Sinon, calculer une position compacte
      if (currentCol + size.w > 12) {
        currentRow += 5;
        currentCol = 0;
      }

      const layoutItem = {
        i: widget.id,
        x: currentCol,
        y: currentRow,
        w: size.w,
        h: finalHeight,
        minW: breakpoint === 'tablet' ? 6 : 3,
        minH: 3,
        maxW: 12,
        maxH: 24,
      };

      currentCol += size.w;
      return layoutItem;
    });
  }, [filteredWidgets, widgetSizeMap, breakpoint, isEditMode]);

  // Gérer les changements de layout (drag & drop ou resize)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!onLayoutChange || !isEditMode || breakpoint === 'mobile') return;

      const updatedWidgets = widgets.map(widget => {
        const layoutItem = newLayout.find(l => l.i === widget.id);
        if (!layoutItem) return widget;

        // Déterminer la nouvelle taille basée sur les dimensions
        let newSize: 'small' | 'medium' | 'large' | 'full' = 'medium';
        if (layoutItem.w <= 3) newSize = 'small';
        else if (layoutItem.w <= 6) newSize = 'medium';
        else if (layoutItem.w <= 9) newSize = 'large';
        else newSize = 'full';

        return {
          ...widget,
          size: newSize,
          position: {
            row: layoutItem.y,
            col: layoutItem.x,
          },
        };
      });

      onLayoutChange(updatedWidgets);
    },
    [widgets, onLayoutChange, isEditMode, breakpoint]
  );

  // Calculer les marges selon le breakpoint
  const margin: [number, number] = breakpoint === 'mobile' ? [8, 8] : [12, 12];
  const rowHeight = breakpoint === 'mobile' ? 35 : 30;

  return (
    <div className="dashboard-grid-container" ref={containerRef}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={rowHeight}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode && breakpoint !== 'mobile'}
        isResizable={isEditMode && breakpoint !== 'mobile'}
        compactType="vertical"
        preventCollision={false}
        margin={margin}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {filteredWidgets.map(widget => (
          <div key={widget.id} className={`dashboard-grid-item ${isEditMode ? 'edit-mode' : ''}`}>
            <WidgetRenderer
              widget={widget}
              interventionStats={interventionStats}
              timelineData={timelineData}
              roomStats={roomStats}
              technicianPerformance={technicianPerformance}
              calculatedStats={calculatedStats}
              chartData={chartData}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </GridLayout>

      <style>{`
        .dashboard-grid-container {
          position: relative;
          width: 100%;
        }

        .layout {
          position: relative;
          width: 100%;
        }

        /* Widget container - CRITICAL: overflow hidden pour éviter les débordements */
        .dashboard-grid-item {
          overflow: hidden;
          border-radius: 8px;
          background: transparent;
        }

        /* S'assurer que les enfants remplissent le container */
        .dashboard-grid-item > div {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        /* Cards inside widgets */
        .dashboard-grid-item > div > .card,
        .dashboard-grid-item > div > div:first-child {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Card content doit scroller si nécessaire */
        .dashboard-grid-item .card-content {
          flex: 1;
          min-height: 0; /* CRUCIAL pour flex + overflow */
          overflow: auto;
        }

        /* Card header ne doit pas shrink */
        .dashboard-grid-item .card-header {
          flex-shrink: 0;
        }

        /* Mode édition */
        .dashboard-grid-item.edit-mode {
          cursor: move;
          transition: box-shadow 0.2s, transform 0.1s;
          border: 2px solid transparent;
        }

        .dashboard-grid-item.edit-mode:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }

        /* Placeholder pendant le drag */
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.2);
          border: 2px dashed #3b82f6;
          border-radius: 8px;
          z-index: 2;
          transition-duration: 100ms;
        }

        /* Widget en cours de drag */
        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.9;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        /* Handle de resize - amélioré */
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 24px;
          height: 24px;
          bottom: 4px;
          right: 4px;
          background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+');
          background-position: bottom right;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }

        /* Afficher le handle au hover */
        .dashboard-grid-item.edit-mode:hover > .react-resizable-handle,
        .react-grid-item:hover > .react-resizable-handle {
          opacity: 0.7;
        }

        .react-grid-item > .react-resizable-handle:hover {
          opacity: 1;
        }

        /* Dark mode */
        .dark .react-grid-item > .react-resizable-handle {
          background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiNmZmZmZmYiLz48L2c+PC9zdmc+');
          background-position: bottom right;
          background-repeat: no-repeat;
        }

        .dark .dashboard-grid-item.edit-mode:hover {
          border-color: rgba(59, 130, 246, 0.5);
        }

        /* Responsive - tablette */
        @media (max-width: 768px) {
          .react-grid-item > .react-resizable-handle {
            width: 28px;
            height: 28px;
          }
        }

        /* Responsive - mobile: cacher le handle de resize */
        @media (max-width: 480px) {
          .react-grid-item > .react-resizable-handle {
            display: none;
          }

          .dashboard-grid-item.edit-mode {
            cursor: default;
          }
        }
      `}</style>
    </div>
  );
};
