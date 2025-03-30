
import React from 'react';
import { cn } from '../../lib/utils';
import { Word } from '../../utils/typingUtils';

interface TypingDisplayProps {
  words: Word[];
  currentWordIndex: number;
  currentCharIndex: number;
  focusInput: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TypingDisplay: React.FC<TypingDisplayProps> = ({
  words,
  currentWordIndex,
  currentCharIndex,
  focusInput,
  inputRef,
  handleInput
}) => {
  return (
    <div className="typing-area flex flex-wrap text-2xl my-6" onClick={focusInput}>
      {words.map((word, wordIndex) => (
        <React.Fragment key={wordIndex}>
          {/* Word with characters */}
          <div className="flex">
            {word.characters.map((char, charIndex) => (
              <span key={`${wordIndex}-${charIndex}`} className={cn("character", {
                "text-monkey-accent": char.state === 'correct',
                "text-monkey-error": char.state === 'incorrect',
                "character-current": char.state === 'current'
              })}>
                {/* Show caret before current character */}
                {wordIndex === currentWordIndex && charIndex === currentCharIndex && <span className="caret" />}
                {char.char}
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
  );
};

export default TypingDisplay;
