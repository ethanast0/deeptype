
import { useCallback } from 'react';
import { Word, calculateAccuracy } from '../../utils/typingUtils';

interface UseTypingInputProps {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  currentWordIndex: number;
  setCurrentWordIndex: React.Dispatch<React.SetStateAction<number>>;
  currentCharIndex: number;
  setCurrentCharIndex: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  isFinished: boolean;
  setIsFinished: React.Dispatch<React.SetStateAction<boolean>>;
  startTimer: () => void;
  stopTimer: () => void;
  stats: any;
  setStats: React.Dispatch<React.SetStateAction<any>>;
  inputRef: React.RefObject<HTMLInputElement>;
  deathMode: boolean;
  deathModeReset: () => void;
}

const useTypingInput = ({
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
}: UseTypingInputProps) => {
  
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
      const prevWordLength = words[prevWordIndex]?.characters.length || 0;
      
      setCurrentWordIndex(prevWordIndex);
      setCurrentCharIndex(prevWordLength);
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        
        if (prevWordLength > 0 && newWords[prevWordIndex]?.characters) {
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
        
        if (newWords[currentWordIndex]) {
          for (let i = charIndex; i < newWords[currentWordIndex].characters.length; i++) {
            if (i === charIndex) {
              newWords[currentWordIndex].characters[i].state = 'current';
            } else {
              newWords[currentWordIndex].characters[i].state = 'inactive';
            }
          }
        }
        
        return newWords;
      });
    } else if (currentCharIndex > 0) {
      setCurrentCharIndex(prev => prev - 1);
      
      setWords(prevWords => {
        const newWords = [...prevWords];
        if (currentCharIndex > 0 && newWords[currentWordIndex]?.characters) {
          newWords[currentWordIndex].characters[currentCharIndex - 1].state = 'current';
          
          if (currentCharIndex < newWords[currentWordIndex].characters.length) {
            newWords[currentWordIndex].characters[currentCharIndex].state = 'inactive';
          }
        }
        return newWords;
      });
      
      if (currentCharIndex > 0 && currentCharIndex <= words[currentWordIndex]?.characters.length && words[currentWordIndex]?.characters) {
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
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCharIndex, currentWordIndex, words, findLastCorrectPosition, setCurrentCharIndex, setCurrentWordIndex, setWords, setStats, inputRef]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;

    if (!input) return;

    // Prevent processing input if the test is finished
    if (isFinished) {
      e.currentTarget.value = '';
      return;
    }

    if (!isActive) {
        setIsActive(true);
        startTimer();
    }

    e.currentTarget.value = '';

    const typedChar = input.charAt(input.length - 1);
    
    // Handle space character (word completion)
    if (typedChar === ' ') {
        // Validate the current word index exists
        if (currentWordIndex >= words.length) {
            console.error("Invalid currentWordIndex:", currentWordIndex, "words length:", words.length);
            return;
        }

        const currentWord = words[currentWordIndex];
        
        // Check if we're at the end of a word (correct position to enter a space)
        if (currentCharIndex === currentWord?.characters.length) {
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
                    
                    // Mark the first character of the next word as current
                    if (newWords[currentWordIndex + 1]?.characters?.length > 0) {
                        newWords[currentWordIndex + 1].characters[0].state = 'current';
                    }
                    
                    return newWords;
                });
            } else {
                // This is the last word and we're at the end of it
                // Mark the test as finished
                setIsFinished(true);
                setIsActive(false); // Explicitly set active to false
                stopTimer();
            }
        } else {
            // Space entered at wrong position - in death mode this should reset
            if (deathMode) {
                deathModeReset();
                return;
            }
            
            setStats(prev => ({
                ...prev,
                incorrectChars: prev.incorrectChars + 1,
                accuracy: calculateAccuracy(
                    prev.correctChars,
                    prev.incorrectChars + 1
                )
            }));
        }
        return;
    } 
    
    // Handle normal character input
    // Validate the current word exists
    if (currentWordIndex >= words.length) {
        console.error("Invalid currentWordIndex for character:", currentWordIndex, "words length:", words.length);
        return;
    }

    const currentWord = words[currentWordIndex];
    if (!currentWord?.characters) {
        console.error("Current word or characters undefined at index:", currentWordIndex);
        return;
    }

    // Validate character index
    if (currentCharIndex >= currentWord.characters.length) {
        console.error("Invalid currentCharIndex:", currentCharIndex, "word length:", currentWord.characters.length);
        return;
    }

    const expectedChar = currentWord.characters[currentCharIndex]?.char;
    const isCorrect = typedChar === expectedChar;

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
        
        // Validate before accessing properties
        if (!newWords[currentWordIndex] || !newWords[currentWordIndex].characters) {
            console.error("Cannot update word state - word not found at index:", currentWordIndex);
            return prevWords;
        }
        
        // Mark the current character as correct or incorrect
        newWords[currentWordIndex].characters[currentCharIndex].state = isCorrect ? 'correct' : 'incorrect';
        
        if (currentCharIndex < currentWord.characters.length - 1) {
            // Move to next character in current word
            newWords[currentWordIndex].characters[currentCharIndex + 1].state = 'current';
            setCurrentCharIndex(prev => prev + 1);
        } else if (currentWordIndex < words.length - 1) {
            // Move to first character of next word
            setCurrentWordIndex(prev => prev + 1);
            setCurrentCharIndex(0);
            
            if (newWords[currentWordIndex + 1]?.characters?.length > 0) {
                newWords[currentWordIndex + 1].characters[0].state = 'current';
            }
        } else {
            // Last character of last word was typed
            setIsFinished(true);
            setIsActive(false); // Explicitly set active to false
            stopTimer();
        }
        
        return newWords;
    });
  }, [currentCharIndex, currentWordIndex, isActive, isFinished, startTimer, stopTimer, words, deathMode, deathModeReset, setCurrentCharIndex, setCurrentWordIndex, setIsActive, setIsFinished, setStats, setWords]);

  return {
    handleInput,
    findLastCorrectPosition,
    smartBackspace
  };
};

export default useTypingInput;
