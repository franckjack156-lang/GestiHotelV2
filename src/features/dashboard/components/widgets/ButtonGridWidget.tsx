/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * ButtonGridWidget Component
 *
 * Widget avec des boutons d'action personnalisables
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Grid3x3, Plus, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
        // Pour les actions personnalisées, on pourrait émettre un événement
        console.log('Custom action:', button.id);
        break;
    }
  };

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      plus: <Plus size={20} />,
      settings: <Settings size={20} />,
      external: <ExternalLink size={20} />,
      grid: <Grid3x3 size={20} />,
    };

    return iconName && iconMap[iconName] ? iconMap[iconName] : <Grid3x3 size={20} />;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Grid3x3 size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {buttons.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucun bouton configuré</p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {buttons.map((button) => (
              <Button
                key={button.id}
                variant={button.variant || 'default'}
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => handleButtonClick(button)}
              >
                {getIcon(button.icon)}
                <span className="text-sm font-medium truncate w-full text-center">
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
