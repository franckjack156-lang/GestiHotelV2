/**
 * ButtonGridWidget Component
 *
 * Widget avec des boutons d'action personnalisables - Responsive
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Grid3x3, Plus, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/core/utils/logger';

interface ButtonAction {
  id: string;
  label: string;
  action: 'navigate' | 'external_link' | 'custom';
  target?: string;
  icon?: string;
  color?: string;
  variant?: 'default' | 'outline' | 'destructive';
}

interface ButtonGridWidgetProps {
  title: string;
  buttons: ButtonAction[];
  columns?: number;
  onNavigate?: (path: string) => void;
}

export const ButtonGridWidget = ({
  title,
  buttons = [],
  columns = 2,
  onNavigate,
}: ButtonGridWidgetProps) => {
  const navigate = useNavigate();

  const handleButtonClick = (button: ButtonAction) => {
    switch (button.action) {
      case 'navigate':
        if (button.target) {
          if (onNavigate) {
            onNavigate(button.target);
          } else {
            navigate(button.target);
          }
        }
        break;

      case 'external_link':
        if (button.target) {
          window.open(button.target, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'custom':
        logger.debug('Custom action:', button.id);
        break;
    }
  };

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      plus: <Plus size={18} />,
      settings: <Settings size={18} />,
      external: <ExternalLink size={18} />,
      grid: <Grid3x3 size={18} />,
    };

    return iconName && iconMap[iconName] ? iconMap[iconName] : <Grid3x3 size={18} />;
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 truncate">
          <Grid3x3 size={18} className="flex-shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {buttons.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucun bouton configuré</p>
          </div>
        ) : (
          <div
            className="grid gap-2 h-full"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridAutoRows: 'minmax(60px, 1fr)',
            }}
          >
            {buttons.map(button => (
              <Button
                key={button.id}
                variant={button.variant || 'default'}
                className="h-full min-h-[60px] flex flex-col items-center justify-center gap-1 p-2 overflow-hidden"
                onClick={() => handleButtonClick(button)}
              >
                <div className="flex-shrink-0">{getIcon(button.icon)}</div>
                <span
                  className="text-xs font-medium truncate w-full text-center px-1"
                  title={button.label}
                >
                  {button.label}
                </span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
