
import React from 'react';
import { TypingStats, formatTime } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

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
  
  return (
    <div className="stats-wrapper flex flex-col w-full gap-2">
      {/* Top Stats Box - contains current typing stats and career stats */}
      {showTopStats && (
        <div className={cn("top-stats-container w-full py-2 px-4 flex justify-between", className, {
          "animate-slide-up": isActive || isFinished
        })}>
          {/* Left aligned current typing stats */}
          <div className="left-stats flex gap-6">
            {/* WPM */}
            <div className="stat-box flex flex-col items-center">
              <div className="stat-value text-xl font-mono">
                {stats.wpm}
              </div>
              <div className="stat-label text-xs text-monkey-subtle">
                wpm
              </div>
            </div>
            
            {/* Accuracy */}
            <div className="stat-box flex flex-col items-center">
              <div className="stat-value text-xl font-mono">
                {stats.accuracy}%
              </div>
              <div className="stat-label text-xs text-monkey-subtle">
                acc
              </div>
            </div>
            
            {/* Time */}
            <div className="stat-box flex flex-col items-center">
              <div className="stat-value text-xl font-mono">
                {formatTime(stats.elapsedTime)}
              </div>
              <div className="stat-label text-xs text-monkey-subtle">
                time
              </div>
            </div>
            
            {/* Status */}
            <div className="stat-box flex flex-col items-center">
              <div className="stat-value text-xl font-mono">
                {getStatus()}
              </div>
              <div className="stat-label text-xs text-monkey-subtle">
                status
              </div>
            </div>
            
            {/* Repeat count */}
            <div className="stat-box flex flex-col items-center">
              <div className="stat-value text-xl font-mono">
                0
              </div>
              <div className="stat-label text-xs text-monkey-subtle">
                repeat
              </div>
            </div>
          </div>
          
          {/* Right aligned career stats - only shown when signed in */}
          {showCareerStats && (
            <div className="right-stats flex gap-6">
              {/* Highest WPM */}
              <div className="stat-box flex flex-col items-center">
                <div className="stat-value text-xl font-mono text-monkey-accent">
                  {highestWpm}
                </div>
                <div className="stat-label text-xs text-monkey-subtle">
                  wpm
                </div>
              </div>
              
              {/* Times typed */}
              <div className="stat-box flex flex-col items-center">
                <div className="stat-value text-xl font-mono text-monkey-accent">
                  {timesTyped}
                </div>
                <div className="stat-label text-xs text-monkey-subtle">
                  typed
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Bottom Stats Box - contains voting and times typed info */}
      {showBottomStats && (
        <div className="bottom-stats-container w-full flex justify-between items-center px-4 py-1 text-monkey-subtle">
          {/* Left aligned voting section */}
          <div className="votes-section flex items-center gap-2">
            <button 
              onClick={onUpvote} 
              className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-accent"
              aria-label="Upvote"
            >
              <ThumbsUp size={18} /> <span>{upvotes}</span>
            </button>
            <button 
              onClick={onDownvote} 
              className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-error"
              aria-label="Downvote"
            >
              <ThumbsDown size={18} /> <span>{downvotes}</span>
            </button>
          </div>
          
          {/* Right aligned people typed this */}
          <div className="typed-count text-sm">
            {timesTyped} people typed this
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
