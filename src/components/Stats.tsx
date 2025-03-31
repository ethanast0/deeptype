import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  scriptStats?: {
    average_wpm: number;
    best_wpm: number;
  } | null;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded", 
      className, 
      {
        "animate-slide-up": isActive || isFinished
      }
    )}>
      <span>
        <span className="font-medium text-monkey-text">{stats.wpm}</span>{" wpm"}
      </span>

      <span className="text-zinc-600">•</span>
      
      <span>
        <span className="font-medium text-monkey-text">{stats.accuracy}%</span>{" acc"}
      </span>

      <span className="text-zinc-600">•</span>

      <span>
        <span className="font-medium text-monkey-text">{formatTime(stats.elapsedTime)}</span>{" time"}
      </span>
      
      {isFinished && (
        <>
          <span className="text-zinc-600">•</span>
          <span className="font-medium text-monkey-accent">completed</span>
        </>
      )}
    </div>
  );
};

export default Stats;
