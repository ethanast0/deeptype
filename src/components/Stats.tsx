
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
        <div className="stat-value">{stats.wpm}</div>
        <div className="stat-label">wpm</div>
      </div>
      
      <div className="stat-box">
        <div className="stat-value">{stats.accuracy}%</div>
        <div className="stat-label">accuracy</div>
      </div>
      
      <div className="stat-box">
        <div className="stat-value">{formatTime(stats.elapsedTime)}</div>
        <div className="stat-label">time</div>
      </div>
      
      {isFinished && (
        <div className="stat-box text-monkey-accent">
          <div className="stat-value">Completed!</div>
          <div className="stat-label">status</div>
        </div>
      )}
    </div>
  );
};

export default Stats;
