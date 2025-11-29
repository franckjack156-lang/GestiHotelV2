/**
 * BarChart Component
 *
 * Graphique en barres avec Recharts - Responsive avec gestion du débordement
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { ChartDataPoint } from './types';

interface BarChartProps {
  title: string;
  data: ChartDataPoint[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showValues?: boolean;
  height?: number;
  layout?: 'vertical' | 'horizontal';
}

// Fonction pour tronquer les labels longs
const truncateLabel = (str: string, maxLen: number = 12): string => {
  if (typeof str !== 'string') return String(str);
  if (str.length > maxLen) {
    return str.substring(0, maxLen - 1) + '…';
  }
  return str;
};

export const BarChart = ({
  title,
  data,
  bars,
  xAxisKey = 'name',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showValues = false,
  height = 300,
  layout = 'horizontal',
}: BarChartProps) => {
  // Préparer les données avec labels tronqués pour l'affichage
  const processedData = data.map(item => ({
    ...item,
    _displayName: truncateLabel(String(item[xAxisKey]), 8),
    _originalName: item[xAxisKey],
  }));

  // Calculer la hauteur adaptative si beaucoup de données
  const adaptiveHeight = layout === 'vertical' ? Math.max(height, data.length * 40) : height;

  // Le graphique seul, sans wrapper Card
  const chart = (
    <SafeResponsiveContainer minHeight={adaptiveHeight} height="100%">
      <RechartsBarChart
        data={processedData}
        layout={layout}
        margin={{
          top: 5,
          right: 5,
          left: layout === 'vertical' ? 60 : -10,
          bottom: layout === 'horizontal' ? 40 : 5,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.5} />}
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey="_displayName"
              tick={{ fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis tick={{ fontSize: 10 }} width={30} />
          </>
        ) : (
          <>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="_displayName" type="category" tick={{ fontSize: 10 }} width={60} />
          </>
        )}
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label: string) => {
              const item = processedData.find(d => d._displayName === label);
              return item ? String(item._originalName) : label;
            }}
          />
        )}
        {showLegend && (
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} iconSize={8} />
        )}
        {bars.map(bar => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            radius={[3, 3, 0, 0]}
            label={
              showValues
                ? {
                    position: 'top',
                    fontSize: 9,
                    fill: '#6b7280',
                  }
                : undefined
            }
          />
        ))}
      </RechartsBarChart>
    </SafeResponsiveContainer>
  );

  // Si pas de titre, retourner juste le graphique
  if (!title) {
    return <div className="h-full w-full">{chart}</div>;
  }

  // Avec titre, wrapper dans une Card
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-1 flex-shrink-0">
        <CardTitle className="text-sm truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-2 pt-0">{chart}</CardContent>
    </Card>
  );
};
