
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
import { typingContent } from '../data/typing_content';
import { gameProgressionService } from '../services/gameProgressionService';
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
  const [levelQuotes, setLevelQuotes] = useState<string[]>(typingContent.level_1);
  const [totalQuotes, setTotalQuotes] = useState(levelQuotes.length);
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState(1);
  const [deathMode, setDeathMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [sessionWpmData, setSessionWpmData] = useState<number[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [levelParameters, setLevelParameters] = useState<any>(null);

  // Fetch user progress and level parameters
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) return;
      
      try {
        // Get user's progress
        const progress = await gameProgressionService.getUserProgress(user.id);
        if (progress) {
          setUserProgress(progress);
          setLevel(progress.currentLevel);
          
          // Get level parameters
          const params = await gameProgressionService.getLevelParameters(progress.currentLevel);
          setLevelParameters(params);
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };
    
    fetchProgressData();
  }, [user]);

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
    baselineWpm
  } = useTypingTest({
    quotes: levelQuotes,
    scriptId,
    deathMode,
    repeatMode,
    onQuoteComplete: async (completedStats) => {
      // Update the current quote number
      setCurrentQuoteNumber(currentQuoteIndex + 1);
      
      // Add WPM to session data for chart
      if (completedStats && completedStats.wpm > 0) {
        setSessionWpmData(prev => [...prev, completedStats.wpm]);
      }
      
      // Update user progress in the database
      if (user && completedStats && scriptId && completedStats.wpm > 0) {
        try {
          // Check if the attempt meets level criteria
          const isSuccessful = meetsCriteria;
          
          // Get the current quote ID (this would need to be passed from the hook)
          const quoteId = "current-quote-id"; // This would need to be properly obtained
          
          // Update progress
          const updatedProgress = await gameProgressionService.updateUserProgress(
            user.id,
            quoteId,
            completedStats.wpm,
            completedStats.accuracy,
            isSuccessful
          );
          
          if (updatedProgress) {
            setUserProgress(updatedProgress);
            
            // If level changed, update the level state
            if (updatedProgress.currentLevel !== level) {
              setLevel(updatedProgress.currentLevel);
              
              // Get new level parameters
              const params = await gameProgressionService.getLevelParameters(updatedProgress.currentLevel);
              setLevelParameters(params);
            }
          }
          
          // Update current quote index in the database
          await gameProgressionService.updateCurrentQuoteIndex(user.id, currentQuoteIndex);
        } catch (error) {
          console.error("Error updating progress:", error);
        }
      }
    }
  });

  // Show the actual quote number in the UI (1-based instead of 0-based index)
  useEffect(() => {
    setCurrentQuoteNumber(currentQuoteIndex + 1);
  }, [currentQuoteIndex]);

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
    setTotalQuotes(levelQuotes.length);
  }, [levelQuotes]);

  // Update level quotes when level changes
  useEffect(() => {
    const newLevelQuotes = typingContent[`level_${level}` as keyof typeof typingContent] as string[];
    if (newLevelQuotes) {
      setLevelQuotes(newLevelQuotes);
      onQuotesLoaded(newLevelQuotes);
    }
  }, [level, onQuotesLoaded]);

  // Handle keyboard shortcuts
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
    // Turn off repeat mode if death mode is turning on
    if (!deathMode) {
      setRepeatMode(false);
    }
    resetTest();
    focusInput();
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => !prev);
    // Turn off death mode if repeat mode is turning on
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

  // Display level info
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

  return <div className={cn("typing-area-container w-full flex flex-col gap-1", className)}>
      {/* Level and Quote Progress Indicator */}
      <div className="w-full mb-2 flex justify-center gap-4">
        <div className="inline-flex gap-2 px-3 py-1 bg-zinc-800 rounded-md text-sm relative group">
          <span className="text-gray-400">Level:</span>
          <span className="text-monkey-accent">{level}</span>
          {/* Show level info on hover */}
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

      {/* Race Animation */}
      <RaceAnimation totalChars={words.reduce((total, word) => total + word.characters.length + 1, 0) - 1} currentCharIndex={words.slice(0, currentWordIndex).reduce((total, word) => total + word.characters.length + 1, 0) + currentCharIndex} className="my-4" />
      
      {/* Session Performance Chart */}
      <SessionWpmChart wpmData={sessionWpmData} />
    </div>;
};

export default TypingArea;
