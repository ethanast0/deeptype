
import React, { useEffect, useState } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface TypingAreaProps {
  quotes?: string[];
  className?: string;
  scriptId?: string | null;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  quotes,
  className,
  scriptId
}) => {
  const { user } = useAuth();
  const [scriptStats, setScriptStats] = useState({
    timesTyped: 0,
    highestWpm: 0,
    upvotes: 42,
    downvotes: 5
  });
  
  const {
    words,
    stats,
    isActive,
    isFinished,
    inputRef,
    handleInput,
    resetTest,
    loadNewQuote,
    focusInput,
    currentWordIndex,
    currentCharIndex
  } = useTypingTest({
    quotes,
    scriptId
  });
  
  useEffect(() => {
    focusInput();
  }, [focusInput]);
  
  useEffect(() => {
    if (scriptId) {
      const fetchScriptStats = async () => {
        try {
          // Fetch times typed
          const { data: typingHistory, error: historyError } = await supabase
            .from('typing_history')
            .select('count')
            .eq('script_id', scriptId);
            
          // Fetch highest WPM
          const { data: highestWpmData, error: wpmError } = await supabase
            .from('typing_history')
            .select('wpm')
            .eq('script_id', scriptId)
            .order('wpm', { ascending: false })
            .limit(1)
            .single();
            
          if (!historyError && typingHistory) {
            setScriptStats(prev => ({
              ...prev,
              timesTyped: typingHistory.length
            }));
          }
          
          if (!wpmError && highestWpmData) {
            setScriptStats(prev => ({
              ...prev, 
              highestWpm: highestWpmData.wpm
            }));
          }
        } catch (error) {
          console.error('Error fetching script stats:', error);
        }
      };
      
      fetchScriptStats();
    }
  }, [scriptId]);
  
  const handleVote = async (isUpvote: boolean) => {
    if (!user || !scriptId) return;
    
    try {
      const voteType = isUpvote ? 'upvote' : 'downvote';
      
      // First check if user already voted
      const { data: existingVote } = await supabase
        .from('script_votes')
        .select()
        .eq('user_id', user.id)
        .eq('script_id', scriptId)
        .single();
        
      if (existingVote) {
        // Update vote if it exists
        if (existingVote.vote_type !== voteType) {
          await supabase
            .from('script_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
            
          setScriptStats(prev => ({
            ...prev,
            upvotes: isUpvote ? prev.upvotes + 1 : prev.upvotes - 1,
            downvotes: isUpvote ? prev.downvotes - 1 : prev.downvotes + 1
          }));
        }
      } else {
        // Insert new vote
        await supabase
          .from('script_votes')
          .insert({
            user_id: user.id,
            script_id: scriptId,
            vote_type: voteType
          });
          
        setScriptStats(prev => ({
          ...prev,
          upvotes: isUpvote ? prev.upvotes + 1 : prev.upvotes,
          downvotes: isUpvote ? prev.downvotes : prev.downvotes + 1
        }));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return <div className={cn("typing-area-container", className)}>
      <Stats 
        stats={stats} 
        isActive={isActive} 
        isFinished={isFinished} 
        highestWpm={scriptStats.highestWpm}
        timesTyped={scriptStats.timesTyped}
      />
      
      <div className="typing-area flex flex-wrap text-2xl my-6" onClick={focusInput}>
        {words.map((word, wordIndex) => (
            <React.Fragment key={wordIndex}>
              {/* Word with characters */}
              <div className="flex">
                {word.characters.map((char, charIndex) => (
                  <span key={`${wordIndex}-${charIndex}`} className={cn("character", {
                    "text-monkey-accent": char.state === 'correct',
                    "text-monkey-error": char.state === 'incorrect',
                    "character-current": char.state === 'current'
                  })}>
                    {/* Show caret before current character */}
                    {wordIndex === currentWordIndex && charIndex === currentCharIndex && <span className="caret" />}
                    {char.char}
                  </span>
                ))}
              </div>
              {/* Add space between words (except for the last word) */}
              {wordIndex < words.length - 1 && <span>&nbsp;</span>}
            </React.Fragment>
          ))}
        
        {/* Hidden input to capture keystrokes */}
        <input ref={inputRef} type="text" className="typing-input" onChange={handleInput} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" aria-label="Typing input" />
      </div>
      
      <div className="flex justify-between items-center w-full mt-4 mb-8">
        <div className="votes-container flex items-center gap-2">
          <button 
            onClick={() => handleVote(true)} 
            className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-accent"
            aria-label="Upvote"
          >
            <ThumbsUp size={18} /> <span>{scriptStats.upvotes}</span>
          </button>
          <button 
            onClick={() => handleVote(false)} 
            className="vote-button flex items-center gap-1 text-monkey-subtle hover:text-monkey-error"
            aria-label="Downvote"
          >
            <ThumbsDown size={18} /> <span>{scriptStats.downvotes}</span>
          </button>
        </div>
        
        <div className="text-monkey-subtle text-sm">
          {scriptStats.timesTyped} people typed this
        </div>
        
        <div className="flex gap-4">
          <button onClick={resetTest} className="button button-accent bg-slate-850 hover:bg-slate-700 text-gray-400 font-normal text-base">redo</button>
          <button onClick={loadNewQuote} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base">new [shift + enter]</button>
        </div>
      </div>
    </div>;
};

export default TypingArea;
