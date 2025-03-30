
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { ThumbsUp, ThumbsDown, Repeat } from 'lucide-react';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  highestWpm?: number;
  timesTyped?: number;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className,
  highestWpm = 168,
  timesTyped = 12450
}) => {
  const getStatus = () => {
    if (isFinished) return 'completed';
    if (isActive) return 'typing';
    return 'ready';
  };
  
  return (
    <div className={cn("stats-container grid grid-cols-7 gap-4 w-full bg-monkey-bg bg-opacity-50 py-2 px-1", className, {
      "animate-slide-up": isActive || isFinished
    })}>
      {/* Current WPM */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono">
          {stats.wpm}
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          wpm
        </div>
      </div>
      
      {/* Accuracy */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono">
          {stats.accuracy}%
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          acc
        </div>
      </div>
      
      {/* Time */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono">
          {formatTime(stats.elapsedTime)}
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          time
        </div>
      </div>
      
      {/* Status */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono">
          {getStatus()}
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          status
        </div>
      </div>
      
      {/* Repeat count */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono">
          0
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          repeat
        </div>
      </div>
      
      {/* Highest WPM */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono text-monkey-accent">
          {highestWpm}
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          wpm
        </div>
      </div>
      
      {/* Times typed */}
      <div className="stat-box flex flex-col items-center">
        <div className="stat-value text-2xl font-mono text-monkey-accent">
          {timesTyped}
        </div>
        <div className="stat-label text-xs text-monkey-subtle">
          typed
        </div>
      </div>
    </div>
  );
};

export default Stats;
