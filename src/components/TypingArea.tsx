
import React, { useEffect } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';

interface TypingAreaProps {
  quotes?: string[];
  className?: string;
}

const TypingArea: React.FC<TypingAreaProps> = ({ 
  quotes, 
  className 
}) => {
  const {
    words,
    stats,
    isActive,
    isFinished,
    inputRef,
    handleInput,
    resetTest,
    loadNewQuote,
    focusInput
  } = useTypingTest({ quotes });

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  return (
    <div className={cn("typing-area-container", className)}>
      <Stats stats={stats} isActive={isActive} isFinished={isFinished} />
      
      <div 
        className="typing-area flex flex-wrap" 
        onClick={focusInput}
      >
        {words.map((word, wordIndex) => (
          <React.Fragment key={wordIndex}>
            {/* Word with characters */}
            <div className="flex">
              {word.characters.map((char, charIndex) => (
                <span
                  key={`${wordIndex}-${charIndex}`}
                  className={cn(
                    "character",
                    {
                      "text-monkey-accent": char.state === 'correct',
                      "text-monkey-error": char.state === 'incorrect',
                      "character-current": char.state === 'current'
                    }
                  )}
                >
                  {char.char}
                  {/* Show caret at current character position */}
                  {char.state === 'current' && <span className="caret" />}
                </span>
              ))}
            </div>
            {/* Add space between words (except for the last word) */}
            {wordIndex < words.length - 1 && <span>&nbsp;</span>}
          </React.Fragment>
        ))}
        
        {/* Hidden input to capture keystrokes */}
        <input
          ref={inputRef}
          type="text"
          className="typing-input"
          onChange={handleInput}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Typing input"
        />
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          className="button" 
          onClick={resetTest}
        >
          Reset
        </button>
        <button 
          className="button button-accent" 
          onClick={loadNewQuote}
        >
          New Quote (Shift + Enter)
        </button>
      </div>
    </div>
  );
};

export default TypingArea;
