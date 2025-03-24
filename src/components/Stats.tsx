
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';

interface StatsProps {
  stats: TypingStats;
  isActive: boolean;
  isFinished: boolean;
  className?: string;
  careerStats?: {
    averageWpm: number;
    averageAccuracy: number;
    totalSessions: number;
    totalScripts: number;
  };
  showBalloon?: boolean;
}

const Stats: React.FC<StatsProps> = ({ 
  stats, 
  isActive, 
  isFinished,
  className,
  careerStats,
  showBalloon
}) => {
  return (
    <div className={cn("stats-container", className, {
      "animate-slide-up": isActive || isFinished
    })}>
      {/* Current session stats */}
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

      {/* Career stats */}
      {careerStats && (
        <div className="career-stats mt-4">
          <div className="text-sm text-monkey-subtle mb-2">Career Stats</div>
          <div className="flex gap-4">
            <div className="stat-box">
              <div className="stat-value text-lg">
                {careerStats.averageWpm}
              </div>
              <div className="stat-label text-xs">
                avg wpm
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-value text-lg">
                {careerStats.averageAccuracy}%
              </div>
              <div className="stat-label text-xs">
                avg accuracy
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-value text-lg">
                {careerStats.totalSessions}
              </div>
              <div className="stat-label text-xs">
                total sessions
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-value text-lg">
                {careerStats.totalScripts}
              </div>
              <div className="stat-label text-xs">
                scripts completed
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Balloon animation when beating record */}
      {showBalloon && (
        <div className="balloon-container absolute -top-20 right-10 animate-float">
          <div className="balloon w-16 h-20 bg-green-500 rounded-full relative">
            <div className="balloon-tie absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full"></div>
            <div className="balloon-string absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gray-400"></div>
            <div className="text-white font-bold text-center mt-6">New Record!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
