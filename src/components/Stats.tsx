import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { Users } from 'lucide-react';

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
  className,
  scriptStats
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded", 
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

      {scriptStats && (
        <div className="flex items-center space-x-2 text-xs text-monkey-subtle">
          <span>
            <span className="font-medium text-monkey-text">{Math.round(scriptStats.average_wpm)}</span>{" avg"}
          </span>
          <span className="text-zinc-600">/</span>
          <span>
            <span className="font-medium text-monkey-text">{Math.round(scriptStats.best_wpm)}</span>{" best"}
          </span>
        </div>
      )}
    </div>
  );
};

export default Stats;
