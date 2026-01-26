/**
 * Pie Chart Component
 *
 * Displays distribution data as a pie chart
 */

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  colors = DEFAULT_COLORS,
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-16">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
