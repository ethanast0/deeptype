
import { useCallback, useRef } from 'react';

interface UseTypingFocusProps {
  inputRef: React.RefObject<HTMLInputElement>;
  currentCharIndex: number;
}

const useTypingFocus = ({ inputRef, currentCharIndex }: UseTypingFocusProps) => {
  const focusTimeoutRef = useRef<number | null>(null);

  const focusInput = useCallback((delay = 0) => {
    if (focusTimeoutRef.current !== null) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    
    const focusFunction = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (currentCharIndex > 0) {
          inputRef.current.selectionStart = currentCharIndex;
          inputRef.current.selectionEnd = currentCharIndex;
        }
      }
    };
    
    if (delay > 0) {
      focusTimeoutRef.current = window.setTimeout(focusFunction, delay);
    } else {
      focusFunction();
    }
  }, [currentCharIndex, inputRef]);

  return { focusInput };
};

export default useTypingFocus;
