
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import HistoricalStats from './HistoricalStats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Toggle } from './ui/toggle';
import { SkullIcon, SmileIcon } from 'lucide-react';
import SessionWpmChart from './SessionWpmChart';

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
  const [sessionWpmData, setSessionWpmData] = useState<number[]>([]);
  
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
    deathModeFailures
  } = useTypingTest({
    quotes,
    scriptId,
    deathMode,
    onQuoteComplete: (completedStats) => {
      setCurrentQuoteNumber(prev => Math.min(prev + 1, totalQuotes));
      if (completedStats && completedStats.wpm > 0) {
        setSessionWpmData(prev => [...prev, completedStats.wpm]);
      }
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
  
  const toggleDeathMode = () => {
    setDeathMode(prev => !prev);
    resetTest();
  };

  return (
    <div className={cn("typing-area-container w-full", className)}>
      <div className="w-full flex flex-col">
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
      
      {/* Chart container - always maintains the same space whether populated or not */}
      <div className="w-full h-40 my-4">
        {sessionWpmData.length > 0 ? (
          <SessionWpmChart wpmData={sessionWpmData} />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      
      <div className="typing-area flex flex-wrap text-3xl" onClick={focusInput}>
        {words.map((word, wordIndex) => (
          <React.Fragment key={wordIndex}>
            {/* Word with characters */}
            <div className="flex">
              {word.characters.map((char, charIndex) => (
                <span 
                  key={`${wordIndex}-${charIndex}`} 
                  className={cn("character", {
                    "text-monkey-accent": char.state === 'correct',
                    "text-monkey-error": char.state === 'incorrect',
                    "text-white": char.state === 'current' || char.state === 'inactive'
                  })}
                >
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

      <div className="flex flex-col gap-4 mt-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={resetTest} 
            className="button button-accent bg-slate-850 hover:bg-slate-700 text-gray-400 font-normal text-base"
          >
            redo
          </button>
          <button 
            onClick={loadNewQuote} 
            className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base"
          >
            new [shift + enter]
          </button>
          <QuoteUploaderButton onQuotesLoaded={onQuotesLoaded} />
          
          <Toggle 
            pressed={deathMode} 
            onPressedChange={toggleDeathMode} 
            aria-label={deathMode ? "Death Mode" : "Normal Mode"} 
            className="ml-auto bg-slate-800 hover:bg-slate-700 data-[state=on]:bg-red-900"
          >
            {deathMode ? (
              <SkullIcon className="w-4 h-4" />
            ) : (
              <SmileIcon className="w-4 h-4" />
            )}
          </Toggle>
        </div>
      </div>
    </div>
  );
};

export default TypingArea;
