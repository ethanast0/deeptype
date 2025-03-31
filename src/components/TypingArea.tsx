import React, { useEffect, useState } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Users } from 'lucide-react';
import { scriptService, QuoteStats } from '../services/scriptService';

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

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput();
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
        const script = await scriptService.getScripts({ limit: 1 });
        if (script.length > 0) {
          const { typed_count, unique_typers_count, stats, quote_stats } = script[0];
          setScriptStats({
            typed_count,
            unique_typers_count,
            avg_wpm: stats?.avg_wpm || 0,
            best_wpm: stats?.best_wpm || 0,
            avg_accuracy: stats?.avg_accuracy || 0
          });
          setQuoteStats(quote_stats || []);
        }
      } catch (error) {
        console.error('Error loading script stats:', error);
        setScriptStats(null);
        setQuoteStats([]);
      }
    };

    loadScriptStats();
  }, [scriptId]);

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
        <div className="typing-area flex flex-wrap text-3xl" onClick={focusInput}>
          {words.map((word, wordIndex) => (
            <React.Fragment key={wordIndex}>
              <div className="flex">
                {word.characters.map((char, charIndex) => (
                  <span
                    key={`${wordIndex}-${charIndex}`}
                    className={cn("character", {
                      "text-monkey-accent": char.state === 'correct',
                      "text-monkey-error": char.state === 'incorrect',
                      "character-current": char.state === 'current'
                    })}
                  >
                    {wordIndex === currentWordIndex && charIndex === currentCharIndex && (
                      <span className="caret" />
                    )}
                    {char.char}
                  </span>
                ))}
              </div>
              {wordIndex < words.length - 1 && <span>&nbsp;</span>}
            </React.Fragment>
          ))}
          
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