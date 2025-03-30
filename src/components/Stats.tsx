
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className 
}) => {
  return (
    <div className={cn("stats-container", className, {
      "animate-slide-up": isActive || isFinished
    })}>
      <div className="stat-box">
        <div className="stat-value text-lg">
          {stats.wpm}
        </div>
        <div className="stat-label text-xs">
          wpm
        </div>
      </div>
      
      <div className="stat-box">
        <div className="stat-value text-lg">
          {stats.accuracy}%
        </div>
        <div className="stat-label text-xs">
          accuracy
        </div>
      </div>
      
      <div className="stat-box">
        <div className="stat-value text-lg">
          {formatTime(stats.elapsedTime)}
        </div>
        <div className="stat-label text-xs">
          time
        </div>
      </div>
      
      {isFinished && (
        <div className="stat-box text-monkey-accent">
          <div className="stat-value text-lg">Completed!</div>
          <div className="stat-label text-xs">status</div>
        </div>
      )}
    </div>
  );
};

export default Stats;
