
import React from 'react';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface ScriptVotingProps {
  upvotes: number;
  downvotes: number;
  timesTyped: number;
  onUpvote?: () => void;
  onDownvote?: () => void;
}

const ScriptVoting: React.FC<ScriptVotingProps> = ({
  upvotes,
  downvotes,
  timesTyped,
  onUpvote,
  onDownvote
}) => {
  return (
    <div className="bottom-stats-container w-full flex justify-between items-center bg-transparent text-monkey-subtle">
      {/* Left aligned voting section */}
      <div className="votes-section flex items-center gap-2">
        <button 
          onClick={onUpvote} 
          className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-accent p-0 h-auto"
          aria-label="Upvote"
        >
          <ThumbsUp size={16} /> <span className="text-xs">{upvotes}</span>
        </button>
        <button 
          onClick={onDownvote} 
          className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-error p-0 h-auto"
          aria-label="Downvote"
        >
          <ThumbsDown size={16} /> <span className="text-xs">{downvotes}</span>
        </button>
      </div>
      
      {/* Right aligned people typed this */}
      <div className="typed-count text-xs flex items-center">
        <Users size={12} className="mr-1" />
        {timesTyped} people typed this
      </div>
    </div>
  );
};

export default ScriptVoting;
