
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

interface ScriptQuote {
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
  
  // Script handling state
  const [scriptQuotes, setScriptQuotes] = useState<ScriptQuote[]>([]);
  const [currentScriptQuoteIndex, setCurrentScriptQuoteIndex] = useState<number>(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isScriptComplete, setIsScriptComplete] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);

  const { user } = useAuth();
  const { toast } = useToast();
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRecordedRef = useRef<boolean>(false);

  // 1. Define primitive functions that don't depend on other callbacks
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
        setStats(prev => ({
          ...prev,
          elapsedTime,
          wpm: calculateWPM(prev.correctChars, elapsedTime)
        }));
      }
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 2. Process quote function
  const processQuote = useCallback((quote: string) => {
    console.log("Processing quote:", quote.substring(0, 20) + "...");
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

    // Calculate total characters including spaces between words
    const totalChars = quote.length;
    setStats(prev => ({ ...prev, totalChars }));
  }, []);

  // 3. Reset test function
  const resetTest = useCallback((preserveQuote: boolean = false) => {
    console.log("Resetting test, preserve quote:", preserveQuote);
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
      totalChars: preserveQuote ? stats.totalChars : currentQuote.length,
      elapsedTime: 0,
    });

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
  }, [stopTimer, focusInput, stats.totalChars, currentQuote.length]);

  // 4. Update quote stats function
  const updateQuoteStats = async (quoteId: string, wpm: number, accuracy: number) => {
    try {
      console.log(`Updating stats for quote ${quoteId}: ${wpm} WPM, ${accuracy}% accuracy`);
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

  // 5. Load quote by index function
  const loadQuoteByIndex = useCallback((index: number) => {
    console.log(`Loading quote at index ${index}, script quotes length: ${scriptQuotes.length}`);
    if (isQuoteLoading) {
      console.log("Already loading a quote, skipping");
      return;
    }
    
    setIsQuoteLoading(true);
    
    try {
      if (scriptQuotes.length > 0 && index >= 0 && index < scriptQuotes.length) {
        const quoteData = scriptQuotes[index];
        console.log(`Quote data found: ${quoteData.content.substring(0, 20)}...`);
        setCurrentQuote(quoteData.content);
        setCurrentQuoteId(quoteData.id);
        processQuote(quoteData.content);
        setCurrentScriptQuoteIndex(index);
        resetTest(false);
        resultRecordedRef.current = false;
        setIsScriptComplete(false);
      } else {
        console.error(`Invalid index ${index} or script quotes not loaded (length: ${scriptQuotes.length})`);
        toast({
          title: "Error",
          description: "Could not load quote. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in loadQuoteByIndex:", error);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [scriptQuotes, processQuote, resetTest, toast, isQuoteLoading]);

  // 6. Load a random new quote
  const loadRandomQuote = useCallback(() => {
    console.log("Loading random quote from quotes array:", quotes.length);
    if (isQuoteLoading) {
      console.log("Already loading a quote, skipping");
      return;
    }
    
    setIsQuoteLoading(true);
    
    try {
      if (quotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        console.log(`Selected random quote: ${quote.substring(0, 20)}...`);
        setCurrentQuote(quote);
        setCurrentQuoteId(null);
        processQuote(quote);
        resetTest(false);
        resultRecordedRef.current = false;
      } else {
        console.error("No quotes available");
        toast({
          title: "Error",
          description: "No quotes available. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in loadRandomQuote:", error);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [quotes, processQuote, resetTest, toast, isQuoteLoading]);

  // 7. Load new quote - decision function
  const loadNewQuote = useCallback(() => {
    console.log("loadNewQuote called, scriptId:", scriptId, "isScriptLoaded:", isScriptLoaded);
    
    if (isQuoteLoading) {
      console.log("Already loading a quote, skipping");
      return;
    }
    
    // If in script mode and script is loaded, load a random script quote
    if (scriptId && isScriptLoaded && scriptQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * scriptQuotes.length);
      console.log(`Loading random script quote at index ${randomIndex}`);
      loadQuoteByIndex(randomIndex);
    } else {
      // Not in script mode or script not loaded, load a random quote
      loadRandomQuote();
    }
  }, [scriptId, isScriptLoaded, scriptQuotes, loadQuoteByIndex, loadRandomQuote, isQuoteLoading]);

  // 8. Load next quote for script progression
  const loadNextQuote = useCallback(() => {
    console.log("loadNextQuote called, isScriptLoaded:", isScriptLoaded, "currentIndex:", currentScriptQuoteIndex, "total:", scriptQuotes.length);
    
    if (isQuoteLoading) {
      console.log("Already loading a quote, skipping");
      return;
    }
    
    if (isScriptLoaded && scriptQuotes.length > 0) {
      if (currentScriptQuoteIndex < scriptQuotes.length - 1) {
        // Move to next quote in script
        console.log(`Moving to next quote at index ${currentScriptQuoteIndex + 1}`);
        loadQuoteByIndex(currentScriptQuoteIndex + 1);
      } else {
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
      }
    } else {
      // Not in script mode or script not loaded
      console.log("No script loaded or not in script mode, loading random quote");
      loadRandomQuote();
    }
  }, [
    isScriptLoaded,
    scriptQuotes,
    currentScriptQuoteIndex,
    loadQuoteByIndex,
    stopTimer,
    toast,
    loadRandomQuote,
    isQuoteLoading
  ]);

  // 9. Handle redo function
  const handleRedo = useCallback(() => {
    console.log("Redoing test with same quote");
    resetTest(true); // Preserve quote content
  }, [resetTest]);

  // 10. Input handler for typing
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

    if (!currentCharacter) {
      console.error("Current character is undefined", { currentWordIndex, currentCharIndex });
      return;
    }

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

  // 11. Effect to handle finishing a test and recording history
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
            elapsedTime: stats.elapsedTime,
            quoteId: currentQuoteId
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
  }, [isFinished, user, scriptId, stats, toast, currentQuoteId]);

  // 12. Effect to load script quotes
  useEffect(() => {
    const fetchScriptQuotes = async () => {
      if (!scriptId) return;
      
      setIsQuoteLoading(true);
      console.log(`Fetching quotes for script ID: ${scriptId}`);
      
      try {
        const { data, error } = await supabase
          .from('script_quotes')
          .select('id, content')
          .eq('script_id', scriptId);

        if (error) throw error;

        if (data && data.length > 0) {
          console.log(`Loaded ${data.length} quotes for script.`);
          setScriptQuotes(data);
          setIsScriptLoaded(true);
          return data;
        } else {
          console.warn(`No quotes found for script ID: ${scriptId}`);
          setIsScriptLoaded(false);
          return null;
        }
      } catch (error) {
        console.error('Error loading script quotes:', error);
        toast({ 
          title: "Error", 
          description: "Could not load script quotes.", 
          variant: "destructive" 
        });
        setIsScriptLoaded(false);
        return null;
      } finally {
        setIsQuoteLoading(false);
      }
    };

    const initialize = async () => {
      if (isInitialized) return;
      
      console.log("Initializing typing test");
      
      if (scriptId) {
        const data = await fetchScriptQuotes();
        if (data && data.length > 0) {
          console.log("Script quotes loaded, loading first quote");
          loadQuoteByIndex(0);
        } else {
          console.log("No script quotes found, loading random quote");
          loadRandomQuote();
        }
      } else if (quotes.length > 0) {
        console.log("No script ID provided, loading random quote from props");
        loadRandomQuote();
      }
      
      setIsInitialized(true);
    };
    
    initialize();
  }, [scriptId, quotes, toast, isInitialized, loadQuoteByIndex, loadRandomQuote]);

  // 13. KeyDown Handler for Shift+Enter (to call loadNewQuote)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        loadNewQuote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote]);

  // 14. Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    words,
    stats,
    isActive,
    isFinished,
    inputRef,
    handleInput,
    loadNewQuote,
    loadNextQuote,
    handleRedo,
    focusInput,
    currentWordIndex,
    currentCharIndex,
    currentScriptQuoteIndex,
    totalScriptQuotes: scriptQuotes.length,
    isScriptLoaded,
    isScriptComplete,
    isQuoteLoading
  };
};

export default useTypingTest;
