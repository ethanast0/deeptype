
import { useEffect } from 'react';

interface UseTypingShortcutsProps {
  loadNewQuote: () => void;
  smartBackspace: () => void;
  focusInput: (delay?: number) => void;
  handleResetTest: () => void;
  toggleZenMode?: () => void;
  isActive: boolean;
  isFinished: boolean;
}

const useTypingShortcuts = ({
  loadNewQuote,
  smartBackspace,
  focusInput,
  handleResetTest,
  toggleZenMode,
  isActive,
  isFinished
}: UseTypingShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process shortcuts when in an input field except for our special typing input
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && 
        !target.classList.contains('typing-input')
      ) {
        return;
      }

      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleResetTest(); // First reset the test
        setTimeout(() => loadNewQuote(), 50); // Then load a new quote
      } else if (e.key === 'Backspace' && !isFinished) {
        if (!isActive) {
          e.preventDefault();
        }
        smartBackspace();
      } else if (e.key === ' ' && e.shiftKey) {
        e.preventDefault();
        focusInput(100);
      } else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        handleResetTest();
      } else if (e.key === 'z' && e.ctrlKey) {
        e.preventDefault();
        if (toggleZenMode) {
          toggleZenMode();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote, smartBackspace, focusInput, handleResetTest, toggleZenMode, isActive, isFinished]);

  return {};
};

export default useTypingShortcuts;
