
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
import { supabase } from '../integrations/supabase/client';
import { contentService, Content } from '../services/contentService';

interface UseTypingTestProps {
  level?: number;
  quotes?: string[];
  scriptId?: string | null;
  onQuoteComplete?: (stats?: TypingStats, contentId?: string) => void;
  deathMode?: boolean;
  repeatMode?: boolean;
}

const useTypingTest = ({ 
  level = 1,
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
  const [deathModeFailures, setDeathModeFailures] = useState<number>(0);
  const [meetsCriteria, setMeetsCriteria] = useState<boolean>(false);
  const [baselineWpm, setBaselineWpm] = useState<number | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [lastTypedChar, setLastTypedChar] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(''); // New state for controlled input

  const { user } = useAuth();
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRecordedRef = useRef<boolean>(false);
  const processedQuotesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        const content = await contentService.getFirstQuoteForLevel(level);
        if (content) {
          setCurrentContent(content);
          setCurrentQuote(content.content);
          setCurrentQuoteId(content.content_id);
          setCurrentQuoteIndex(content.quote_index);
          processQuote(content.content);
        } else {
          const quote = quotes[0];
          setCurrentQuote(quote);
          processQuote(quote);
        }
      } catch (error) {
        console.error("Error loading initial content:", error);
        const quote = quotes[0];
        setCurrentQuote(quote);
        processQuote(quote);
      }
    };

    loadInitialContent();
  }, [level, quotes]);

  // Improved focusInput function with better error handling and logging
  const focusInput = useCallback(() => {
    // Short timeout to ensure DOM is ready
    setTimeout(() => {
      if (inputRef.current && document.hasFocus()) {
        try {
          inputRef.current.focus();
          console.log('Input focused successfully');
        } catch (error) {
          console.error('Error focusing input:', error);
        }
      } else {
        console.warn('Could not focus input: element not found or document not focused');
      }
    }, 10);
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
    setInputValue(''); // Reset input value
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
    
    // Focus input after reset
    focusInput();
  }, [currentQuote, stopTimer, focusInput]);

  const deathModeReset = useCallback(() => {
    if (deathMode) {
      setDeathModeFailures(prev => prev + 1);
      resetTest();
    }
  }, [deathMode, resetTest]);

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
    try {
      if (currentContent) {
        const nextContent = await contentService.getNextQuote(level, currentContent.quote_index);
        
        if (nextContent) {
          setCurrentContent(nextContent);
          setCurrentQuote(nextContent.content);
          setCurrentQuoteId(nextContent.content_id);
          setCurrentQuoteIndex(nextContent.quote_index);
          processQuote(nextContent.content);
        } else {
          const firstContent = await contentService.getFirstQuoteForLevel(level);
          if (firstContent) {
            setCurrentContent(firstContent);
            setCurrentQuote(firstContent.content);
            setCurrentQuoteId(firstContent.content_id);
            setCurrentQuoteIndex(firstContent.quote_index);
            processQuote(firstContent.content);
          } else {
            const quote = quotes[currentQuoteIndex % quotes.length];
            setCurrentQuote(quote);
            processQuote(quote);
            setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
          }
        }
      } else if (scriptId) {
        try {
          const { data, error } = await supabase
            .from('script_quotes')
            .select('id, content, quote_index')
            .eq('script_id', scriptId)
            .order('quote_index', { ascending: true });
            
          if (error || !data || data.length === 0) {
            console.error('Error loading quotes or no quotes found:', error);
            const quote = quotes[currentQuoteIndex % quotes.length];
            setCurrentQuote(quote);
            processQuote(quote);
            setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
          } else {
            const nextQuoteIndex = currentQuoteIndex % data.length;
            const nextQuote = data[nextQuoteIndex];
            
            console.log(`Loading quote ${nextQuoteIndex + 1} of ${data.length}`);
            
            setCurrentQuote(nextQuote.content);
            setCurrentQuoteId(nextQuote.id);
            processQuote(nextQuote.content);
            
            setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % data.length);
          }
        } catch (error) {
          console.error('Error loading quote from database:', error);
          const quote = quotes[currentQuoteIndex % quotes.length];
          setCurrentQuote(quote);
          processQuote(quote);
          setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
        }
      } else {
        const quote = quotes[currentQuoteIndex % quotes.length];
        setCurrentQuote(quote);
        processQuote(quote);
        setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
      }
    } catch (error) {
      console.error("Error loading new quote:", error);
      const quote = quotes[currentQuoteIndex % quotes.length];
      setCurrentQuote(quote);
      processQuote(quote);
      setCurrentQuoteIndex(prevIndex => (prevIndex + 1) % quotes.length);
    }
    
    resetTest();
    focusInput();
    resultRecordedRef.current = false;
    setMeetsCriteria(false);
  }, [currentContent, level, quotes, scriptId, currentQuoteIndex, processQuote, resetTest, focusInput]);

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
    
    // Ensure input is focused after backspace
    focusInput();
  }, [currentCharIndex, currentWordIndex, words, findLastCorrectPosition, focusInput]);

  // Improved handleInput to use controlled input and avoid race conditions
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input); // Update the input value state immediately
    
    const typedChar = input.charAt(input.length - 1);
    
    // Don't process empty inputs
    if (!typedChar) return;
    
    // Don't process if it's the same character we just processed
    if (typedChar === lastTypedChar) return;
    setLastTypedChar(typedChar);
    
    if (!isActive && !isFinished) {
      setIsActive(true);
      startTimer();
    }
    
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
  }, [
    currentCharIndex, 
    currentWordIndex, 
    isActive, 
    isFinished, 
    startTimer, 
    stopTimer, 
    words, 
    deathMode, 
    deathModeReset,
    lastTypedChar
  ]);

  // Improved key event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events when the typing area should be active
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          loadNewQuote();
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          smartBackspace();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote, smartBackspace, inputRef]);

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
      if (isFinished && user && !resultRecordedRef.current) {
        resultRecordedRef.current = true;
        try {
          console.log('Recording typing session:', {
            userId: user.id,
            scriptId: scriptId || undefined,
            contentId: currentContent?.id,
            contentIdString: currentContent?.content_id,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            elapsedTime: stats.elapsedTime
          });
          
          const roundedElapsedTime = Math.round(stats.elapsedTime);
          
          let success = false;
          
          if (scriptId) {
            success = await typingHistoryService.recordSession(
              user.id,
              scriptId,
              stats.wpm,
              stats.accuracy,
              roundedElapsedTime,
              currentQuoteId || undefined
            );
          } else if (currentContent) {
            success = await typingHistoryService.recordContentSession(
              user.id,
              currentContent.id,
              stats.wpm,
              stats.accuracy,
              roundedElapsedTime,
              currentContent.level_number,
              currentContent.content_id
            );
          }
          
          if (success) {
            const newCompletedQuotes = completedQuotes + 1;
            setCompletedQuotes(newCompletedQuotes);
            
            if (stats.wpm > 0 && stats.accuracy >= 90) {
              setMeetsCriteria(true);
            }
            
            if (!baselineWpm || stats.wpm > baselineWpm) {
              setBaselineWpm(stats.wpm);
            }
            
            if (onQuoteComplete) {
              onQuoteComplete(stats, currentContent?.content_id);
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
  }, [isFinished, user, scriptId, stats, currentQuoteId, completedQuotes, onQuoteComplete, repeatMode, resetTest, focusInput, baselineWpm, currentContent]);

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
    deathMode,
    deathModeFailures,
    meetsCriteria,
    baselineWpm,
    currentQuoteIndex,
    currentContent,
    inputValue, // Expose the input value for controlled input
  };
};

export default useTypingTest;
