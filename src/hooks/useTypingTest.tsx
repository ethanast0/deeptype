
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Character, 
  Word, 
  TypingStats, 
  calculateWPM, 
  calculateAccuracy, 
  defaultQuotes 
} from '../utils/typingUtils';

interface UseTypingTestProps {
  quotes?: string[];
}

const useTypingTest = ({ quotes = defaultQuotes }: UseTypingTestProps = {}) => {
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
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with a random quote
  useEffect(() => {
    if (quotes.length > 0) {
      loadNewQuote();
    }
  }, [quotes]);

  // Process the quote into words and characters
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
    
    // Calculate total characters (including spaces)
    const totalChars = quote.length;
    setStats(prev => ({ ...prev, totalChars }));
  }, [currentWordIndex]);

  // Load a new random quote
  const loadNewQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    setCurrentQuote(quote);
    processQuote(quote);
    resetTest();
    focusInput();
  }, [quotes, processQuote]);

  // Start the timer
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

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset the test
  const resetTest = useCallback(() => {
    stopTimer();
    setIsActive(false);
    setIsFinished(false);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    startTimeRef.current = null;
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: currentQuote.length,
      elapsedTime: 0,
    });
    
    // Reset character states
    setWords(prevWords => {
      return prevWords.map((word, wordIdx) => ({
        characters: word.characters.map((char, charIdx) => ({
          ...char,
          state: wordIdx === 0 && charIdx === 0 ? 'current' : 'inactive'
        }))
      }));
    });
  }, [currentQuote, stopTimer]);

  // Handle user input
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Start timer on first input
    if (!isActive && !isFinished) {
      setIsActive(true);
      startTimer();
    }
    
    // Clear input field
    e.target.value = '';
    
    // Get the last character typed
    const typedChar = input.charAt(input.length - 1);
    if (!typedChar) return;
    
    // Get current word and character
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;
    
    // Check if we're at the end of a word and user typed space
    if (currentCharIndex >= currentWord.characters.length && typedChar === ' ') {
      if (currentWordIndex < words.length - 1) {
        // Move to next word
        setCurrentWordIndex(prev => prev + 1);
        setCurrentCharIndex(0);
        
        // Update character states
        setWords(prevWords => {
          const newWords = [...prevWords];
          
          // Set first character of next word as current
          if (newWords[currentWordIndex + 1]?.characters.length > 0) {
            newWords[currentWordIndex + 1].characters[0].state = 'current';
          }
          
          return newWords;
        });
      }
      return;
    }
    
    // If it's not a space at the end of a word, process the character
    const currentChar = currentWord.characters[currentCharIndex];
    if (!currentChar) return;
    
    // Check if character is correct
    const isCorrect = typedChar === currentChar.char;
    
    // Update stats
    setStats(prev => ({
      ...prev,
      correctChars: prev.correctChars + (isCorrect ? 1 : 0),
      incorrectChars: prev.incorrectChars + (isCorrect ? 0 : 1),
      accuracy: calculateAccuracy(
        prev.correctChars + (isCorrect ? 1 : 0), 
        prev.incorrectChars + (isCorrect ? 0 : 1)
      )
    }));
    
    // Update character states
    setWords(prevWords => {
      const newWords = [...prevWords];
      
      // Update current character
      newWords[currentWordIndex].characters[currentCharIndex].state = isCorrect ? 'correct' : 'incorrect';
      
      // Set next character as current if exists
      if (currentCharIndex < currentWord.characters.length - 1) {
        newWords[currentWordIndex].characters[currentCharIndex + 1].state = 'current';
      } else if (currentWordIndex === words.length - 1 && 
                 currentCharIndex === currentWord.characters.length - 1) {
        // Test is complete if this is the last character of the last word
        setIsFinished(true);
        stopTimer();
      }
      
      return newWords;
    });
    
    // Move to next character
    if (currentCharIndex < currentWord.characters.length - 1) {
      setCurrentCharIndex(prev => prev + 1);
    } else if (currentWordIndex === words.length - 1 && 
               currentCharIndex === currentWord.characters.length - 1) {
      // Test is complete if this is the last character of the last word
      setIsFinished(true);
      stopTimer();
    }
  }, [currentCharIndex, currentWordIndex, isActive, isFinished, startTimer, stopTimer, words]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + Enter for new quote
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        loadNewQuote();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Focus the input element
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
    currentWordIndex,
    currentCharIndex,
    inputRef,
    handleInput,
    resetTest,
    loadNewQuote,
    focusInput
  };
};

export default useTypingTest;
