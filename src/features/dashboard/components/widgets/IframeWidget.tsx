/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * IframeWidget Component
 *
 * Widget pour intégrer des sites web externes via iframe
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Globe } from 'lucide-react';

interface IframeWidgetProps {
  title: string;
  url: string;
  allowFullscreen?: boolean;
  allowScripts?: boolean;
}

export const IframeWidget = ({
  title,
  url,
  allowFullscreen = false,
  allowScripts = false,
}: IframeWidgetProps) => {
  const sandboxOptions = [];
  if (allowScripts) {
    sandboxOptions.push('allow-scripts', 'allow-same-origin');
  }
  if (allowFullscreen) {
    sandboxOptions.push('allow-fullscreen');
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {url ? (
          <iframe
            src={url}
            className="w-full h-full border-0"
            sandbox={sandboxOptions.join(' ') || undefined}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucune URL configurée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
