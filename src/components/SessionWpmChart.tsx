
import React from 'react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from './ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

interface SessionWpmChartProps {
  wpmData: number[];
  className?: string;
}

const SessionWpmChart: React.FC<SessionWpmChartProps> = ({ wpmData, className }) => {
  // Create a fixed array of 25 entries with placeholders
  const fixedData = Array(25).fill(0).map((_, index) => {
    // Use actual data where available
    const wpm = index < wpmData.length ? wpmData[index] : null;
    return {
      index: index + 1,
      wpm: wpm,
      label: wpm !== null ? `${wpm} WPM` : '—'
    };
  });
  
  // Calculate statistics based on actual data
  const averageWpm = wpmData.length > 0 
    ? Math.round(wpmData.reduce((sum, value) => sum + value, 0) / wpmData.length) 
    : 0;
  
  const bestWpm = wpmData.length > 0 ? Math.max(...wpmData) : 0;
  
  const chartConfig = {
    wpm: {
      label: "WPM",
      color: "#9b87f5",
    },
  };

  return (
    <div className={cn("w-full bg-background border border-slate-800 rounded-lg p-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-200">Session Performance</h3>
        <div className="flex gap-4 text-sm">
          <div className="text-gray-400">
            Average: <span className="text-monkey-accent font-bold">{averageWpm} WPM</span>
          </div>
          <div className="text-gray-400">
            Best: <span className="text-green-500 font-bold">{bestWpm} WPM</span>
          </div>
        </div>
      </div>
      
      <div className="h-40">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fixedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis 
                dataKey="index" 
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={{ stroke: '#444' }}
                tickFormatter={(value) => (value % 5 === 0) ? value.toString() : ''}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <ReferenceLine y={averageWpm} stroke="#35B853" strokeDasharray="3 3" 
                label={{ value: 'Avg', position: 'right', fill: '#35B853', fontSize: 10 }} 
              />
              <Bar 
                dataKey="wpm" 
                name="WPM"
                fill="#9b87f5" 
                radius={[4, 4, 0, 0]}
                // Empty bars for placeholders
                isAnimationActive={true}
                // Add labels under the bars
                label={{ 
                  position: 'bottom', 
                  fill: '#9b87f5', 
                  fontSize: 10,
                  // Only show labels for non-null values
                  formatter: (value: any) => value !== null ? value : '',
                  offset: 5
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SessionWpmChart;
