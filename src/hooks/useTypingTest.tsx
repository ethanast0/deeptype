import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Character, 
  Word, 
  TypingStats, 
  calculateWPM, 
  calculateAccuracy, 
  defaultQuotes,
  CharacterState
} from '../utils/typingUtils';
import { useAuth } from '../contexts/AuthContext';
import { typingHistoryService } from '../services/typingHistoryService';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface UseTypingTestProps {
  quotes?: string[];
  scriptId?: string | null;
}

interface ScriptQuote { // Define interface for script quotes
  id: string;
  content: string;
}

const useTypingTest = ({ quotes = defaultQuotes, scriptId }: UseTypingTestProps = {}) => {
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    elapsedTime: 0,
  });
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  
  // --- New state for script handling ---
  const [scriptQuotes, setScriptQuotes] = useState<ScriptQuote[]>([]);
  const [currentScriptQuoteIndex, setCurrentScriptQuoteIndex] = useState<number>(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isScriptComplete, setIsScriptComplete] = useState<boolean>(false); // For Step 6
  // ------------------------------------

  const { user } = useAuth();
  const { toast } = useToast();
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRecordedRef = useRef<boolean>(false);

  // 1. Define primitive functions first that don't depend on other callbacks
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) return;
    
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        setStats(prev => {
          return {
            ...prev,
            elapsedTime,
            wpm: calculateWPM(prev.correctChars, elapsedTime)
          };
        });
      }
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 2. Quote stats updating (independent function)
  const updateQuoteStats = async (quoteId: string, wpm: number, accuracy: number) => {
    try {
      // Fixed RPC call to increment function
      const { data: incrementResult, error: incrementError } = await supabase.rpc(
        'increment',
        { 
          row_id: quoteId, 
          table_name: 'script_quotes', 
          column_name: 'typed_count' 
        }
      );

      if (incrementError) {
        console.error('Error incrementing typed count:', incrementError);
      }

      // Update other stats directly
      const { error: updateError } = await supabase
        .from('script_quotes')
        .update({
          avg_wpm: wpm,
          avg_accuracy: accuracy,
          best_wpm: wpm
        })
        .eq('id', quoteId);
        
      if (updateError) {
        console.error('Error updating quote stats:', updateError);
      }
    } catch (error) {
      console.error('Error updating quote stats:', error);
    }
  };

  // 3. Process quote (doesn't depend on other callbacks)
  const processQuote = useCallback((quote: string) => {
    const rawWords = quote.split(' ');
    const processedWords: Word[] = rawWords.map((word, wordIndex) => {
      const characters: Character[] = [...word].map((char) => ({
        char,
        state: 'inactive' as CharacterState,
      }));

      // Add space character if it's not the last word
      if (wordIndex < rawWords.length - 1) {
        characters.push({ char: ' ', state: 'inactive' });
      }

      return { characters };
    });

    // Set the first character of the first word to 'current'
    if (processedWords.length > 0 && processedWords[0].characters.length > 0) {
      processedWords[0].characters[0].state = 'current';
    }

    setWords(processedWords);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);

    // Recalculate total characters including spaces between words
    const totalChars = quote.length;
    setStats(prev => ({ ...prev, totalChars }));
  }, []);

  // 4. Define resetTest (depends on stopTimer and focusInput)
  const resetTest = useCallback((preserveQuote: boolean = false) => {
    stopTimer();
    setIsActive(false);
    setIsFinished(false);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    startTimeRef.current = null;
    resultRecordedRef.current = false;
    setStats(prev => ({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: preserveQuote ? prev.totalChars : currentQuote.length,
      elapsedTime: 0,
    }));

    if (!preserveQuote) {
      setWords([]);
    } else {
      setWords(prevWords => {
        if (prevWords.length === 0) return [];
        const resetWords = prevWords.map(word => ({
          characters: word.characters.map(char => ({
            ...char,
            state: 'inactive' as CharacterState
          }))
        }));
        if (resetWords.length > 0 && resetWords[0].characters.length > 0) {
          resetWords[0].characters[0].state = 'current';
        }
        return resetWords;
      });
    }
    focusInput();
  }, [stopTimer, focusInput, currentQuote.length]);

  // 5. Define loadQuoteByIndex (depends on processQuote and resetTest)
  const loadQuoteByIndex = useCallback((index: number) => {
    if (scriptQuotes.length > 0 && index >= 0 && index < scriptQuotes.length) {
      const quoteData = scriptQuotes[index];
      setCurrentQuote(quoteData.content);
      setCurrentQuoteId(quoteData.id);
      processQuote(quoteData.content);
      setCurrentScriptQuoteIndex(index);
      resetTest(false);
      resultRecordedRef.current = false;
      setIsScriptComplete(false);
    } else {
      console.error("Invalid index or script quotes not loaded");
    }
  }, [scriptQuotes, processQuote, resetTest]);

  // 6. Define loadNewQuote (depends on processQuote and resetTest)
  const loadNewQuote = useCallback(async () => {
    if (scriptId) {
      // If in script mode and not at the end, load next quote
      if (isScriptLoaded && currentScriptQuoteIndex < scriptQuotes.length - 1) {
        loadQuoteByIndex(currentScriptQuoteIndex + 1);
      } else {
        // Otherwise load a random quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        setCurrentQuote(quote);
        setCurrentQuoteId(null);
        processQuote(quote);
        resetTest(false);
        resultRecordedRef.current = false;
      }
    } else {
      // Not in script mode, load random quote
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const quote = quotes[randomIndex];
      setCurrentQuote(quote);
      setCurrentQuoteId(null);
      processQuote(quote);
      resetTest(false);
      resultRecordedRef.current = false;
    }
  }, [quotes, processQuote, resetTest, scriptId, isScriptLoaded, currentScriptQuoteIndex, scriptQuotes, loadQuoteByIndex]);

  // 7. Define loadNextQuote for script progression (depends on loadQuoteByIndex and loadNewQuote)
  const loadNextQuote = useCallback(() => {
    if (isScriptLoaded && currentScriptQuoteIndex < scriptQuotes.length - 1) {
      // Move to next quote in script
      loadQuoteByIndex(currentScriptQuoteIndex + 1);
    } else if (isScriptLoaded && currentScriptQuoteIndex === scriptQuotes.length - 1) {
      // End of script reached
      console.log("Script finished!");
      setIsScriptComplete(true);
      setIsFinished(true);
      setIsActive(false);
      stopTimer();
      toast({
        title: "Script Complete!",
        description: "You finished all quotes in this script.",
      });
    } else {
      // Not in script mode or at end of script, load random quote
      loadNewQuote();
    }
  }, [
    isScriptLoaded,
    currentScriptQuoteIndex,
    scriptQuotes.length,
    loadQuoteByIndex,
    loadNewQuote,
    stopTimer,
    toast
  ]);

  // 8. Define handleRedo
  const handleRedo = useCallback(() => {
    resetTest(true); // Preserve quote content
  }, [resetTest]);

  // 9. Script Completion Celebration Effect
  useEffect(() => {
    if (isScriptComplete) {
      console.log("Triggering script completion celebration effect.");
      toast({
        title: "Script Complete!",
        description: "Congratulations! You finished all quotes in this script.",
        duration: 5000,
      });
    }
  }, [isScriptComplete, toast]);

  // 10. Effect to handle record history
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
            toast({
              title: "Progress saved",
              description: `Your typing result of ${Math.round(stats.wpm)} WPM has been recorded.`,
            });
            
            if (currentQuoteId) {
              await updateQuoteStats(currentQuoteId, stats.wpm, stats.accuracy);
            }
          } else {
            console.error('Failed to record typing session');
            toast({
              title: "Error saving progress",
              description: "Unable to save your typing results.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error recording typing history:', error);
          toast({
            title: "Error saving progress",
            description: "An error occurred while saving your typing results.",
            variant: "destructive"
          });
        }
      }
    };
    
    recordHistory();
  }, [isFinished, user, scriptId, stats.wpm, stats.accuracy, toast, currentQuoteId, stats.elapsedTime]);

  // 11. Effect to initialize quotes
  useEffect(() => {
    const initialize = async () => {
      if (scriptId) {
        try {
          console.log(`Fetching quotes for script ID: ${scriptId}`);
          const { data, error } = await supabase
            .from('script_quotes')
            .select('id, content')
            .eq('script_id', scriptId)

          if (error) throw error;

          if (data && data.length > 0) {
            console.log(`Loaded ${data.length} quotes for script.`);
            setScriptQuotes(data);
            setIsScriptLoaded(true);
            loadQuoteByIndex(0); // Load the first quote
          } else {
            console.warn(`No quotes found for script ID: ${scriptId}. Loading random quote.`);
            setIsScriptLoaded(false);
            loadNewQuote();
          }
        } catch (error) {
          console.error('Error loading script quotes:', error);
          toast({ title: "Error", description: "Could not load script quotes.", variant: "destructive" });
          setIsScriptLoaded(false);
          loadNewQuote();
        }
      } else if (quotes.length > 0) {
        setIsScriptLoaded(false);
        loadNewQuote();
      }
    };
    
    // Delay the initialization to avoid the circular dependency issue
    setTimeout(() => {
      initialize();
    }, 0);
  }, [scriptId, quotes, loadQuoteByIndex, loadNewQuote, toast]);

  // 12. KeyDown Handler for Shift+Enter (to call loadNewQuote)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        loadNewQuote(); // Use loadNewQuote for backward compatibility
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote]);

  // 13. Input handler
  const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = event.target.value;
    const typedChar = typedValue.slice(-1);
    event.target.value = ''; // Clear input after processing

    if (isFinished || !words[currentWordIndex]) return;

    if (!isActive) {
      setIsActive(true);
      startTimer();
    }

    const currentWord = words[currentWordIndex];
    const currentCharacter = currentWord.characters[currentCharIndex];

    let newCorrectChars = stats.correctChars;
    let newIncorrectChars = stats.incorrectChars;
    let newWords = [...words];
    let nextCharIndex = currentCharIndex + 1;
    let nextWordIndex = currentWordIndex;

    if (typedChar === currentCharacter.char) {
      newCorrectChars++;
      newWords[currentWordIndex].characters[currentCharIndex].state = 'correct';
    } else {
      newIncorrectChars++;
      newWords[currentWordIndex].characters[currentCharIndex].state = 'incorrect';
    }

    // Move to the next character/word
    if (nextCharIndex === currentWord.characters.length) {
      // End of word
      if (nextWordIndex === words.length - 1) {
        // End of quote
        setIsFinished(true);
        setIsActive(false);
        stopTimer();
      } else {
        // Move to next word
        nextWordIndex++;
        nextCharIndex = 0;
      }
    }

    // Set next character state to 'current' if not finished
    if (!isFinished && newWords[nextWordIndex] && newWords[nextWordIndex].characters[nextCharIndex]) {
      newWords[nextWordIndex].characters[nextCharIndex].state = 'current';
    }

    setWords(newWords);
    setCurrentCharIndex(nextCharIndex);
    setCurrentWordIndex(nextWordIndex);

    const elapsedTime = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : stats.elapsedTime;
    setStats({
      ...stats,
      correctChars: newCorrectChars,
      incorrectChars: newIncorrectChars,
      wpm: calculateWPM(newCorrectChars, elapsedTime),
      accuracy: calculateAccuracy(newCorrectChars, newIncorrectChars),
      elapsedTime
    });
  }, [
    isActive,
    isFinished,
    words,
    currentWordIndex,
    currentCharIndex,
    stats,
    startTimer,
    stopTimer
  ]);

  return {
    words,
    stats,
    isActive,
    isFinished,
    inputRef,
    handleInput,
    // Original function with the same name for backward compatibility
    loadNewQuote,
    // Function for script progression UI
    loadNextQuote,
    // Function for resetting test (was resetTest before)
    handleRedo,
    focusInput,
    currentWordIndex,
    currentCharIndex,
    // Script progress tracking
    currentScriptQuoteIndex,
    totalScriptQuotes: scriptQuotes.length,
    isScriptLoaded,
    isScriptComplete
  };
};

export default useTypingTest;
