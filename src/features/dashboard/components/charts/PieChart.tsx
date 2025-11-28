/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PieChart Component
 *
 * Graphique en camembert avec Recharts - Responsive avec gestion du débordement
 */

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

interface PieChartProps {
  title: string;
  data: any[];
  dataKey?: string;
  nameKey?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  innerRadius?: number;
  colors?: string[];
}

// Fonction pour tronquer les labels
const truncateLabel = (str: string, maxLen: number = 15): string => {
  if (typeof str !== 'string') return String(str);
  if (str.length > maxLen) {
    return str.substring(0, maxLen - 1) + '…';
  }
  return str;
};

export const PieChart = ({
  title,
  data,
  dataKey = 'value',
  nameKey = 'name',
  showLegend = true,
  showTooltip = true,
  height = 300,
  innerRadius = 0,
  colors = COLORS,
}: PieChartProps) => {
  const hasData = data && data.length > 0;
  const totalValue = hasData ? data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) : 0;

  // Custom label qui n'affiche que le pourcentage
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius: or,
    percent,
  }: any) => {
    if (percent < 0.08) return null; // Ne pas afficher si < 8%

    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Le graphique seul
  const chart =
    hasData && totalValue > 0 ? (
      <SafeResponsiveContainer minHeight={height} height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy={showLegend ? '45%' : '50%'}
            innerRadius={innerRadius}
            outerRadius={innerRadius > 0 ? innerRadius + 40 : 55}
            fill="#8884d8"
            label={renderCustomLabel}
            labelLine={false}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number, name: string) => [
                `${value} (${totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
            />
          )}
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: '10px',
                paddingTop: '5px',
              }}
              iconSize={8}
              formatter={(value: string) => truncateLabel(value, 12)}
            />
          )}
        </RechartsPieChart>
      </SafeResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p className="text-sm">Aucune donnée</p>
      </div>
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
