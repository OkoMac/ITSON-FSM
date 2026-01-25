/**
 * Bar Chart Component
 *
 * Displays data as a bar chart
 */

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface BarChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  title,
  color = '#10b981',
  height = 300,
  showLegend = false,
  yAxisLabel,
  xAxisLabel,
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-16">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey={xKey}
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -5 }
                : undefined
            }
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          {showLegend && <Legend />}
          <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
