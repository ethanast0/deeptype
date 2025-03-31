
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { scriptService } from '../services/scriptService';

const useTypingTest = ({ quotes, scriptId, quoteIds = [] }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);
  const totalCharsRef = useRef(0);
  
  const stats = {
    wpm: calculateWPM(),
    accuracy: calculateAccuracy(),
    elapsedTime: getElapsedTime(),
    correctChars: correctCharsRef.current,
    incorrectChars: incorrectCharsRef.current,
    totalChars: totalCharsRef.current
  };
  
  function calculateWPM() {
    if (!startTimeRef.current || !isActive) return 0;
    const elapsedMinutes = getElapsedTime() / 60000;
    if (elapsedMinutes === 0) return 0;
    return Math.round(correctCharsRef.current / 5 / elapsedMinutes);
  }
  
  function calculateAccuracy() {
    if (totalCharsRef.current === 0) return 0;
    return Math.round(correctCharsRef.current / totalCharsRef.current * 100);
  }
  
  function getElapsedTime() {
    if (!startTimeRef.current) return 0;
    const endTime = endTimeRef.current || Date.now();
    return endTime - startTimeRef.current;
  }
  
  const processQuote = useCallback((quote) => {
    return quote.split(' ').map((word) => ({
      characters: word.split('').map((char) => ({
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
      await scriptService.recordTypingHistory({
        scriptId,
        quoteId: currentQuoteId,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        elapsedTime: stats.elapsedTime
      });
      
      toast({
        title: "Progress saved",
        description: "Your typing results have been recorded.",
      });
    } catch (error) {
      console.error('Error recording typing history:', error);
      toast({
        title: "Error saving progress",
        description: "Failed to save your typing results.",
        variant: "destructive"
      });
    }
  }, [user, scriptId, currentQuoteId, stats, toast]);
  
  const handleInput = useCallback((e) => {
    const input = e.target.value;
    if (!isActive && !isFinished) {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }
    
    // Handle backspace
    if (input.length < currentCharIndex) {
      const newWords = [...words];
      const currentWord = newWords[currentWordIndex].characters;
      if (currentCharIndex > 0) {
        currentWord[currentCharIndex - 1].state = 'untyped';
        setCurrentCharIndex(currentCharIndex - 1);
        if (currentWord[currentCharIndex - 1].state === 'correct') {
          correctCharsRef.current--;
        } else if (currentWord[currentCharIndex - 1].state === 'incorrect') {
          incorrectCharsRef.current--;
        }
        totalCharsRef.current--;
      }
      setWords(newWords);
      return;
    }
    
    // Handle new character
    const char = input[input.length - 1];
    const newWords = [...words];
    const currentWord = newWords[currentWordIndex].characters;
    if (currentCharIndex < currentWord.length) {
      const isCorrect = char === currentWord[currentCharIndex].char;
      currentWord[currentCharIndex].state = isCorrect ? 'correct' : 'incorrect';
      if (isCorrect) {
        correctCharsRef.current++;
      } else {
        incorrectCharsRef.current++;
      }
      totalCharsRef.current++;
      if (currentCharIndex + 1 < currentWord.length) {
        currentWord[currentCharIndex + 1].state = 'current';
      }
      setCurrentCharIndex(currentCharIndex + 1);
    }
    
    // Handle word completion
    if (currentCharIndex === currentWord.length - 1) {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentCharIndex(0);
        newWords[currentWordIndex + 1].characters[0].state = 'current';
      } else {
        setIsFinished(true);
        setIsActive(false);
        endTimeRef.current = Date.now();
        recordHistory();
      }
    }
    
    setWords(newWords);
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
