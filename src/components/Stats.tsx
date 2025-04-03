import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  isScriptLoaded?: boolean;
  currentScriptQuoteIndex?: number;
  totalScriptQuotes?: number;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className,
  isScriptLoaded = false,
  currentScriptQuoteIndex = 0,
  totalScriptQuotes = 0
}) => {
  return (
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
      
      {isScriptLoaded && totalScriptQuotes > 0 && (
        <>
          <span className="text-zinc-600">•</span>
          <span>
             <span className="font-medium text-monkey-text">{currentScriptQuoteIndex + 1}</span> / {totalScriptQuotes}
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
