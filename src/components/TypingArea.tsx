
import React, { useEffect } from 'react';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import { cn } from '../lib/utils';
import QuoteUploader from './QuoteUploader';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Upload } from 'lucide-react';

interface TypingAreaProps {
  quotes?: string[];
  className?: string;
  scriptId?: string | null;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  quotes,
  className,
  scriptId
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
    focusInput,
    currentWordIndex,
    currentCharIndex
  } = useTypingTest({
    quotes,
    scriptId
  });

  // Auto-focus on mount and when resetting
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const handleUploadQuotes = (newQuotes: string[]) => {
    if (loadNewQuote && newQuotes.length > 0) {
      loadNewQuote(newQuotes[0]);
    }
  };

  return <div className={cn("typing-area-container", className)}>
      <Stats stats={stats} isActive={isActive} isFinished={isFinished} />
      
      <div className="typing-area flex flex-wrap text-2xl" onClick={focusInput}>
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
        <input ref={inputRef} type="text" className="typing-input" onChange={handleInput} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" aria-label="Typing input" />
      </div>

      <div className="flex gap-4 mt-4">
        <button onClick={resetTest} className="button button-accent bg-slate-850 hover:bg-slate-700 text-gray-400 font-normal text-base">redo</button>
        <button onClick={loadNewQuote} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base">new [shift + enter]</button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => document.getElementById('file-input-upload')?.click()} 
                className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base flex items-center justify-center"
                aria-label="Upload script"
              >
                <Upload size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-gray-300 border-slate-700">
              <p>Upload script (JSON array of strings)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <input 
          id="file-input-upload"
          type="file" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = event => {
                try {
                  const content = event.target?.result as string;
                  const quotes = JSON.parse(content);
                  if (Array.isArray(quotes) && quotes.every(quote => typeof quote === 'string')) {
                    handleUploadQuotes(quotes);
                  }
                } catch (error) {
                  console.error('Error parsing file:', error);
                }
              };
              reader.readAsText(file);
            }
          }} 
          accept=".json" 
          className="hidden" 
        />
      </div>
      
      {/* Move the QuoteUploader to an invisible container */}
      <div className="hidden">
        <QuoteUploader onQuotesLoaded={handleUploadQuotes} />
      </div>
    </div>;
};

export default TypingArea;
