
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import HistoricalStats from './HistoricalStats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Toggle } from './ui/toggle';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { SkullIcon } from 'lucide-react';

interface TypingAreaProps {
  quotes: string[];
  className?: string;
  scriptId?: string | null;
  onQuotesLoaded?: (quotes: string[]) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  quotes,
  className,
  scriptId,
  onQuotesLoaded = () => {},
  onTypingStateChange = () => {}
}) => {
  const { user } = useAuth();
  const [totalQuotes, setTotalQuotes] = useState(quotes.length);
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState(1);
  const [deathMode, setDeathMode] = useState(false);
  
  const {
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
    currentCharIndex,
    scriptWpm,
    hasCompletedScript,
    deathModeFailures
  } = useTypingTest({
    quotes,
    scriptId,
    deathMode,
    onQuoteComplete: () => {
      setCurrentQuoteNumber(prev => Math.min(prev + 1, totalQuotes));
    }
  });

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Update typing state when active state changes
  useEffect(() => {
    onTypingStateChange(isActive);
  }, [isActive, onTypingStateChange]);

  // Update total quotes when quotes array changes
  useEffect(() => {
    setTotalQuotes(quotes.length);
  }, [quotes]);

  // Reset current quote number when loading new quote set
  useEffect(() => {
    if (quotes.length > 0) {
      setCurrentQuoteNumber(1);
    }
  }, [quotes]);
  
  const handleModeToggle = (value: string) => {
    setDeathMode(value === "death");
    resetTest();
  };

  return <div className={cn("typing-area-container w-full", className)}>
      <div className="w-full flex flex-col -mt-4">
        <div className="flex justify-between items-center">
          <Stats 
            stats={stats} 
            isActive={isActive} 
            isFinished={isFinished} 
            className="self-start" 
            deathMode={deathMode}
            deathModeFailures={deathModeFailures}
          />
          {user && <HistoricalStats className="self-end" displayAccuracy={false} />}
        </div>
      </div>
      
      <div className="typing-area flex flex-wrap text-3xl" onClick={focusInput}>
        {words.map((word, wordIndex) => <React.Fragment key={wordIndex}>
              {/* Word with characters */}
              <div className="flex">
                {word.characters.map((char, charIndex) => <span key={`${wordIndex}-${charIndex}`} className={cn("character", {
            "text-monkey-accent": char.state === 'correct',
            "text-monkey-error": char.state === 'incorrect',
            "character-current": char.state === 'current'
          })}>
                    {/* Show caret before current character */}
                    {wordIndex === currentWordIndex && charIndex === currentCharIndex && <span className="caret" />}
                    {char.char}
                  </span>)}
              </div>
              {/* Add space between words (except for the last word) */}
              {wordIndex < words.length - 1 && <span>&nbsp;</span>}
            </React.Fragment>)}
        
        {/* Hidden input to capture keystrokes */}
        <input ref={inputRef} type="text" className="typing-input" onChange={handleInput} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" aria-label="Typing input" />
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="flex gap-4">
          <button onClick={resetTest} className="button button-accent bg-slate-850 hover:bg-slate-700 text-gray-400 font-normal text-base">redo</button>
          <button onClick={loadNewQuote} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base">new [shift + enter]</button>
          <QuoteUploaderButton onQuotesLoaded={onQuotesLoaded} />
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">Mode:</span>
          <ToggleGroup type="single" defaultValue="normal" onValueChange={handleModeToggle} className="bg-slate-800 rounded-md">
            <ToggleGroupItem value="normal" aria-label="Normal Mode" className="data-[state=on]:bg-slate-700 text-gray-300">
              Normal
            </ToggleGroupItem>
            <ToggleGroupItem value="death" aria-label="Death Mode" className="data-[state=on]:bg-red-900 text-gray-300">
              <SkullIcon className="w-4 h-4 mr-1" />
              Death Mode
            </ToggleGroupItem>
          </ToggleGroup>
          {deathMode && deathModeFailures > 0 && (
            <span className="text-sm text-red-500 ml-2">
              Failures: {deathModeFailures}
            </span>
          )}
        </div>
      </div>

      {/* Script completion toast */}
      {hasCompletedScript && scriptId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-monkey-accent mb-4">🎉 Script Completed! 🎉</h2>
            <p className="text-gray-300 mb-6">You've completed all quotes in this script!</p>
            <div className="text-xl font-bold mb-6">
              Your average WPM: <span className="text-monkey-accent">{scriptWpm}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-monkey-accent text-white rounded hover:bg-opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>;
};

export default TypingArea;
