
import React, { useState } from 'react';
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
  CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { MenuIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionWpmChartProps {
  wpmData: number[];
  className?: string;
}

type ViewType = 'chart' | 'git';

const SessionWpmChart: React.FC<SessionWpmChartProps> = ({ wpmData, className }) => {
  const [viewType, setViewType] = useState<ViewType>('chart');
  
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

  // Function to determine if current WPM is higher than previous
  const getWpmComparisonColor = (index: number): string => {
    if (index === 0 || wpmData[index] === undefined) return '#35B853'; // Default green for first entry
    if (wpmData[index-1] === undefined) return '#35B853'; // Default green if previous doesn't exist
    
    return wpmData[index] >= wpmData[index-1] ? '#35B853' : '#ea384c'; // Green if higher/equal, red if lower
  };

  return (
    <div className={cn("w-full bg-background border border-zinc-900 rounded-lg p-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium text-gray-500">session stats</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-sm">
            <div className="text-gray-400">
              avg: <span className="text-monkey-accent font-bold">{averageWpm} WPM</span>
            </div>
            <div className="text-gray-400">
              best: <span className="text-green-500 font-bold">{bestWpm} WPM</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-800 transition-colors">
              <MenuIcon className="h-4 w-4 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewType('chart')}>
                Chart View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewType('git')}>
                Git View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {viewType === 'chart' ? (
        <div className="h-40">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fixedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="transparent" />
                <XAxis 
                  dataKey="index" 
                  tick={null}
                  axisLine={null}
                  tickFormatter={(value) => (value % 15 === 0) ? value.toString() : ''}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar 
                  dataKey="wpm" 
                  name="WPM"
                  fill="#35B853"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  label={{ 
                    position: 'top', 
                    fill: '#27272a', 
                    fontSize: 12,
                    formatter: (value: any) => value !== null ? value : '',
                    offset: 5
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="h-40 p-2">
          <div className="grid grid-cols-25 gap-1 h-full place-items-end">
            {fixedData.map((entry, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* Display square box for each data point */}
                <div 
                  className={cn(
                    "w-6 h-6 rounded-sm flex items-center justify-center text-xs font-medium",
                    entry.wpm === null 
                      ? "bg-zinc-800" 
                      : "text-black"
                  )}
                  style={{ 
                    backgroundColor: entry.wpm !== null 
                      ? getWpmComparisonColor(idx) 
                      : undefined 
                  }}
                >
                  {entry.wpm !== null && (
                    <span>{entry.wpm}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionWpmChart;
