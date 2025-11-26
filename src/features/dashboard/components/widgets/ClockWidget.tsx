/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * ClockWidget Component
 *
 * Widget horloge avec plusieurs formats d'affichage
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Clock } from 'lucide-react';

interface ClockWidgetProps {
  title: string;
  format?: '12h' | '24h' | 'analog';
  showSeconds?: boolean;
  showDate?: boolean;
  timezone?: string;
}

export const ClockWidget = ({
  title,
  format = '24h',
  showSeconds = true,
  showDate = true,
  timezone,
}: ClockWidgetProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, showSeconds ? 1000 : 60000);

    return () => clearInterval(timer);
  }, [showSeconds]);

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: format === '12h',
      ...(timezone && { timeZone: timezone }),
    };

    return new Intl.DateTimeFormat('fr-FR', options).format(currentTime);
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(timezone && { timeZone: timezone }),
    };

    return new Intl.DateTimeFormat('fr-FR', options).format(currentTime);
  };

  if (format === 'analog') {
    // Horloge analogique
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock size={20} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Cercle horloge */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Fond */}
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-700"
              />

              {/* Marques d'heures */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x1 = 100 + 85 * Math.cos(angle);
                const y1 = 100 + 85 * Math.sin(angle);
                const x2 = 100 + 75 * Math.cos(angle);
                const y2 = 100 + 75 * Math.sin(angle);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-400 dark:text-gray-600"
                  />
                );
              })}

              {/* Aiguille des heures */}
              <line
                x1="100"
                y1="100"
                x2={100 + 40 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
                y2={100 + 40 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-gray-700 dark:text-gray-300"
              />

              {/* Aiguille des minutes */}
              <line
                x1="100"
                y1="100"
                x2={100 + 60 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
                y2={100 + 60 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-gray-800 dark:text-gray-200"
              />

              {/* Aiguille des secondes */}
              {showSeconds && (
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 70 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
                  y2={100 + 70 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-red-500"
                />
              )}

              {/* Centre */}
              <circle cx="100" cy="100" r="5" fill="currentColor" className="text-gray-800 dark:text-gray-200" />
            </svg>
          </div>

          {showDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center capitalize">
              {formatDate()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Horloge numérique
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold text-gray-900 dark:text-white font-mono tabular-nums">
          {formatTime()}
        </div>

        {showDate && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 text-center capitalize">
            {formatDate()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
