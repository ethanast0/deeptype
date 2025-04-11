
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTypingTest from '../hooks/useTypingTest';
import Stats from './Stats';
import HistoricalStats from './HistoricalStats';
import { cn } from '../lib/utils';
import { QuoteUploaderButton } from './QuoteUploader';
import { Toggle } from './ui/toggle';
import { SkullIcon, SmileIcon, RepeatIcon, DeleteIcon } from 'lucide-react';
import SessionWpmChart from './SessionWpmChart';
import RaceAnimation from './RaceAnimation';
import { gameProgressionService } from '../services/gameProgressionService';
import { contentService, Content } from '../services/contentService';
import { toast } from '../hooks/use-toast';

interface TypingAreaProps {
  quotes?: string[];
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
  const [level, setLevel] = useState(1);
  const [levelQuotes, setLevelQuotes] = useState<string[]>([]);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState(1);
  const [deathMode, setDeathMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [sessionWpmData, setSessionWpmData] = useState<number[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [levelParameters, setLevelParameters] = useState<any>(null);
  const [levelContent, setLevelContent] = useState<Content[]>([]);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) return;
      
      try {
        const progress = await gameProgressionService.getUserProgress(user.id);
        if (progress) {
          setUserProgress(progress);
          setLevel(progress.currentLevel);
          
          const params = await gameProgressionService.getLevelParameters(progress.currentLevel);
          setLevelParameters(params);
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };
    
    fetchProgressData();
  }, [user]);

