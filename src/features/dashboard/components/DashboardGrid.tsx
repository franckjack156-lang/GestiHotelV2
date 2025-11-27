/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DashboardGrid Component
 *
 * Grille interactive avec drag & drop, redimensionnement et réorganisation des widgets
 */

import { useMemo, useCallback } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { WidgetRenderer } from './WidgetRenderer';
import type {
  WidgetConfig,
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

// Conversion de WidgetSize vers dimensions de grille
const WIDGET_SIZE_MAP = {
  small: { w: 3, h: 4 }, // 1/4 de la largeur
  medium: { w: 6, h: 4 }, // 1/2 de la largeur
  large: { w: 9, h: 6 }, // 3/4 de la largeur
  full: { w: 12, h: 8 }, // Pleine largeur
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
  // Convertir les widgets en layout pour react-grid-layout
  const layout: Layout[] = useMemo(() => {
    let currentRow = 0;
    let currentCol = 0;

    return widgets.map(widget => {
      const size = WIDGET_SIZE_MAP[widget.size] || WIDGET_SIZE_MAP.medium;

      // Si le widget a déjà une position définie, l'utiliser
      if (widget.position?.col !== undefined && widget.position?.row !== undefined) {
        return {
          i: widget.id,
          x: widget.position.col,
          y: widget.position.row,
          w: size.w,
          h: size.h,
          minW: 3,
          minH: 3,
          maxW: 12,
          maxH: 12,
        };
      }

      // Sinon, calculer une position compacte
      // Si le widget ne rentre pas sur la ligne actuelle, passer à la ligne suivante
      if (currentCol + size.w > 12) {
        currentRow += 4; // Hauteur approximative d'une ligne
        currentCol = 0;
      }

      const layoutItem = {
        i: widget.id,
        x: currentCol,
        y: currentRow,
        w: size.w,
        h: size.h,
        minW: 3,
        minH: 3,
        maxW: 12,
        maxH: 12,
      };

      // Avancer la position pour le prochain widget
      currentCol += size.w;

      return layoutItem;
    });
  }, [widgets]);

  // Gérer les changements de layout (drag & drop ou resize)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!onLayoutChange || !isEditMode) return;

      // Convertir le layout en widgets mis à jour
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
    [widgets, onLayoutChange, isEditMode]
  );

  return (
    <div className="dashboard-grid-container">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
        margin={[8, 8]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`
              dashboard-grid-item
              ${isEditMode ? 'edit-mode' : ''}
            `}
          >
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

        .dashboard-grid-item {
          overflow: hidden;
          border-radius: 8px;
        }

        .dashboard-grid-item.edit-mode {
          cursor: move;
          transition: box-shadow 0.2s;
        }

        .dashboard-grid-item.edit-mode:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Styles pour le mode édition */
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.2);
          border: 2px dashed #3b82f6;
          border-radius: 8px;
          z-index: 2;
          transition-duration: 100ms;
        }

        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.9;
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }

        /* Dark mode support */
        .dark .react-grid-item > .react-resizable-handle {
          background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiNmZmZmZmYiLz48L2c+PC9zdmc+');
        }

        /* Responsive */
        @media (max-width: 768px) {
          .layout {
            margin: 0 -8px;
          }
        }
      `}</style>
    </div>
  );
};
