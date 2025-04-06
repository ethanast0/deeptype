import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { SkullIcon, RepeatIcon } from 'lucide-react';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  deathMode?: boolean;
  deathModeFailures?: number;
  repeatMode?: boolean;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className,
  deathMode = false,
  deathModeFailures = 0,
  repeatMode = false
}) => {
  return (
    <div className={cn("flex items-center space-x-2 text-lg text-monkey-subtle py-2 px-3 rounded", 
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
      
      {deathMode && deathModeFailures > 0 && (
        <>
          <span className="text-zinc-600">•</span>
          <span className="font-medium text-red-500 flex items-center">
            <SkullIcon className="w-3 h-3 mr-1" />
            {deathModeFailures}
          </span>
        </>
      )}

      {repeatMode && (
        <>
          <span className="text-zinc-600">•</span>
          <span className="font-medium text-green-500 flex items-center">
            <RepeatIcon className="w-3 h-3 mr-1" />
            {"repeat"}
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
