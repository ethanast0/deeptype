import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { scriptService } from '../services/scriptService';

interface Character {
  char: string;
  state: 'untyped' | 'correct' | 'incorrect' | 'current';
}

interface Word {
  characters: Character[];
}

interface Stats {
  wpm: number;
  accuracy: number;
  elapsedTime: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

interface UseTypingTestProps {
  quotes: string[];
  scriptId?: string | null;
  quoteIds?: string[];
}

const useTypingTest = ({ quotes, scriptId, quoteIds = [] }: UseTypingTestProps) => {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);
  const totalCharsRef = useRef(0);

  const stats: Stats = {
    wpm: calculateWPM(),
    accuracy: calculateAccuracy(),
    elapsedTime: getElapsedTime(),
    correctChars: correctCharsRef.current,
    incorrectChars: incorrectCharsRef.current,
    totalChars: totalCharsRef.current
  };

  function calculateWPM(): number {
    if (!startTimeRef.current || !isActive) return 0;
    const elapsedMinutes = getElapsedTime() / 60000;
    if (elapsedMinutes === 0) return 0;
    return Math.round((correctCharsRef.current / 5) / elapsedMinutes);
  }

  function calculateAccuracy(): number {
    if (totalCharsRef.current === 0) return 0;
    return Math.round((correctCharsRef.current / totalCharsRef.current) * 100);
  }

  function getElapsedTime(): number {
    if (!startTimeRef.current) return 0;
    const endTime = endTimeRef.current || Date.now();
    return endTime - startTimeRef.current;
  }

  const processQuote = useCallback((quote: string): Word[] => {
    return quote.split(' ').map(word => ({
      characters: word.split('').map(char => ({
        char,
        state: 'untyped'
      }))
    }));
  }, []);

  const loadNewQuote = useCallback(() => {
    if (quotes.length === 0) return;
    
    const nextIndex = (currentQuoteIndex + 1) % quotes.length;
    setCurrentQuoteIndex(nextIndex);
    setCurrentQuoteId(quoteIds[nextIndex] || null);
    setWords(processQuote(quotes[nextIndex]));
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setIsActive(false);
    setIsFinished(false);
    startTimeRef.current = null;
    endTimeRef.current = null;
    correctCharsRef.current = 0;
    incorrectCharsRef.current = 0;
    totalCharsRef.current = 0;
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [quotes, currentQuoteIndex, processQuote, quoteIds]);

  useEffect(() => {
    if (quotes.length > 0) {
      setCurrentQuoteId(quoteIds[0] || null);
      setWords(processQuote(quotes[0]));
    }
  }, [quotes, processQuote, quoteIds]);

  const recordHistory = useCallback(async () => {
    if (!user || !scriptId || !currentQuoteId) return;

    try {
      await scriptService.recordTypingHistory(
        user.id,
        scriptId,
        stats.wpm,
        stats.accuracy
      );
      toast.success('Progress saved!');
    } catch (error) {
      console.error('Error recording typing history:', error);
      toast.error('Failed to save progress');
    }
  }, [user, scriptId, currentQuoteId, stats]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Start the timer when user begins typing
    if (!isActive && !isFinished) {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }

    // Handle backspace
    if (input.length < currentCharIndex) {
      // Only handle backspace if we're not at the beginning
      if (currentCharIndex > 0) {
        const newWords = [...words];
        const currentWord = newWords[currentWordIndex].characters;
        
        // Update the character state
        currentWord[currentCharIndex - 1].state = 'untyped';
        
        // Decrement character counters
        if (currentWord[currentCharIndex - 1].state === 'correct') {
          correctCharsRef.current = Math.max(0, correctCharsRef.current - 1);
        } else if (currentWord[currentCharIndex - 1].state === 'incorrect') {
          incorrectCharsRef.current = Math.max(0, incorrectCharsRef.current - 1);
        }
        totalCharsRef.current = Math.max(0, totalCharsRef.current - 1);
        
        // Update cursor position
        setCurrentCharIndex(currentCharIndex - 1);
        setWords(newWords);
      }
      return;
    }

    // Handle new character input
    if (input.length > 0) {
      const char = input[input.length - 1];
      const newWords = [...words];
      
      // Ensure we have a current word and we haven't reached the end
      if (currentWordIndex < newWords.length) {
        const currentWord = newWords[currentWordIndex].characters;
        
        // Check if we're still within the current word's characters
        if (currentCharIndex < currentWord.length) {
          // Determine if the typed character is correct
          const isCorrect = char === currentWord[currentCharIndex].char;
          
          // Update character state
          currentWord[currentCharIndex].state = isCorrect ? 'correct' : 'incorrect';
          
          // Update character counters
          if (isCorrect) {
            correctCharsRef.current++;
          } else {
            incorrectCharsRef.current++;
          }
          totalCharsRef.current++;
          
          // Mark the next character as current if there is one
          if (currentCharIndex + 1 < currentWord.length) {
            currentWord[currentCharIndex + 1].state = 'current';
          }
          
          // Update cursor position
          setCurrentCharIndex(currentCharIndex + 1);
          
          // Check if we've completed the word
          if (currentCharIndex === currentWord.length - 1) {
            if (currentWordIndex < words.length - 1) {
              // Move to the next word
              setCurrentWordIndex(currentWordIndex + 1);
              setCurrentCharIndex(0);
              
              // Mark the first character of the next word as current
              if (newWords[currentWordIndex + 1].characters.length > 0) {
                newWords[currentWordIndex + 1].characters[0].state = 'current';
              }
            } else {
              // We've completed all words
              setIsFinished(true);
              setIsActive(false);
              endTimeRef.current = Date.now();
              recordHistory();
            }
          }
        }
      }
      
      setWords(newWords);
    }
    
    // Clear the input field to prepare for the next character
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [words, currentWordIndex, currentCharIndex, isActive, isFinished, recordHistory]);

  const resetTest = useCallback(() => {
    if (quotes.length === 0) return;
    setWords(processQuote(quotes[currentQuoteIndex]));
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setIsActive(false);
    setIsFinished(false);
    startTimeRef.current = null;
    endTimeRef.current = null;
    correctCharsRef.current = 0;
    incorrectCharsRef.current = 0;
    totalCharsRef.current = 0;
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [quotes, currentQuoteIndex, processQuote]);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return {
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
  };
};

export default useTypingTest;
