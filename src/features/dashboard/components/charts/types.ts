/**
 * Types for Chart Components
 */

/**
 * Generic chart data point interface
 * All chart data should extend from this
 */
export interface ChartDataPoint {
  name?: string;
  value?: number;
  date?: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * Props for pie chart custom label renderer
 * Compatible with Recharts PieLabelRenderProps
 */
export interface PieLabelRenderProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  index?: number;
  name?: string;
  value?: number;
}
