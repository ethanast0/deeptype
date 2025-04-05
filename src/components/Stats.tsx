
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { SkullIcon } from 'lucide-react';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  deathMode?: boolean;
  deathModeFailures?: number;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className,
  deathMode = false,
  deathModeFailures = 0
}) => {
  return (
    <div className={cn("flex items-center space-x-2 text-base text-monkey-subtle py-2 px-3 rounded", 
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
      
      {deathMode && (
        <>
          <span className="text-zinc-600">•</span>
          <span className="font-medium text-red-500 flex items-center">
            <SkullIcon className="w-3 h-3 mr-1" />
            Death Mode {deathModeFailures > 0 ? `(${deathModeFailures})` : ""}
          </span>
        </>
      )}
      
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
