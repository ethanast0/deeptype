
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
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

interface SessionWpmChartProps {
  wpmData: number[];
  className?: string;
}

const SessionWpmChart: React.FC<SessionWpmChartProps> = ({ wpmData, className }) => {
  const data = wpmData.map((wpm) => ({
    wpm: wpm,
    label: `${wpm} WPM`
  }));

  // Calculate statistics
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
    <div className={cn("w-full h-full p-4 bg-background border border-slate-800 rounded-lg", className)}>
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
      
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="label" 
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
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SessionWpmChart;
