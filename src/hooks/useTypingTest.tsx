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

  useEffect(() => {
    if (quotes.length > 0) {
      loadNewQuote();
    }
  }, [quotes]);

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

  const loadNewQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    setCurrentQuote(quote);
    processQuote(quote);
    resetTest();
    focusInput();
  }, [quotes, processQuote]);

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
          
          setWords(prevWords => {
            const newWords = [...prevWords];
            
            if (newWords[currentWordIndex + 1]?.characters.length > 0) {
              newWords[currentWordIndex + 1].characters[0].state = 'current';
            }
            
            return newWords;
          });
        }
      }
      return;
    }
    
    if (currentCharIndex < currentWord.characters.length) {
      const currentChar = currentWord.characters[currentCharIndex];
      
      const isCorrect = typedChar === currentChar.char;
      
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
  }, [currentCharIndex, currentWordIndex, isActive, isFinished, startTimer, stopTimer, words]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
