
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
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreHorizontal, BarChart as BarChartIcon, GridIcon } from 'lucide-react';

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
  
  // Add trend data for Git view
  const gitData = wpmData.map((wpm, index) => {
    const prevWpm = index > 0 ? wpmData[index - 1] : wpm;
    const trend = wpm >= prevWpm ? 'up' : 'down';
    return { wpm, trend };
  });
  
  const chartConfig = {
    wpm: {
      label: "WPM",
      color: "#9b87f5",
    },
  };

  const renderChartView = () => (
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
              // Empty bars for placeholders
              isAnimationActive={true}
              // Add labels under the bars
              label={{ 
                position: 'top', 
                fill: '#27272a', 
                fontSize: 12,
                // Only show labels for non-null values
                formatter: (value: any) => value !== null ? value : '',
                offset: 5
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  const renderGitView = () => (
    <div className="h-40 flex items-center justify-center">
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-2">
        {gitData.map((entry, i) => (
          <div 
            key={i}
            className={cn(
              "w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium",
              entry.trend === 'up' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
            )}
            title={`${entry.wpm} WPM`}
          >
            {entry.wpm}
          </div>
        ))}
        {/* Add placeholder boxes if fewer than 10 entries */}
        {Array(Math.max(0, 10 - gitData.length)).fill(0).map((_, i) => (
          <div 
            key={`placeholder-${i}`}
            className="w-8 h-8 rounded-sm bg-zinc-800 opacity-50"
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full bg-background border border-zinc-900 rounded-lg p-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium text-gray-500">session stats</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-4 text-sm">
            <div className="text-gray-400">
              avg: <span className="text-monkey-accent font-bold">{averageWpm} WPM</span>
            </div>
            <div className="text-gray-400">
              best: <span className="text-green-500 font-bold">{bestWpm} WPM</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-transparent p-0 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
              <span className="sr-only">Open view options</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setViewType('chart')}
                className={cn(viewType === 'chart' && "bg-zinc-800")}
              >
                <BarChartIcon className="mr-2 h-4 w-4" />
                <span>Chart View</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewType('git')}
                className={cn(viewType === 'git' && "bg-zinc-800")}
              >
                <GridIcon className="mr-2 h-4 w-4" />
                <span>Git View</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {viewType === 'chart' ? renderChartView() : renderGitView()}
    </div>
  );
};

export default SessionWpmChart;
