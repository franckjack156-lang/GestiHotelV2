/**
 * IconPicker Component
 *
 * Sélecteur d'icônes visuel utilisant les icônes Lucide
 */

import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// Liste des icônes les plus utilisées pour les listes de référence
const COMMON_ICONS = [
  // Actions/États
  'Check',
  'X',
  'AlertCircle',
  'AlertTriangle',
  'Info',
  'HelpCircle',
  'CheckCircle',
  'XCircle',
  'Clock',
  'Timer',
  'Hourglass',
  'Calendar',

  // Travaux/Maintenance
  'Wrench',
  'Hammer',
  'Screwdriver',
  'Settings',
  'Cog',
  'Tool',
  'Zap',
  'Flame',
  'Droplets',
  'Droplet',
  'Wind',
  'Thermometer',
  'Lightbulb',
  'Plug',
  'Cable',
  'Wifi',
  'WifiOff',

  // Bâtiments/Lieux
  'Building',
  'Building2',
  'Home',
  'Hotel',
  'DoorOpen',
  'DoorClosed',
  'Bed',
  'BedDouble',
  'BedSingle',
  'Bath',
  'Shower',
  'Toilet',
  'Key',
  'Lock',
  'Unlock',
  'MapPin',
  'Navigation',

  // Priorités
  'ArrowUp',
  'ArrowDown',
  'ArrowRight',
  'ChevronUp',
  'ChevronDown',
  'ChevronsUp',
  'ChevronsDown',
  'Flag',
  'Star',
  'StarOff',

  // Personnes/Rôles
  'User',
  'Users',
  'UserCheck',
  'UserX',
  'UserPlus',
  'UserCog',
  'HardHat',
  'Shield',
  'ShieldCheck',
  'Crown',
  'Briefcase',

  // Documents/Communication
  'FileText',
  'File',
  'Folder',
  'FolderOpen',
  'Clipboard',
  'ClipboardList',
  'MessageSquare',
  'MessageCircle',
  'Mail',
  'Phone',
  'Bell',

  // Équipements
  'Tv',
  'Monitor',
  'Smartphone',
  'Laptop',
  'Printer',
  'Camera',
  'Fan',
  'AirVent',
  'Refrigerator',
  'Microwave',
  'WashingMachine',

  // Transport/Extérieur
  'Car',
  'Truck',
  'Bike',
  'ParkingCircle',
  'Trees',
  'Flower',
  'Sun',
  'Moon',
  'Cloud',
  'CloudRain',
  'Umbrella',
  'Snowflake',

  // Catégories diverses
  'Package',
  'Box',
  'Archive',
  'Tag',
  'Tags',
  'Bookmark',
  'Heart',
  'ThumbsUp',
  'ThumbsDown',
  'Award',
  'Medal',
  'Trophy',
  'DollarSign',
  'Euro',
  'CreditCard',
  'Receipt',
  'Calculator',
  'Trash',
  'Trash2',
  'Recycle',
  'RefreshCw',
  'RotateCw',
  'Plus',
  'Minus',
  'Edit',
  'Edit2',
  'Pencil',
  'Save',
];

// Catégories d'icônes pour faciliter la navigation
const ICON_CATEGORIES: Record<string, string[]> = {
  Actions: [
    'Check',
    'X',
    'AlertCircle',
    'AlertTriangle',
    'Info',
    'HelpCircle',
    'CheckCircle',
    'XCircle',
    'Plus',
    'Minus',
    'Edit',
    'Edit2',
    'Pencil',
    'Save',
    'Trash',
    'Trash2',
    'RefreshCw',
  ],
  Temps: ['Clock', 'Timer', 'Hourglass', 'Calendar', 'CalendarDays', 'CalendarCheck'],
  Maintenance: [
    'Wrench',
    'Hammer',
    'Screwdriver',
    'Settings',
    'Cog',
    'Tool',
    'Zap',
    'Flame',
    'Droplets',
    'Droplet',
    'Wind',
    'Thermometer',
    'Lightbulb',
    'Plug',
    'Cable',
  ],
  Bâtiment: [
    'Building',
    'Building2',
    'Home',
    'Hotel',
    'DoorOpen',
    'DoorClosed',
    'Key',
    'Lock',
    'Unlock',
    'MapPin',
  ],
  Chambres: ['Bed', 'BedDouble', 'BedSingle', 'Bath', 'Shower', 'Toilet', 'Tv', 'Fan', 'AirVent'],
  Priorités: [
    'ArrowUp',
    'ArrowDown',
    'ChevronsUp',
    'ChevronsDown',
    'Flag',
    'Star',
    'AlertTriangle',
  ],
  Personnes: [
    'User',
    'Users',
    'UserCheck',
    'UserX',
    'UserPlus',
    'UserCog',
    'HardHat',
    'Shield',
    'ShieldCheck',
    'Crown',
    'Briefcase',
  ],
  Documents: [
    'FileText',
    'File',
    'Folder',
    'FolderOpen',
    'Clipboard',
    'ClipboardList',
    'Mail',
    'MessageSquare',
  ],
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  placeholder?: string;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une icône',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Récupérer le composant icône actuel
  const CurrentIcon = value
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[value]
    : null;

  // Filtrer les icônes
  const filteredIcons = useMemo(() => {
    let icons = selectedCategory ? ICON_CATEGORIES[selectedCategory] || [] : COMMON_ICONS;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      icons = icons.filter(icon => icon.toLowerCase().includes(lower));
    }

    return icons;
  }, [searchTerm, selectedCategory]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {CurrentIcon ? (
            <div className="flex items-center gap-2 flex-1">
              <CurrentIcon className="h-4 w-4" />
              <span className="flex-1">{value}</span>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" onClick={handleClear} />
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher une icône..."
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Catégories */}
          <div className="flex flex-wrap gap-1 mt-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedCategory(null)}
            >
              Tout
            </Button>
            {Object.keys(ICON_CATEGORIES).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {filteredIcons.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Aucune icône trouvée</div>
          ) : (
            <div className="grid grid-cols-8 gap-1 p-2">
              {filteredIcons.map(iconName => {
                const IconComponent = (
                  LucideIcons as unknown as Record<
                    string,
                    React.ComponentType<{ className?: string }>
                  >
                )[iconName];
                if (!IconComponent) return null;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelect(iconName)}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors',
                      value === iconName && 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                    )}
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {value && (
          <div className="p-2 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Sélectionné : <code className="bg-gray-200 px-1 rounded">{value}</code>
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleClear({} as React.MouseEvent)}>
              Effacer
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
