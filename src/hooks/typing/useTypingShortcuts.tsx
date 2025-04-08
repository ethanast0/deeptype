
import { useEffect } from 'react';

interface UseTypingShortcutsProps {
  loadNewQuote: () => void;
  smartBackspace: () => void;
  focusInput: (delay?: number) => void;
}

const useTypingShortcuts = ({
  loadNewQuote,
  smartBackspace,
  focusInput
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
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadNewQuote, smartBackspace, focusInput]);

  return {};
};

export default useTypingShortcuts;
