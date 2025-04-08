
import { useState, useEffect, useRef, useCallback } from 'react';
import { Character, Word, TypingStats, defaultQuotes } from '../../utils/typingUtils';
import { useAuth } from '../../contexts/AuthContext';
import { typingHistoryService } from '../../services/typingHistoryService';
import useTypingFocus from './useTypingFocus';
import useTypingInput from './useTypingInput';
import useTypingQuotes from './useTypingQuotes';
import useTypingStats from './useTypingStats';
import useTypingShortcuts from './useTypingShortcuts';
import { updateQuoteStats } from './updateQuoteStats';
import { supabase } from '../../integrations/supabase/client'; // Add missing import

interface UseTypingTestProps {
  quotes?: string[];
  scriptId?: string | null;
  onQuoteComplete?: (stats?: TypingStats) => void;
  deathMode?: boolean;
  repeatMode?: boolean;
}

const useTypingTest = ({ 
  quotes = defaultQuotes, 
  scriptId, 
  onQuoteComplete,
  deathMode = false,
  repeatMode = false
}: UseTypingTestProps = {}) => {
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [completedQuotes, setCompletedQuotes] = useState<number>(0);
  const [deathModeFailures, setDeathModeFailures] = useState<number>(0);
  const [zenMode, setZenMode] = useState<boolean>(false);

  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const resultRecordedRef = useRef<boolean>(false);
  const processedQuotesRef = useRef<Set<string>>(new Set());

  // Use the focused hooks for specific functionality
  const { stats, setStats, startTimer, stopTimer } = useTypingStats();
  
  const { focusInput } = useTypingFocus({
    inputRef,
    currentCharIndex
  });

  const { processQuote, loadNewQuote } = useTypingQuotes({
    quotes,
    scriptId,
    currentQuote,
    setCurrentQuote,
    words,
    setWords,
    setStats,
    processedQuotesRef,
    setCurrentQuoteId,
    setCompletedQuotes,
    currentWordIndex,
    setCurrentWordIndex,
    setCurrentCharIndex
  });

  const resetTest = useCallback(() => {
    console.log("Resetting test");
    stopTimer();
    setIsActive(false);
    setIsFinished(false);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    startTimeRef.current = null;
    resultRecordedRef.current = false;
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: currentQuote.length,
      elapsedTime: 0,
    });
    
    setWords(prevWords => {
      return prevWords.map((word, wordIdx) => ({
        characters: word.characters.map((char, charIdx) => ({
          ...char,
          state: wordIdx === 0 && charIdx === 0 ? 'current' : 'inactive'
        }))
      }));
    });
    
    focusInput();
  }, [currentQuote, stopTimer, focusInput, setStats]);

  const deathModeReset = useCallback(() => {
    if (deathMode) {
      setDeathModeFailures(prev => prev + 1);
      resetTest();
      focusInput(100);
    }
  }, [deathMode, resetTest, focusInput]);

  // Use typing input handler hook
  const { handleInput, findLastCorrectPosition, smartBackspace } = useTypingInput({
    words,
    setWords,
    currentWordIndex,
    setCurrentWordIndex,
    currentCharIndex,
    setCurrentCharIndex,
    isActive,
    setIsActive,
    isFinished,
    setIsFinished,
    startTimer,
    stopTimer,
    stats,
    setStats,
    inputRef,
    deathMode,
    deathModeReset
  });

  // Set up keyboard shortcuts
  useTypingShortcuts({
    loadNewQuote,
    smartBackspace,
    focusInput,
    handleResetTest: resetTest,
    toggleZenMode: () => setZenMode(prev => !prev),
    isActive,
    isFinished
  });

  // Initial quote loading
  useEffect(() => {
    if (quotes.length > 0 && currentQuote === '') {
      loadNewQuote();
    }
  }, [quotes, loadNewQuote, currentQuote]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        stopTimer();
      }
    };
  }, [stopTimer]);

  // Record history when finished
  useEffect(() => {
    const recordHistory = async () => {
      if (isFinished && user && scriptId && !resultRecordedRef.current) {
        resultRecordedRef.current = true;
        try {
          console.log('Recording typing session:', {
            userId: user.id,
            scriptId,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            elapsedTime: stats.elapsedTime
          });
          
          const roundedElapsedTime = Math.round(stats.elapsedTime);
          
          const success = await typingHistoryService.recordSession(
            user.id,
            scriptId,
            stats.wpm,
            stats.accuracy,
            roundedElapsedTime,
            currentQuoteId || undefined
          );
          
          if (success) {
            if (currentQuoteId) {
              await updateQuoteStats(currentQuoteId, stats.wpm, stats.accuracy);
            }
            
            const newCompletedQuotes = completedQuotes + 1;
            setCompletedQuotes(newCompletedQuotes);
            
            if (onQuoteComplete) {
              onQuoteComplete(stats);
            }

            if (repeatMode) {
              setTimeout(() => {
                resetTest();
                focusInput();
              }, 500);
            }
          } else {
            console.error('Failed to record typing session');
          }
        } catch (error) {
          console.error('Error recording typing history:', error);
        }
      }
    };
    
    recordHistory();
  }, [isFinished, user, scriptId, stats, currentQuoteId, completedQuotes, onQuoteComplete, repeatMode, resetTest, focusInput]);

  // Toggle zen mode
  const toggleZenMode = useCallback(() => {
    setZenMode(prev => !prev);
    
    // Dispatch custom event for components to respond to zen mode changes
    const zenModeEvent = new CustomEvent('zenModeChange', { detail: { zenMode: !zenMode } });
    window.dispatchEvent(zenModeEvent);
    
    // Update body class for global styling
    if (!zenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    
    // Focus after toggling to ensure typing can continue
    setTimeout(() => focusInput(), 50);
  }, [zenMode, focusInput]);

  // Update body class when zenMode changes
  useEffect(() => {
    if (zenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    
    return () => {
      document.body.classList.remove('zen-mode');
    };
  }, [zenMode]);

  // Handle deathMode and repeatMode changes
  useEffect(() => {
    if ((deathMode || repeatMode) && isFinished) {
      resetTest();
    }
  }, [deathMode, repeatMode, isFinished, resetTest]);

  return {
    words,
    stats,
    isActive,
    isFinished,
    currentWordIndex,
    currentCharIndex,
    inputRef,
    handleInput,
    resetTest,
    loadNewQuote,
    focusInput,
    deathMode,
    deathModeFailures,
    zenMode,
    toggleZenMode,
    shortcuts: {
        focus: 'Shift + Space',
        newQuote: 'Shift + Enter',
        backspace: 'Backspace',
        reset: 'Shift + Delete',
        zenMode: 'Ctrl + Z'
    }
  };
};

export default useTypingTest;
