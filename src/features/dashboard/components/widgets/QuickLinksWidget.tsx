/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * QuickLinksWidget Component
 *
 * Widget avec des liens cliquables personnalisables
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

export const QuickLinksWidget = ({
  title,
  links = [],
  columns = 2,
}: QuickLinksWidgetProps) => {
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <LinkIcon size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
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
            {links.map((link) => (
              <Button
                key={link.id}
                variant="outline"
                className="h-auto py-3 px-4 justify-start items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleLinkClick(link)}
              >
                <ExternalLink size={18} className={getIconColor(link.color)} />
                <span className="text-sm truncate">{link.label}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
