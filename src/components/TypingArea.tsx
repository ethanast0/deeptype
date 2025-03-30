
import React, { useEffect, useState } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import TypingDisplay from './typing/TypingDisplay';
import TypingControls from './typing/TypingControls';

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
            .select('speed_wpm')
            .eq('script_id', scriptId)
            .order('speed_wpm', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          // Fetch votes using RPC
          const { data: upvotesData, error: upvotesError } = await supabase
            .rpc('count_script_votes', { 
              script_id: scriptId, 
              vote_type: 'upvote' 
            });
          
          const { data: downvotesData, error: downvotesError } = await supabase
            .rpc('count_script_votes', { 
              script_id: scriptId, 
              vote_type: 'downvote' 
            });
            
          if (!historyError && typingHistory) {
            setScriptStats(prev => ({
              ...prev,
              timesTyped: typingHistory.length
            }));
          }
          
          if (!wpmError && highestWpmData) {
            setScriptStats(prev => ({
              ...prev, 
              highestWpm: highestWpmData.speed_wpm
            }));
          }
          
          if (!upvotesError && upvotesData !== null) {
            setScriptStats(prev => ({
              ...prev,
              upvotes: upvotesData as number
            }));
          }
          
          if (!downvotesError && downvotesData !== null) {
            setScriptStats(prev => ({
              ...prev,
              downvotes: downvotesData as number
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
      
      // First check if user already voted using RPC
      const { data: existingVote } = await supabase
        .rpc('check_user_vote', { 
          p_user_id: user.id, 
          p_script_id: scriptId 
        });
        
      if (existingVote) {
        // Update vote if it exists
        await supabase
          .rpc('update_user_vote', {
            p_user_id: user.id,
            p_script_id: scriptId,
            p_vote_type: voteType
          });
            
        setScriptStats(prev => ({
          ...prev,
          upvotes: isUpvote ? prev.upvotes + 1 : prev.upvotes - 1,
          downvotes: isUpvote ? prev.downvotes - 1 : prev.downvotes + 1
        }));
      } else {
        // Insert new vote
        await supabase
          .rpc('insert_user_vote', {
            p_user_id: user.id,
            p_script_id: scriptId,
            p_vote_type: voteType
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

  return (
    <div className={cn("typing-area-container", className)}>
      <Stats 
        stats={stats} 
        isActive={isActive} 
        isFinished={isFinished} 
        highestWpm={scriptStats.highestWpm}
        timesTyped={scriptStats.timesTyped}
        showCareerStats={!!user}
        showBottomStats={false}
      />
      
      <TypingDisplay
        words={words}
        currentWordIndex={currentWordIndex}
        currentCharIndex={currentCharIndex}
        focusInput={focusInput}
        inputRef={inputRef}
        handleInput={handleInput}
      />
      
      {/* Bottom stats box placed here, below typing area with minimal gap */}
      <div className="mt-2">
        <Stats
          showTopStats={false}
          upvotes={scriptStats.upvotes}
          downvotes={scriptStats.downvotes}
          onUpvote={() => handleVote(true)}
          onDownvote={() => handleVote(false)}
          timesTyped={scriptStats.timesTyped}
        />
      </div>
      
      <TypingControls
        resetTest={resetTest}
        loadNewQuote={loadNewQuote}
      />
    </div>
  );
};

export default TypingArea;
