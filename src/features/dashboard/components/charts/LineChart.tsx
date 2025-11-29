/**
 * LineChart Component
 *
 * Graphique en ligne avec Recharts - Responsive avec gestion du débordement
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { ChartDataPoint } from './types';

interface LineChartProps {
  title: string;
  data: ChartDataPoint[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
}

// Fonction pour formater les dates courtes
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  // Si c'est une date ISO, la formater
  if (dateStr.includes('-') || dateStr.includes('/')) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  }
  // Sinon retourner tel quel (tronqué si nécessaire)
  return dateStr.length > 8 ? dateStr.substring(0, 8) : dateStr;
};

export const LineChart = ({
  title,
  data,
  lines,
  xAxisKey = 'date',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  height = 300,
}: LineChartProps) => {
  const hasData = data && data.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-4">
        {hasData ? (
          <SafeResponsiveContainer minHeight={height}>
            <RechartsLineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 30,
              }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.5} />}
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={35} />
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label: string) => {
                    // Afficher la date complète dans le tooltip
                    if (label.includes('-') || label.includes('/')) {
                      try {
                        const date = new Date(label);
                        return date.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                      } catch {
                        return label;
                      }
                    }
                    return label;
                  }}
                />
              )}
              {showLegend && (
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconSize={10} />
              )}
              {lines.map(line => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </RechartsLineChart>
          </SafeResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
