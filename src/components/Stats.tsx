
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface StatsProps {
  stats?: TypingStats;
  isActive?: boolean;
  isFinished?: boolean;
  className?: string;
  highestWpm?: number;
  timesTyped?: number;
  upvotes?: number;
  downvotes?: number;
  onUpvote?: () => void;
  onDownvote?: () => void;
  showCareerStats?: boolean;
  showTopStats?: boolean;
  showBottomStats?: boolean;
}

const Stats: React.FC<StatsProps> = ({ 
  stats = {
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    elapsedTime: 0,
  }, 
  isActive = false, 
  isFinished = false,
  className,
  highestWpm = 0,
  timesTyped = 0,
  upvotes = 0,
  downvotes = 0,
  onUpvote,
  onDownvote,
  showCareerStats = true,
  showTopStats = true,
  showBottomStats = true
}) => {
  const getStatus = () => {
    if (isFinished) return 'completed';
    if (isActive) return 'typing';
    return 'ready';
  };
  
  // Component for displaying a stat with value on top and label below
  const StatDisplay = ({ value, label }: { value: React.ReactNode; label: string }) => (
    <div className="stat-box flex flex-col items-center">
      <div className="stat-value text-sm font-mono">{value}</div>
      <div className="stat-label text-xs text-monkey-subtle">{label}</div>
    </div>
  );
  
  return (
    <div className="stats-wrapper flex flex-col w-full gap-2">
      {/* Top Stats Box - contains current typing stats and career stats */}
      {showTopStats && (
        <div className={cn("top-stats-container w-full flex justify-between bg-transparent", className, {
          "animate-slide-up": isActive || isFinished
        })}>
          {/* Left aligned current typing stats */}
          <div className="left-stats flex gap-6">
            {/* WPM */}
            <StatDisplay value={stats.wpm} label="wpm" />
            
            {/* Accuracy */}
            <StatDisplay value={`${stats.accuracy}%`} label="acc" />
            
            {/* Time */}
            <StatDisplay value={formatTime(stats.elapsedTime)} label="time" />
            
            {/* Status */}
            <StatDisplay value={getStatus()} label="status" />
            
            {/* Repeat count */}
            <StatDisplay value={0} label="repeat" />
          </div>
          
          {/* Right aligned career stats - only shown when signed in */}
          {showCareerStats && (
            <div className="right-stats flex gap-6">
              {/* Highest WPM */}
              <StatDisplay value={highestWpm} label="wpm" />
              
              {/* Times typed */}
              <StatDisplay value={timesTyped} label="typed" />
            </div>
          )}
        </div>
      )}
      
      {/* Bottom Stats Box - contains voting and times typed info */}
      {showBottomStats && (
        <div className="bottom-stats-container w-full flex justify-between items-center bg-transparent text-monkey-subtle">
          {/* Left aligned voting section */}
          <div className="votes-section flex items-center gap-2">
            <button 
              onClick={onUpvote} 
              className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-accent p-0 h-auto"
              aria-label="Upvote"
            >
              <ThumbsUp size={16} /> <span>{upvotes}</span>
            </button>
            <button 
              onClick={onDownvote} 
              className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-error p-0 h-auto"
              aria-label="Downvote"
            >
              <ThumbsDown size={16} /> <span>{downvotes}</span>
            </button>
          </div>
          
          {/* Right aligned people typed this */}
          <div className="typed-count text-xs flex items-center">
            <Users size={12} className="mr-1" />
            {timesTyped} people typed this
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
