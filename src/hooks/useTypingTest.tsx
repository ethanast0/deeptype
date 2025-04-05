import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Character, 
  Word, 
  TypingStats, 
  calculateWPM, 
  calculateAccuracy, 
  defaultQuotes 
} from '../utils/typingUtils';
import { useAuth } from '../contexts/AuthContext';
import { typingHistoryService } from '../services/typingHistoryService';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface UseTypingTestProps {
  quotes?: string[];
  scriptId?: string | null;
  onQuoteComplete?: () => void;
  deathMode?: boolean;
}

const useTypingTest = ({ 
  quotes = defaultQuotes, 
  scriptId, 
  onQuoteComplete,
  deathMode = false
}: UseTypingTestProps = {}) => {
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
  const [completedQuotes, setCompletedQuotes] = useState<number>(0);
  const [scriptWpm, setScriptWpm] = useState<number>(0);
  const [hasCompletedScript, setHasCompletedScript] = useState<boolean>(false);
  const [scriptWpmValues, setScriptWpmValues] = useState<number[]>([]);
  const [shouldLoadNewQuote, setShouldLoadNewQuote] = useState<boolean>(false);
  const [deathModeFailures, setDeathModeFailures] = useState<number>(0);

  const { user } = useAuth();
  const { toast } = useToast();
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRecordedRef = useRef<boolean>(false);
  const processedQuotesRef = useRef<Set<string>>(new Set());

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

  const resetTest = useCallback(() => {
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
  }, [currentQuote, stopTimer]);

  const deathModeReset = useCallback(() => {
    if (deathMode) {
      setDeathModeFailures(prev => prev + 1);
      
      toast({
        title: "Death Mode Failure",
        description: `Try again! Attempt #${deathModeFailures + 1}`,
        variant: "destructive",
      });
      
      resetTest();
    }
  }, [deathMode, deathModeFailures, resetTest, toast]);

  const processQuote = useCallback((quote: string) => {
    const processedWords: Word[] = quote.split(' ').map(word => ({
      characters: [...word].map((char, idx) => ({
        char,
        state: idx === 0 && currentWordIndex === 0 ? 'current' : 'inactive'
      }))
    }));
    
    setWords(processedWords);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    
    const totalChars = quote.length;
    setStats(prev => ({ ...prev, totalChars }));
  }, [currentWordIndex]);

  const loadNewQuote = useCallback(async () => {
    setCurrentQuoteId(null);
    
    if (scriptId) {
      try {
        const { data, error } = await supabase
          .from('script_quotes')
          .select('id, content')
          .eq('script_id', scriptId);
          
        if (error || !data || data.length === 0) {
          console.error('Error loading quotes or no quotes found:', error);
          const randomIndex = Math.floor(Math.random() * quotes.length);
          const quote = quotes[randomIndex];
          setCurrentQuote(quote);
          processQuote(quote);
        } else {
          const availableQuotes = data.filter(quote => !processedQuotesRef.current.has(quote.id));
          
          if (availableQuotes.length === 0) {
            processedQuotesRef.current.clear();
            setCompletedQuotes(0);
            setScriptWpmValues([]);
            setHasCompletedScript(false);
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomQuote = data[randomIndex];
            setCurrentQuote(randomQuote.content);
            setCurrentQuoteId(randomQuote.id);
            processQuote(randomQuote.content);
          } else {
            const randomIndex = Math.floor(Math.random() * availableQuotes.length);
            const randomQuote = availableQuotes[randomIndex];
            setCurrentQuote(randomQuote.content);
            setCurrentQuoteId(randomQuote.id);
            processQuote(randomQuote.content);
            processedQuotesRef.current.add(randomQuote.id);
          }
        }
      } catch (error) {
        console.error('Error loading quote from database:', error);
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        setCurrentQuote(quote);
        processQuote(quote);
      }
    } else {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const quote = quotes[randomIndex];
      setCurrentQuote(quote);
      processQuote(quote);
    }
    
    resetTest();
    focusInput();
    resultRecordedRef.current = false;
    setShouldLoadNewQuote(false);
  }, [quotes, scriptId, processQuote, resetTest, focusInput]);

  const findLastCorrectPosition = useCallback(() => {
    const currentWord = words[currentWordIndex];
    if (!currentWord) return { wordIndex: 0, charIndex: 0 };
    
    let hasErrors = false;
    let lastCorrectCharIndex = 0;
    
    for (let i = 0; i < currentWord.characters.length; i++) {
      if (i < currentCharIndex) {
        if (currentWord.characters[i].state === 'correct') {
          lastCorrectCharIndex = i + 1;
        } else if (currentWord.characters[i].state === 'incorrect') {
          hasErrors = true;
        }
      }
    }
    
    return {
      hasErrors,
      wordIndex: currentWordIndex,
      charIndex: lastCorrectCharIndex
    };
  }, [words, currentWordIndex, currentCharIndex]);

  const smartBackspace = useCallback(() => {
    if (currentWordIndex > 0 && currentCharIndex === 0) {
      const prevWordIndex = currentWordIndex - 1;
      const prevWordLength = words[prevWordIndex].characters.length;
      
      setCurrentWordIndex(prevWordIndex);
      setCurrentCharIndex(prevWordLength);
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        
        if (prevWordLength > 0) {
          newWords[prevWordIndex].characters[prevWordLength - 1].state = 'current';
        }
        
        return newWords;
      });
      
      return;
    }
    
    const { hasErrors, charIndex } = findLastCorrectPosition();
    
    if (hasErrors && charIndex < currentCharIndex) {
      setCurrentCharIndex(charIndex);
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        
        for (let i = charIndex; i < newWords[currentWordIndex].characters.length; i++) {
          if (i === charIndex) {
            newWords[currentWordIndex].characters[i].state = 'current';
          } else {
            newWords[currentWordIndex].characters[i].state = 'inactive';
          }
        }
        
        return newWords;
      });
    } else if (currentCharIndex > 0) {
      setCurrentCharIndex(prev => prev - 1);
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        if (currentCharIndex > 0) {
          newWords[currentWordIndex].characters[currentCharIndex - 1].state = 'current';
          
          if (currentCharIndex < newWords[currentWordIndex].characters.length) {
            newWords[currentWordIndex].characters[currentCharIndex].state = 'inactive';
          }
        }
        return newWords;
      });
      
      if (currentCharIndex > 0 && currentCharIndex <= words[currentWordIndex].characters.length) {
        const charState = words[currentWordIndex].characters[currentCharIndex - 1].state;
        
        setStats(prev => {
          const newStats = { ...prev };
          
          if (charState === 'correct') {
            newStats.correctChars = Math.max(0, prev.correctChars - 1);
          } else if (charState === 'incorrect') {
            newStats.incorrectChars = Math.max(0, prev.incorrectChars - 1);
          }
          
          newStats.accuracy = calculateAccuracy(
            newStats.correctChars,
            newStats.incorrectChars
          );
          
          return newStats;
        });
      }
    }
  }, [currentCharIndex, currentWordIndex, words, findLastCorrectPosition]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    if (!isActive && !isFinished) {
      setIsActive(true);
      startTimer();
    }
    
    e.target.value = '';
    
    const typedChar = input.charAt(input.length - 1);
    if (!typedChar) return;
    
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;
    
    if (typedChar === ' ') {
      if (currentCharIndex === currentWord.characters.length) {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          
          setStats(prev => ({
            ...prev,
            correctChars: prev.correctChars + 1,
            accuracy: calculateAccuracy(
              prev.correctChars + 1, 
              prev.incorrectChars
            )
          }));
          
          setWords(prevWords => {
            const newWords = [...prevWords];
            
            if (newWords[currentWordIndex + 1]?.characters.length > 0) {
              newWords[currentWordIndex + 1].characters[0].state = 'current';
            }
            
            return newWords;
          });
        }
      } else {
        setStats(prev => ({
          ...prev,
          incorrectChars: prev.incorrectChars + 1,
          accuracy: calculateAccuracy(
            prev.correctChars,
            prev.incorrectChars + 1
          )
        }));

        if (deathMode) {
          deathModeReset();
        }
      }
      return;
    }
    
    if (currentCharIndex < currentWord.characters.length) {
      const currentChar = currentWord.characters[currentCharIndex];
      
      const isCorrect = typedChar === currentChar.char;
      
      if (deathMode && !isCorrect) {
        deathModeReset();
        return;
      }
      
      setStats(prev => ({
        ...prev,
        correctChars: prev.correctChars + (isCorrect ? 1 : 0),
        incorrectChars: prev.incorrectChars + (isCorrect ? 0 : 1),
        accuracy: calculateAccuracy(
          prev.correctChars + (isCorrect ? 1 : 0), 
          prev.incorrectChars + (isCorrect ? 0 : 1)
        )
      }));
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        
        newWords[currentWordIndex].characters[currentCharIndex].state = isCorrect ? 'correct' : 'incorrect';
        
        if (currentCharIndex < currentWord.characters.length - 1) {
          newWords[currentWordIndex].characters[currentCharIndex + 1].state = 'current';
        } else if (currentWordIndex === words.length - 1 && 
                   currentCharIndex === currentWord.characters.length - 1) {
          setIsFinished(true);
          stopTimer();
        }
        
        return newWords;
      });
      
      setCurrentCharIndex(prev => prev + 1);
    }
  }, [currentCharIndex, currentWordIndex, isActive, isFinished, startTimer, stopTimer, words, deathMode, deathModeReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        loadNewQuote();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        smartBackspace();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote, smartBackspace]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (quotes.length > 0 && currentQuote === '') {
      loadNewQuote();
    }
  }, [quotes, loadNewQuote, currentQuote]);

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

            setScriptWpmValues(prev => [...prev, stats.wpm]);
            
            const newCompletedQuotes = completedQuotes + 1;
            setCompletedQuotes(newCompletedQuotes);
            
            if (onQuoteComplete) {
              onQuoteComplete();
            }
            
            if (newCompletedQuotes >= quotes.length && quotes.length > 0) {
              const avgWpm = scriptWpmValues.length > 0 
                ? scriptWpmValues.reduce((sum, wpm) => sum + wpm, 0) / scriptWpmValues.length 
                : stats.wpm;
              setScriptWpm(Math.round(avgWpm));
              setHasCompletedScript(true);
            } else {
              if (newCompletedQuotes < quotes.length) {
                setShouldLoadNewQuote(true);
              }
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
  }, [isFinished, user, scriptId, stats.wpm, stats.accuracy, toast, currentQuoteId, stats.elapsedTime, completedQuotes, quotes.length, onQuoteComplete, scriptWpmValues]);

  useEffect(() => {
    if (shouldLoadNewQuote) {
      const timer = setTimeout(() => {
        loadNewQuote();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldLoadNewQuote, loadNewQuote]);

  const updateQuoteStats = async (quoteId: string, wpm: number, accuracy: number) => {
    try {
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
    scriptWpm,
    hasCompletedScript,
    deathMode,
    deathModeFailures
  };
};

export default useTypingTest;
