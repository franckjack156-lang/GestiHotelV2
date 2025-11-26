/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * PieChart Component
 *
 * Graphique en camembert avec Recharts
 */

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface PieChartProps {
  title: string;
  data: any[];
  dataKey?: string;
  nameKey?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  innerRadius?: number; // Pour donut chart
  colors?: string[];
}

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={innerRadius > 0 ? innerRadius + 60 : 80}
              fill="#8884d8"
              label={(entry) => `${entry[nameKey]}: ${entry[dataKey]}`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
