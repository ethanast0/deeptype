
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
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCharIndex, currentWordIndex, words, findLastCorrectPosition, setCurrentCharIndex, setCurrentWordIndex, setWords, setStats, inputRef]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;

    if (!input) return;

    if (!isActive && !isFinished) {
        setIsActive(true);
        startTimer();
    }

    e.currentTarget.value = '';

    const typedChar = input.charAt(input.length - 1);
    
    if (typedChar === ' ') {
        // Fix for deathMode issue with spaces
        if (currentCharIndex === words[currentWordIndex]?.characters.length) {
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
            } else {
                // Check if this is the last word and we're at the end of it
                // This means the user has completed the test
                setIsFinished(true);
                stopTimer();
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
    } else {
        const currentWord = words[currentWordIndex];
        if (!currentWord) return;

        const isCorrect = typedChar === currentWord.characters[currentCharIndex]?.char;

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
                setCurrentCharIndex(prev => prev + 1);
            } else if (currentWordIndex < words.length - 1) {
                setCurrentWordIndex(prev => prev + 1);
                setCurrentCharIndex(0);
                
                if (newWords[currentWordIndex + 1]?.characters.length > 0) {
                    newWords[currentWordIndex + 1].characters[0].state = 'current';
                }
            } else {
                // Last character of last word was typed
                setIsFinished(true);
                stopTimer();
            }
            
            return newWords;
        });
    }
  }, [currentCharIndex, currentWordIndex, isActive, isFinished, startTimer, stopTimer, words, deathMode, deathModeReset, setCurrentCharIndex, setCurrentWordIndex, setIsActive, setIsFinished, setStats, setWords]);

  return {
    handleInput,
    findLastCorrectPosition,
    smartBackspace
  };
};

export default useTypingInput;
