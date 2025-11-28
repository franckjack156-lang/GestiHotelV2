/**
 * NoteWidget Component
 *
 * Widget de note/texte libre avec formatage personnalisable - Responsive
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { StickyNote } from 'lucide-react';

interface NoteWidgetProps {
  title: string;
  content: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export const NoteWidget = ({
  title,
  content,
  backgroundColor,
  textColor,
  fontSize = 'medium',
}: NoteWidgetProps) => {
  const bgColorMap: Record<string, string> = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    gray: 'bg-gray-50 dark:bg-gray-800',
  };

  const textColorMap: Record<string, string> = {
    yellow: 'text-yellow-900 dark:text-yellow-100',
    blue: 'text-blue-900 dark:text-blue-100',
    green: 'text-green-900 dark:text-green-100',
    red: 'text-red-900 dark:text-red-100',
    purple: 'text-purple-900 dark:text-purple-100',
    gray: 'text-gray-900 dark:text-gray-100',
  };

  const fontSizeMap = {
    small: 'text-xs sm:text-sm',
    medium: 'text-sm sm:text-base',
    large: 'text-base sm:text-lg',
  };

  const bgClass =
    backgroundColor && bgColorMap[backgroundColor]
      ? bgColorMap[backgroundColor]
      : 'bg-yellow-50 dark:bg-yellow-900/20';

  const textClass =
    textColor && textColorMap[textColor]
      ? textColorMap[textColor]
      : 'text-yellow-900 dark:text-yellow-100';

  return (
    <Card className={`h-full flex flex-col overflow-hidden ${bgClass}`}>
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className={`text-sm sm:text-base flex items-center gap-2 ${textClass}`}>
          <StickyNote size={18} className="flex-shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        <div
          className={`${fontSizeMap[fontSize]} ${textClass} whitespace-pre-wrap`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {content || 'Aucune note'}
        </div>
      </CardContent>
    </Card>
  );
};