  useEffect(() => {
    const loadLevelContent = async () => {
      try {
        const content = await contentService.getContentForLevel(level);
        if (content && content.length > 0) {
          setLevelContent(content);
          setTotalQuotes(content.length);
          
          const textContent = content.map(item => item.content);
          setLevelQuotes(textContent);
          onQuotesLoaded(textContent);
        }
      } catch (error) {
        console.error("Error loading level content:", error);
      }
    };
    
    loadLevelContent();
  }, [level, onQuotesLoaded]);

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
    currentQuoteIndex,
    meetsCriteria,
    baselineWpm,
    currentContent
  } = useTypingTest({
    level,
    quotes: levelQuotes,
    scriptId,
    deathMode,
    repeatMode,
    onQuoteComplete: async (completedStats, contentId) => {
      if (currentContent) {
        setCurrentQuoteNumber(currentContent.quote_index);
      } else {
        setCurrentQuoteNumber(currentQuoteIndex + 1);
      }
      
      if (completedStats && completedStats.wpm > 0) {
        setSessionWpmData(prev => [...prev, completedStats.wpm]);
      }
      
      if (user && completedStats && completedStats.wpm > 0) {
        try {
          const isSuccessful = meetsCriteria;
          
          const quoteId = currentContent?.id || "current-quote-id";
          
          const updatedProgress = await gameProgressionService.updateUserProgress(
            user.id,
            quoteId,
            completedStats.wpm,
            completedStats.accuracy,
            isSuccessful
          );
          
          if (updatedProgress) {
            setUserProgress(updatedProgress);
            
            if (updatedProgress.currentLevel !== level) {
              setLevel(updatedProgress.currentLevel);
              
              const params = await gameProgressionService.getLevelParameters(updatedProgress.currentLevel);
              setLevelParameters(params);
            }
          }
          
          if (currentContent) {
            await gameProgressionService.updateCurrentQuoteIndex(user.id, currentContent.quote_index);
          } else {
            await gameProgressionService.updateCurrentQuoteIndex(user.id, currentQuoteIndex);
          }
        } catch (error) {
          console.error("Error updating progress:", error);
        }
      }
    }
  });

  useEffect(() => {
    if (currentContent) {
      setCurrentQuoteNumber(currentContent.quote_index);
    } else {
      setCurrentQuoteNumber(currentQuoteIndex + 1);
    }
  }, [currentContent, currentQuoteIndex]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    onTypingStateChange(isActive);
  }, [isActive, onTypingStateChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        loadNewQuote();
      } else if (e.key === 'Backspace' && e.shiftKey) {
        e.preventDefault();
        resetTest();
        focusInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote, resetTest, focusInput]);

  const toggleDeathMode = () => {
    setDeathMode(prev => !prev);
    if (!deathMode) {
      setRepeatMode(false);
    }
    resetTest();
    focusInput();
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => !prev);
    if (!repeatMode) {
      setDeathMode(false);
    }
    resetTest();
    focusInput();
  };

  const handleResetClick = () => {
    resetTest();
    focusInput();
  };

  const renderLevelInfo = () => {
    if (!userProgress || !levelParameters) return null;
    
    const requiredWpm = userProgress.baselineWpm 
      ? Math.round(userProgress.baselineWpm * levelParameters.wpmThresholdMultiplier) 
      : 'N/A';
    
    return (
      <div className="level-info-tooltip absolute left-0 top-full mt-2 bg-zinc-800 p-2 rounded-md shadow-lg z-10 text-xs">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="text-gray-400">Required WPM:</span>
          <span className="text-monkey-accent">{requiredWpm}</span>
          
          <span className="text-gray-400">Required Accuracy:</span>
          <span className="text-monkey-accent">{levelParameters.accuracyThreshold}%</span>
          
          <span className="text-gray-400">Successful Quotes:</span>
          <span className="text-monkey-accent">{userProgress.successfulQuotesCount} / {levelParameters.requiredQuotes}</span>
          
          <span className="text-gray-400">Attempts Used:</span>
          <span className="text-monkey-accent">{userProgress.levelAttemptsUsed} / {levelParameters.maxAttempts}</span>
          
          <span className="text-gray-400">Best WPM:</span>
          <span className="text-monkey-accent">{userProgress.levelBestWpm || '-'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("typing-area-container w-full flex flex-col gap-1", className)}>
      <div className="w-full mb-2 flex justify-center gap-4">
        <div className="inline-flex gap-2 px-3 py-1 bg-zinc-800 rounded-md text-sm relative group">
          <span className="text-gray-400">Level:</span>
          <span className="text-monkey-accent">{level}</span>
          <span className="text-xs text-gray-500 cursor-help">(i)</span>
          <div className="hidden group-hover:block">
            {renderLevelInfo()}
          </div>
        </div>
        <div className="inline-flex gap-2 px-3 py-1 bg-zinc-800 rounded-md text-sm">
          <span className="text-gray-400">Quote:</span>
          <span className="text-monkey-accent">{currentQuoteNumber}</span>
          <span className="text-gray-400">of</span>
          <span className="text-gray-400">{totalQuotes}</span>
        </div>
      </div>
      
      <div className="w-full flex justify-between items-center p-2 px-0 py-0 my-0">
        <Stats stats={stats} isActive={isActive} isFinished={isFinished} className="self-start" deathMode={deathMode} deathModeFailures={deathModeFailures} repeatMode={repeatMode} />
        {user && <HistoricalStats className="self-end" displayAccuracy={false} />}
      </div>
      
      <div className="w-full p-4 px-0 py-0 bg-inherit">
        <div className="typing-area flex flex-wrap text-2xl" onClick={focusInput}>
          {words.map((word, wordIndex) => {
            return (
              <React.Fragment key={wordIndex}>
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
                {wordIndex < words.length - 1 && <span>&nbsp;</span>}
              </React.Fragment>
            );
          })}
          
          <input 
            ref={inputRef} 
            type="text" 
            className="typing-input opacity-0 absolute" 
            onChange={handleInput} 
            autoComplete="off" 
            autoCapitalize="off" 
            autoCorrect="off" 
            spellCheck="false" 
            aria-label="Typing input" 
          />
        </div>
      </div>

      <div className="w-full flex items-center gap-2 p-2 px-0 py-0 my-[8px] mx-0">
        <button onClick={handleResetClick} className="button button-accent text-gray-400 font-normal text-sm flex items-center gap-1 bg-teal-900 hover:bg-teal-800">
          redo [shift + ⌫] <DeleteIcon className="h-3.5 w-3.5" />
        </button>
        <button onClick={loadNewQuote} className="button button-accent text-gray-400 font-normal text-sm bg-zinc-900 hover:bg-zinc-800">
          new [shift + enter]
        </button>
        <QuoteUploaderButton onQuotesLoaded={onQuotesLoaded} />
        
        <div className="ml-auto flex items-center gap-2">
          <Toggle pressed={repeatMode} onPressedChange={toggleRepeatMode} aria-label={repeatMode ? "Repeat Mode On" : "Repeat Mode Off"} className="bg-zinc-900 hover:bg-slate-700 data-[state=on]:bg-green-900">
            <RepeatIcon className="w-4 h-4" />
          </Toggle>
          
          <Toggle pressed={deathMode} onPressedChange={toggleDeathMode} aria-label={deathMode ? "Death Mode" : "Normal Mode"} className="bg-zinc-900 hover:bg-slate-800 data-[state=on]:bg-red-900">
            {deathMode ? <SkullIcon className="w-4 h-4" /> : <SmileIcon className="w-4 h-4" />}
          </Toggle>
        </div>
      </div>

      <RaceAnimation totalChars={words.reduce((total, word) => total + word.characters.length + 1, 0) - 1} currentCharIndex={words.slice(0, currentWordIndex).reduce((total, word) => total + word.characters.length + 1, 0) + currentCharIndex} className="my-4" />
      
      <SessionWpmChart wpmData={sessionWpmData} />
    </div>
  );
};

export default TypingArea;
