/**
 * SimpleDashboardGrid Component
 *
 * Grille simple basée sur CSS Grid natif avec drag & drop et resize
 * Remplace react-grid-layout pour une meilleure fiabilité
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { WidgetRenderer } from './WidgetRenderer';
import type {
  WidgetConfig,
  WidgetHeight,
  InterventionStats,
  TimelineData,
  RoomStats,
  TechnicianPerformance,
  WidgetSize,
} from '../types/dashboard.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';

interface SimpleDashboardGridProps {
  widgets: WidgetConfig[];
  interventionStats?: InterventionStats | null;
  timelineData?: TimelineData[];
  roomStats?: RoomStats | null;
  technicianPerformance?: TechnicianPerformance[];
  recentInterventions?: Intervention[];
  overdueInterventions?: Intervention[];
  pendingValidationInterventions?: Intervention[];
  resolutionRate?: { created: number; completed: number; rate: number } | null;
  locationStats?: { byFloor: Record<string, number>; byBuilding: Record<string, number> } | null;
  problematicRooms?: { roomNumber: string; count: number; lastIntervention: Date | null }[];
  todayScheduled?: Intervention[];
  calculatedStats?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    urgent: number;
    completionRate: number;
    avgDuration: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData?: {
    evolutionData: any[];
    statusData: any[];
    priorityData: any[];
  };
  onNavigate?: (path: string) => void;
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
  isEditMode?: boolean;
}

// Convertir la taille de widget en classes CSS Grid
const getSizeClasses = (size: WidgetSize): string => {
  switch (size) {
    case 'small':
      return 'col-span-12 sm:col-span-6 lg:col-span-3';
    case 'medium':
      return 'col-span-12 sm:col-span-6 lg:col-span-6';
    case 'large':
      return 'col-span-12 lg:col-span-9';
    case 'full':
      return 'col-span-12';
    default:
      return 'col-span-12 sm:col-span-6';
  }
};

// Convertir la hauteur en classe CSS row-span
const getHeightClasses = (height?: WidgetHeight): string => {
  switch (height) {
    case 'tall':
      return 'row-span-2';
    case 'extra-tall':
      return 'row-span-3';
    default:
      return 'row-span-1';
  }
};

// Ordre des tailles pour le cycle
const SIZE_ORDER: WidgetSize[] = ['small', 'medium', 'large', 'full'];

export const SimpleDashboardGrid = ({
  widgets,
  interventionStats,
  timelineData,
  roomStats,
  technicianPerformance,
  recentInterventions,
  overdueInterventions,
  pendingValidationInterventions,
  resolutionRate,
  locationStats,
  problematicRooms,
  todayScheduled,
  calculatedStats,
  chartData,
  onNavigate,
  onLayoutChange,
  isEditMode = false,
}: SimpleDashboardGridProps) => {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchroniser avec les props
  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  // Filtrer les widgets visibles
  const visibleWidgets = localWidgets.filter(w => w.visible);

  // === DRAG & DROP ===
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
      if (!isEditMode) return;
      setDraggedWidgetId(widgetId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', widgetId);
      // Ajouter une classe pour le style
      (e.target as HTMLElement).classList.add('dragging');
    },
    [isEditMode]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
      if (!isEditMode || !draggedWidgetId || draggedWidgetId === widgetId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverWidgetId(widgetId);
    },
    [isEditMode, draggedWidgetId]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverWidgetId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetWidgetId: string) => {
      e.preventDefault();
      if (!isEditMode || !draggedWidgetId || draggedWidgetId === targetWidgetId) return;

      const newWidgets = [...localWidgets];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
      const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Réorganiser
      const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedWidget);

      // Mettre à jour les positions
      const updatedWidgets = newWidgets.map((widget, index) => ({
        ...widget,
        position: { row: Math.floor(index / 4), col: index % 4 },
      }));

      setLocalWidgets(updatedWidgets);
      onLayoutChange?.(updatedWidgets);

      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
    },
    [isEditMode, draggedWidgetId, localWidgets, onLayoutChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  }, []);

  // === RESIZE ===
  const handleResize = useCallback(
    (widgetId: string, direction: 'increase' | 'decrease') => {
      if (!isEditMode) return;

      const widgetIndex = localWidgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return;

      const widget = localWidgets[widgetIndex];
      const currentSizeIndex = SIZE_ORDER.indexOf(widget.size);

      let newSizeIndex: number;
      if (direction === 'increase') {
        newSizeIndex = Math.min(currentSizeIndex + 1, SIZE_ORDER.length - 1);
      } else {
        newSizeIndex = Math.max(currentSizeIndex - 1, 0);
      }

      if (newSizeIndex === currentSizeIndex) return;

      const updatedWidgets = localWidgets.map(w =>
        w.id === widgetId ? { ...w, size: SIZE_ORDER[newSizeIndex] } : w
      );

      setLocalWidgets(updatedWidgets);
      onLayoutChange?.(updatedWidgets);
    },
    [isEditMode, localWidgets, onLayoutChange]
  );

  return (
    <div ref={containerRef} className="w-full">
      <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
        {visibleWidgets.map(widget => (
          <div
            key={widget.id}
            className={`
              ${getSizeClasses(widget.size)}
              ${getHeightClasses(widget.height)}
              relative
              transition-all duration-200 ease-in-out
              ${isEditMode ? 'cursor-move' : ''}
              ${draggedWidgetId === widget.id ? 'opacity-50 scale-95 z-10' : ''}
              ${dragOverWidgetId === widget.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
            draggable={isEditMode}
            onDragStart={e => handleDragStart(e, widget.id)}
            onDragOver={e => handleDragOver(e, widget.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, widget.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Contrôles d'édition */}
            {isEditMode && (
              <div className="absolute top-2 right-2 z-20 flex gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md p-1">
                {/* Handle de drag */}
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <GripVertical size={16} className="text-gray-500" />
                </div>

                {/* Boutons de resize */}
                <button
                  onClick={() => handleResize(widget.id, 'decrease')}
                  disabled={widget.size === 'small'}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Réduire"
                >
                  <Minimize2 size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleResize(widget.id, 'increase')}
                  disabled={widget.size === 'full'}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Agrandir"
                >
                  <Maximize2 size={16} className="text-gray-500" />
                </button>
              </div>
            )}

            {/* Bordure en mode édition */}
            {isEditMode && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg pointer-events-none" />
            )}

            {/* Contenu du widget */}
            <div className="h-full w-full">
              <WidgetRenderer
                widget={widget}
                interventionStats={interventionStats}
                timelineData={timelineData}
                roomStats={roomStats}
                technicianPerformance={technicianPerformance}
                recentInterventions={recentInterventions}
                overdueInterventions={overdueInterventions}
                pendingValidationInterventions={pendingValidationInterventions}
                resolutionRate={resolutionRate}
                locationStats={locationStats}
                problematicRooms={problematicRooms}
                todayScheduled={todayScheduled}
                calculatedStats={calculatedStats}
                chartData={chartData}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun widget */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Aucun widget visible</p>
          <p className="text-sm mt-2">Activez le mode édition pour ajouter des widgets</p>
        </div>
      )}
    </div>
  );
};
