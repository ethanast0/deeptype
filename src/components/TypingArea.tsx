import React, { useEffect, useState, KeyboardEvent } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Users } from 'lucide-react';
import { scriptService } from '../services/scriptService';

interface QuoteStats {
  id: string;
  typed_count: number;
  unique_typers_count: number;
  avg_wpm: number;
  best_wpm: number;
  avg_accuracy: number;
}

interface TypingAreaProps {
  quotes: string[];
  className?: string;
  scriptId?: string | null;
  quoteIds?: string[]; // Array of quote IDs corresponding to quotes array
  onQuotesLoaded?: (quotes: string[]) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
}

interface ScriptStats {
  typed_count: number;
  unique_typers_count: number;
  avg_wpm: number;
  best_wpm: number;
  avg_accuracy: number;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  quotes,
  className,
  scriptId,
  quoteIds = [],
  onQuotesLoaded = () => {},
  onTypingStateChange = () => {}
}) => {
  const [scriptStats, setScriptStats] = useState<ScriptStats | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteStats[]>([]);

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
    currentCharIndex
  } = useTypingTest({
    quotes,
    scriptId,
    quoteIds
  });

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Shift+Enter for new quote
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      loadNewQuote();
    }
    // Tab key to restart
    else if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
    }
  };

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput();
    
    // Add event listener for clicks to focus the input
    const handleGlobalClick = () => focusInput();
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [focusInput]);

  // Update typing state when active state changes
  useEffect(() => {
    onTypingStateChange(isActive);
  }, [isActive, onTypingStateChange]);

  // Load script stats when scriptId changes
  useEffect(() => {
    const loadScriptStats = async () => {
      if (!scriptId) {
        setScriptStats(null);
        setQuoteStats([]);
        return;
      }

      try {
        // Use getScriptStats instead of getScripts for this specific scriptId
        const stats = await scriptService.getScriptStats(scriptId);
        
        if (stats) {
          setScriptStats({
            typed_count: stats.typed_count || 0,
            unique_typers_count: stats.unique_typers_count || 0,
            avg_wpm: stats.average_wpm || 0,
            best_wpm: stats.best_wpm || 0,
            avg_accuracy: stats.average_wpm || 0  // Using average_wpm as fallback since there's no average_accuracy
          });
        } else {
          // Fallback to empty stats if script not found
          setScriptStats({
            typed_count: 0,
            unique_typers_count: 0,
            avg_wpm: 0,
            best_wpm: 0,
            avg_accuracy: 0
          });
        }
        
        setQuoteStats([]);
      } catch (error) {
        console.error('Error loading script stats:', error);
        setScriptStats(null);
        setQuoteStats([]);
      }
    };

    loadScriptStats();
  }, [scriptId]);

  // Render the typing content
  const renderTypingContent = () => {
    return words.map((word, wordIndex) => {
      // For each word
      const wordElement = (
        <div key={`word-${wordIndex}`} className="flex items-center">
          <div className="flex">
            {/* Render each character in the word */}
            {word.characters.map((char, charIndex) => (
              <span
                key={`char-${wordIndex}-${charIndex}`}
                className={cn("character", {
                  "text-monkey-accent": char.state === 'correct',
                  "text-monkey-error": char.state === 'incorrect',
                  "character-current": wordIndex === currentWordIndex && charIndex === currentCharIndex
                })}
              >
                {char.char}
              </span>
            ))}
          </div>
          {/* Add space after word (except last word) */}
          {wordIndex < words.length - 1 && <span>&nbsp;</span>}
        </div>
      );
      
      return wordElement;
    });
  };

  return (
    <div className={cn("typing-area-container w-full", className)}>
      <div className="w-full flex flex-col">
        {/* Top stats bar */}
        <div className="flex justify-between items-center w-full mb-4">
          <Stats 
            stats={stats} 
            isActive={isActive} 
            isFinished={isFinished}
          />
          
          {/* Global stats */}
          <div className={cn(
            "flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded",
            {
              "animate-slide-up": isActive || isFinished
            }
          )}>
            <span>
              <span className="font-medium text-monkey-text">{scriptStats?.avg_wpm || 0}</span>{" wpm"}
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              <span className="font-medium text-monkey-text">{scriptStats?.typed_count || 0}</span>{" typed"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Typing area */}
      <div className="relative">
        <div 
          className="typing-area flex flex-wrap text-3xl" 
          onClick={focusInput}
        >
          {renderTypingContent()}
          
          <input
            ref={inputRef}
            type="text"
            className="typing-input"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            aria-label="Typing input"
          />
        </div>

        {/* Typers count at bottom right */}
        <div className="absolute -bottom-6 right-0 flex items-center gap-2 text-xs text-monkey-subtle">
          <Users className="h-3 w-3" />
          <span>{scriptStats?.unique_typers_count || 0} people typed this</span>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-4 mt-12">
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
      </div>
    </div>
  );
};

export default TypingArea;