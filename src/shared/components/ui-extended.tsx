/**
 * ============================================================================
 * UI EXTENDED COMPONENTS - BIBLIOTHÈQUE COMPLÈTE
 * ============================================================================
 *
 * Collection de composants UI réutilisables pour toute l'application
 * - DataTable
 * - SearchBar
 * - FilterPanel
 * - StatCard
 * - EmptyState
 * - ConfirmDialog
 * - ImageLightbox
 * - DateRangePicker
 * - LoadingSkeleton
 * - Timeline
 * - FileUpload
 * - UserAvatar
 * - StatusIndicator
 * - et plus...
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ArrowUpDown,
  Upload,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Card,
  CardContent,
  // CardDescription, // TODO: Imported but unused
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';

// ============================================================================
// DATATABLE - Table de données générique et réutilisable
// ============================================================================

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  selection?: {
    selected: string[];
    onSelect: (ids: string[]) => void;
  };
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyMessage = 'Aucune donnée',
  pagination,
  sortable,
  onSort,
  selection,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const toggleSelectAll = () => {
    if (!selection) return;
    if (selection.selected.length === data.length) {
      selection.onSelect([]);
    } else {
      selection.onSelect(data.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (!selection) return;
    if (selection.selected.includes(id)) {
      selection.onSelect(selection.selected.filter(sid => sid !== id));
    } else {
      selection.onSelect([...selection.selected, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selection.selected.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
                    >
                      {column.label}
                      <ArrowUpDown size={14} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map(item => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {selection && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selection.selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      onClick={e => e.stopPropagation()}
                      className="rounded"
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td key={column.key} className="px-4 py-3 text-sm">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} sur {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SEARCHBAR - Barre de recherche avec debounce intégré
// ============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Rechercher...',
  className,
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch?.();
          }
        }}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD - Carte pour afficher des statistiques
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  onClick,
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    green: 'text-green-600 bg-green-100 dark:bg-green-900',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900',
    red: 'text-red-600 bg-red-100 dark:bg-red-900',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
  };

  return (
    <Card
      className={cn('h-full', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
        {/* min-w-0 est CRUCIAL pour permettre le truncate sur flex items */}
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate min-w-0 flex-1">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn('rounded-lg p-1.5 sm:p-2 flex-shrink-0', colorClasses[color])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {/* Conteneur avec min-w-0 pour le truncate */}
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-bold truncate" title={String(value)}>
            {value}
          </div>
          {(description || trend) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {trend && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs sm:text-sm flex-shrink-0',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span
                  className="text-xs text-gray-600 dark:text-gray-400 truncate min-w-0"
                  title={description}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE - État vide avec message et action
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG - Dialog de confirmation réutilisable
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// IMAGE LIGHTBOX - Galerie photos avec zoom
// ============================================================================

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImage = images[currentIndex];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="relative">
          {/* Image */}
          <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-[400px]">
            <img
              src={currentImage.url}
              alt={currentImage.alt || `Image ${currentIndex + 1}`}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s',
              }}
              className="max-h-[600px] object-contain"
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 rounded-full px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="text-white hover:text-white"
            >
              <ZoomOut size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="text-white hover:text-white"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRotation((rotation + 90) % 360)}
              className="text-white hover:text-white"
            >
              <RotateCw size={16} />
            </Button>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              {onPrevious && currentIndex > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                >
                  <ChevronLeft size={24} />
                </Button>
              )}
              {onNext && currentIndex < images.length - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <ChevronRight size={24} />
                </Button>
              )}
            </>
          )}

          {/* Counter */}
          <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// FILE UPLOAD - Zone de drag & drop pour fichiers
// ============================================================================

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // en MB
  maxFiles?: number;
  children?: React.ReactNode;
}

export function FileUpload({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
  children,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    // Limiter le nombre de fichiers
    const limitedFiles = files.slice(0, maxFiles);

    // Filtrer par taille
    const validFiles = limitedFiles.filter(file => {
      const sizeMB = file.size / 1024 / 1024;
      return sizeMB <= maxSize;
    });

    if (validFiles.length < limitedFiles.length) {
      alert(`Certains fichiers sont trop volumineux (max ${maxSize}MB)`);
    }

    onFilesSelected(validFiles);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-300 dark:border-gray-700'
      )}
    >
      {children || (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Glissez-déposez vos fichiers ici ou
          </p>
          <label className="cursor-pointer">
            <span className="text-indigo-600 hover:text-indigo-700">parcourez vos fichiers</span>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Max {maxFiles} fichiers, {maxSize}MB par fichier
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// TIMELINE - Timeline verticale pour historique
// ============================================================================

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Icon */}
          <div className="relative flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              {item.icon || <Clock size={16} />}
            </div>
            {index < items.length - 1 && (
              <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700 mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {format(item.timestamp, 'dd MMM yyyy HH:mm', { locale: fr })}
              </span>
            </div>
            {item.user && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                  {item.user.name[0]}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.user.name}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// USER AVATAR - Avatar utilisateur avec fallback
// ============================================================================

interface UserAvatarProps {
  name: string;
  photoURL?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ name, photoURL, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-medium',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ============================================================================
// STATUS INDICATOR - Indicateur de statut avec point coloré
// ============================================================================

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label?: string;
  showDot?: boolean;
}

export function StatusIndicator({ status, label, showDot = true }: StatusIndicatorProps) {
  const config = {
    success: {
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    warning: {
      color: 'bg-orange-500',
      textColor: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    error: {
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
    info: {
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    neutral: {
      color: 'bg-gray-500',
      textColor: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  };

  const { color, textColor, bgColor } = config[status];

  if (!label) {
    return <div className={cn('h-2 w-2 rounded-full', color)} />;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
        bgColor,
        textColor
      )}
    >
      {showDot && <div className={cn('h-1.5 w-1.5 rounded-full', color)} />}
      <span>{label}</span>
    </div>
  );
}

// ============================================================================
// LOADING SKELETON - Skeleton pour états de chargement
// ============================================================================

interface LoadingSkeletonProps {
  type?: 'text' | 'card' | 'table' | 'avatar' | 'image';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ type = 'text', count = 1, className }: LoadingSkeletonProps) {
  const skeletons = {
    text: (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
      </div>
    ),
    card: (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
      </div>
    ),
    table: (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    ),
    avatar: <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />,
    image: <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />,
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletons[type]}</div>
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DataTable,
  SearchBar,
  StatCard,
  EmptyState,
  ConfirmDialog,
  ImageLightbox,
  FileUpload,
  Timeline,
  UserAvatar,
  StatusIndicator,
  LoadingSkeleton,
};
