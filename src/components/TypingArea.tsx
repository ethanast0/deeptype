
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTypingTest from '../hooks/typing';
import Stats from './Stats';
import HistoricalStats from './HistoricalStats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Toggle } from './ui/toggle';
import { SkullIcon, SmileIcon, RepeatIcon, KeyboardIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import SessionWpmChart from './SessionWpmChart';
import RaceAnimation from './RaceAnimation';

interface TypingAreaProps {
  quotes: string[];
  className?: string;
  scriptId?: string | null;
  onQuotesLoaded?: (quotes: string[]) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
}

// Focus Button Component
const FocusButton: React.FC<{ onClick: () => void; isZenMode: boolean; shortcut: string }> = ({ onClick, isZenMode, shortcut }) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1 button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-sm"
      title={`${isZenMode ? 'Exit' : 'Enter'} zen mode (${shortcut})`}
    >
      {isZenMode ? (
        <><MinimizeIcon className="w-3 h-3" /><span>exit zen</span></>
      ) : (
        <><MaximizeIcon className="w-3 h-3" /><span>zen mode</span></>
      )}
    </button>
  );
};

// Shortcut Component
const ShortcutIndicator: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  return (
    <span className="hidden md:inline-flex ml-1 text-xs px-1 py-0.5 rounded bg-slate-700 text-slate-300">
      {shortcut}
    </span>
  );
};

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
    deathModeFailures,
    zenMode,
    toggleZenMode,
    shortcuts
  } = useTypingTest({
    quotes,
    scriptId,
    deathMode,
    repeatMode,
    onQuoteComplete: completedStats => {
      console.log("Quote completed, stats:", completedStats);
      setCurrentQuoteNumber(prev => Math.min(prev + 1, totalQuotes));
      if (completedStats && completedStats.wpm > 0) {
        setSessionWpmData(prev => [...prev, completedStats.wpm]);
      }
    }
  });

  // Focus management: refocus the input after any UI interaction
  const refocusAfterInteraction = useCallback((delay = 150) => {
    focusInput(delay);
  }, [focusInput]);

  // Global click handler to refocus typing area
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if the click target is an input, textarea, or has a specific attribute to ignore focus
      const target = e.target as HTMLElement;
      const shouldIgnoreFocus = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.getAttribute('data-ignore-focus') === 'true' ||
        // Don't steal focus if user is interacting with a menu or dialog
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="listbox"]');
      
      if (!shouldIgnoreFocus) {
        // Use a short delay to allow other click handlers to complete first
        refocusAfterInteraction(200);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [refocusAfterInteraction]);

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput(50);
  }, [focusInput]);

  // Refocus when user switches tabs or windows and returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        focusInput(100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [focusInput]);

  // Update typing state when active state changes
  useEffect(() => {
    console.log("Typing state changed:", isActive, isFinished);
    onTypingStateChange(isActive);
  }, [isActive, onTypingStateChange, isFinished]);

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

  // Enhanced handling of typing area clicks for better focus management
  const handleTypingAreaClick = () => {
    focusInput(10); // Very short delay to ensure the focus happens after the click event fully resolves
  };

  const toggleDeathMode = () => {
    setDeathMode(prev => !prev);
    // Turn off repeat mode if death mode is turning on
    if (!deathMode) {
      setRepeatMode(false);
    }
    resetTest();
    refocusAfterInteraction(); // Refocus after toggle
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => !prev);
    // Turn off death mode if repeat mode is turning on
    if (!repeatMode) {
      setDeathMode(false);
    }
    refocusAfterInteraction(); // Refocus after toggle
  };

  const handleLoadNewQuote = () => {
    resetTest(); // First reset the test
    setTimeout(() => {
      loadNewQuote(); // Then load a new quote
      refocusAfterInteraction(50);
    }, 50);
  };

  const handleResetTest = () => {
    resetTest();
    refocusAfterInteraction();
  };

  // Add key event listener for the whole component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Special case for focus shortcut
      if (e.key === ' ' && e.shiftKey) {
        e.preventDefault();
        focusInput();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusInput]);
  
  // Listen for zen mode changes
  useEffect(() => {
    const handleZenModeChange = (e: CustomEvent) => {
      // This component needs to respect zen mode changes from the hook
      const newZenMode = e.detail.zenMode;
      if (zenMode !== newZenMode) {
        // We don't call toggleZenMode() here to avoid an infinite loop
        // Just update visuals as needed
        console.log("Zen mode changed via event:", newZenMode);
      }
    };

    window.addEventListener('zenModeChange' as any, handleZenModeChange);
    
    return () => {
      window.removeEventListener('zenModeChange' as any, handleZenModeChange);
    };
  }, [zenMode]);

  return (
    <div className={cn("typing-area-container w-full flex flex-col gap-1", className)}>
      {/* Stats Panel */}
      <div className="w-full flex justify-between items-center p-2 px-0 py-0 my-0">
        <Stats 
          stats={stats} 
          isActive={isActive} 
          isFinished={isFinished} 
          className="self-start" 
          deathMode={deathMode} 
          deathModeFailures={deathModeFailures} 
          repeatMode={repeatMode} 
        />
        {user && !zenMode && <HistoricalStats className="self-end" displayAccuracy={false} />}
      </div>
      
      {/* Typing Area */}
      <div className="w-full p-4 px-0 py-0 bg-inherit">
        <div 
          className="typing-area flex flex-wrap text-2xl relative" 
          onClick={handleTypingAreaClick}
        >
          {/* Visual indicator when not focused */}
          {!isActive && !isFinished && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30 hover:opacity-50 transition-opacity">
              <div className="bg-slate-900/70 rounded px-3 py-1 flex items-center">
                <KeyboardIcon className="w-4 h-4 mr-2" />
              </div>
            </div>
          )}
          
          {words.map((word, wordIdx) => (
            <React.Fragment key={wordIdx}>
              {/* Word with characters */}
              <div className="flex">
                {word.characters.map((char, charIdx) => (
                  <span 
                    key={`${wordIdx}-${charIdx}`} 
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
              {wordIdx < words.length - 1 && <span>&nbsp;</span>}
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
      </div>

      {/* Controls */}
      <div className="w-full flex items-center gap-2 flex-wrap p-2 px-0 py-0 my-[8px] mx-0">
        <FocusButton onClick={toggleZenMode} isZenMode={zenMode} shortcut={shortcuts.zenMode} />
        
        {!zenMode && (
          <>
            <button onClick={handleResetTest} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-sm">
              redo ({shortcuts.reset})
            </button>
            
            <button onClick={handleLoadNewQuote} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-sm">
              new ({shortcuts.newQuote})
            </button>
            
            <QuoteUploaderButton onQuotesLoaded={(newQuotes) => {
              onQuotesLoaded(newQuotes);
              refocusAfterInteraction(300); // Longer delay after file upload
            }} />
          </>
        )}
        
        <div className={cn("flex items-center gap-2", zenMode ? "ml-auto" : "ml-auto")}>
          {!zenMode && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Race Animation */}
      {!zenMode && (
        <RaceAnimation 
          totalChars={words.reduce((total, word) => total + word.characters.length + 1, 0) - 1}
          currentCharIndex={words.slice(0, currentWordIndex).reduce((total, word) => total + word.characters.length + 1, 0) + currentCharIndex}
          className="my-4"
        />
      )}
      
      {/* Session Performance Chart */}
      {!zenMode && (
        <SessionWpmChart wpmData={sessionWpmData} />
      )}
    </div>
  );
};

export default TypingArea;
