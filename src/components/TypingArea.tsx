import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import HistoricalStats from './HistoricalStats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Toggle } from './ui/toggle';
import { SkullIcon, SmileIcon, RepeatIcon } from 'lucide-react';
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
  const {
    user
  } = useAuth();
  const [totalQuotes, setTotalQuotes] = useState(quotes.length);
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState(1);
  const [deathMode, setDeathMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
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
    repeatMode,
    onQuoteComplete: completedStats => {
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
    // Turn off repeat mode if death mode is turning on
    if (!deathMode) {
      setRepeatMode(false);
    }
    resetTest();
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => !prev);
    // Turn off death mode if repeat mode is turning on
    if (!repeatMode) {
      setDeathMode(false);
    }
  };
  return <div className={cn("typing-area-container w-full flex flex-col gap-1", className)}>
      {/* Stats Panel */}
      <div className="w-full flex justify-between items-center p-2 px-0 py-0 my-0">
        <Stats stats={stats} isActive={isActive} isFinished={isFinished} className="self-start" deathMode={deathMode} deathModeFailures={deathModeFailures} repeatMode={repeatMode} />
        {user && <HistoricalStats className="self-end" displayAccuracy={false} />}
      </div>
      
      {/* Typing Area */}
      <div className="w-full p-4 px-0 py-0 bg-inherit">
        <div className="typing-area flex flex-wrap text-2xl" onClick={focusInput}>
          {words.map((word, wordIndex) => <React.Fragment key={wordIndex}>
              {/* Word with characters */}
              <div className="flex">
                {word.characters.map((char, charIndex) => <span key={`${wordIndex}-${charIndex}`} className={cn("character", {
              "text-monkey-accent": char.state === 'correct',
              "text-monkey-error": char.state === 'incorrect',
              "text-white": char.state === 'current' || char.state === 'inactive'
            })}>
                    {char.char}
                  </span>)}
              </div>
              {/* Add space between words (except for the last word) */}
              {wordIndex < words.length - 1 && <span>&nbsp;</span>}
            </React.Fragment>)}
          
          {/* Hidden input to capture keystrokes */}
          <input ref={inputRef} type="text" className="typing-input" onChange={handleInput} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" aria-label="Typing input" />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center gap-2 p-2 px-0 py-0 my-[8px] mx-0">
        <button onClick={resetTest} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-sm">
          redo
        </button>
        <button onClick={loadNewQuote} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-sm">
          new [shift + enter]
        </button>
        <QuoteUploaderButton onQuotesLoaded={onQuotesLoaded} />
        
        <div className="ml-auto flex items-center gap-2">
          <Toggle 
            pressed={repeatMode} 
            onPressedChange={toggleRepeatMode} 
            aria-label={repeatMode ? "Repeat Mode On" : "Repeat Mode Off"} 
            className="bg-slate-800 hover:bg-slate-700 data-[state=on]:bg-green-900"
          >
            <RepeatIcon className="w-4 h-4" />
          </Toggle>
          
          <Toggle 
            pressed={deathMode} 
            onPressedChange={toggleDeathMode} 
            aria-label={deathMode ? "Death Mode" : "Normal Mode"} 
            className="bg-slate-800 hover:bg-slate-700 data-[state=on]:bg-red-900"
          >
            {deathMode ? <SkullIcon className="w-4 h-4" /> : <SmileIcon className="w-4 h-4" />}
          </Toggle>
        </div>
      </div>
      
      {/* Session Performance Chart */}
      <SessionWpmChart wpmData={sessionWpmData} />
    </div>;
};
export default TypingArea;