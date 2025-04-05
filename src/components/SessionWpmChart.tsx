
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
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

interface SessionWpmChartProps {
  wpmData: number[];
  className?: string;
}

const SessionWpmChart: React.FC<SessionWpmChartProps> = ({ wpmData, className }) => {
  const data = wpmData.map((wpm, index) => ({
    attempt: `Attempt ${index + 1}`,
    wpm: wpm,
  }));

  // Calculate average WPM
  const averageWpm = wpmData.length > 0 
    ? Math.round(wpmData.reduce((sum, value) => sum + value, 0) / wpmData.length) 
    : 0;

  // Find min and max for y-axis
  const maxWpm = Math.max(...wpmData, 10);
  const minWpm = Math.max(0, Math.min(...wpmData) - 5);
  
  const chartConfig = {
    wpm: {
      label: "WPM",
      color: "#9b87f5",
    },
  };

  return (
    <div className={cn("p-4 bg-slate-800 rounded-lg", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-200">Session Performance</h3>
        <div className="text-sm text-gray-400">
          Average WPM: <span className="text-monkey-accent font-bold">{averageWpm}</span>
        </div>
      </div>
      
      <div className="h-64">
        <ChartContainer config={chartConfig}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="attempt" 
              tick={{ fontSize: 12, fill: '#888' }}
              axisLine={{ stroke: '#444' }}
            />
            <YAxis 
              domain={[minWpm, maxWpm]} 
              tick={{ fontSize: 12, fill: '#888' }}
              axisLine={{ stroke: '#444' }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Bar 
              dataKey="wpm" 
              name="WPM"
              fill="#9b87f5" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SessionWpmChart;
