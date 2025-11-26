/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * BarChart Component
 *
 * Graphique en barres avec Recharts
 */

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface BarChartProps {
  title: string;
  data: any[];
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data} layout={layout}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {layout === 'horizontal' ? (
              <>
                <XAxis dataKey={xAxisKey} />
                <YAxis />
              </>
            ) : (
              <>
                <XAxis type="number" />
                <YAxis dataKey={xAxisKey} type="category" />
              </>
            )}
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color}
                radius={[8, 8, 0, 0]}
                label={showValues ? { position: 'top' } : undefined}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
