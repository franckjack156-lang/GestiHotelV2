/**
 * QuickLinksWidget Component
 *
 * Widget avec des liens cliquables personnalisables - Responsive
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Link {
  id: string;
  label: string;
  url: string;
  icon?: string;
  color?: string;
  openInNewTab?: boolean;
}

interface QuickLinksWidgetProps {
  title: string;
  links: Link[];
  columns?: number;
}

export const QuickLinksWidget = ({ title, links = [], columns = 2 }: QuickLinksWidgetProps) => {
  const handleLinkClick = (link: Link) => {
    if (link.openInNewTab !== false) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.url;
    }
  };

  const getIconColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      pink: 'text-pink-500',
      orange: 'text-orange-500',
      gray: 'text-gray-500',
    };

    return color && colorMap[color] ? colorMap[color] : 'text-blue-500';
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <LinkIcon size={18} className="flex-shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {links.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucun lien configuré</p>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {links.map(link => (
              <Button
                key={link.id}
                variant="outline"
                className="h-auto py-2 px-3 justify-start items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 overflow-hidden"
                onClick={() => handleLinkClick(link)}
                title={link.label}
              >
                <ExternalLink size={16} className={`flex-shrink-0 ${getIconColor(link.color)}`} />
                <span className="text-xs sm:text-sm truncate">{link.label}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
