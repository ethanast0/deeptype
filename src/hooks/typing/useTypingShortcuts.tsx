
import { useEffect } from 'react';

interface UseTypingShortcutsProps {
  loadNewQuote: () => void;
  smartBackspace: () => void;
  focusInput: (delay?: number) => void;
  handleResetTest: () => void;
  toggleZenMode?: () => void;
}

const useTypingShortcuts = ({
  loadNewQuote,
  smartBackspace,
  focusInput,
  handleResetTest,
  toggleZenMode
}: UseTypingShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        loadNewQuote();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
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
  }, [loadNewQuote, smartBackspace, focusInput, handleResetTest, toggleZenMode]);

  return {};
};

export default useTypingShortcuts;
