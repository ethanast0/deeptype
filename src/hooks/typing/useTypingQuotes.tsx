
import { useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Word } from '../../utils/typingUtils';

interface UseTypingQuotesProps {
  quotes: string[];
  scriptId?: string | null;
  currentQuote: string;
  setCurrentQuote: React.Dispatch<React.SetStateAction<string>>;
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  setStats: React.Dispatch<React.SetStateAction<any>>;
  processedQuotesRef: React.MutableRefObject<Set<string>>;
  setCurrentQuoteId: React.Dispatch<React.SetStateAction<string | null>>;
  setCompletedQuotes: React.Dispatch<React.SetStateAction<number>>;
  currentWordIndex: number;
  setCurrentWordIndex: React.Dispatch<React.SetStateAction<number>>;
  setCurrentCharIndex: React.Dispatch<React.SetStateAction<number>>;
}

const useTypingQuotes = ({
  quotes,
  scriptId,
  setCurrentQuote,
  setWords,
  setStats,
  processedQuotesRef,
  setCurrentQuoteId,
  setCompletedQuotes,
  currentWordIndex,
  setCurrentWordIndex,
  setCurrentCharIndex
}: UseTypingQuotesProps) => {
  
  const processQuote = useCallback((quote: string) => {
    const processedWords: Word[] = quote.split(' ').map(word => ({
      characters: [...word].map((char, idx) => ({
        char,
        state: idx === 0 && currentWordIndex === 0 ? 'current' : 'inactive'
      }))
    }));
    
    setWords(processedWords);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    
    const totalChars = quote.length;
    setStats(prev => ({ ...prev, totalChars }));
  }, [currentWordIndex, setCurrentCharIndex, setCurrentWordIndex, setStats, setWords]);

  const loadNewQuote = useCallback(async () => {
    setCurrentQuoteId(null);
    
    if (scriptId) {
      try {
        const { data, error } = await supabase
          .from('script_quotes')
          .select('id, content')
          .eq('script_id', scriptId);
          
        if (error || !data || data.length === 0) {
          console.error('Error loading quotes or no quotes found:', error);
          const randomIndex = Math.floor(Math.random() * quotes.length);
          const quote = quotes[randomIndex];
          setCurrentQuote(quote);
          processQuote(quote);
        } else {
          const availableQuotes = data.filter(quote => !processedQuotesRef.current.has(quote.id));
          
          if (availableQuotes.length === 0) {
            processedQuotesRef.current.clear();
            setCompletedQuotes(0);
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomQuote = data[randomIndex];
            setCurrentQuote(randomQuote.content);
            setCurrentQuoteId(randomQuote.id);
            processQuote(randomQuote.content);
          } else {
            const randomIndex = Math.floor(Math.random() * availableQuotes.length);
            const randomQuote = availableQuotes[randomIndex];
            setCurrentQuote(randomQuote.content);
            setCurrentQuoteId(randomQuote.id);
            processQuote(randomQuote.content);
            processedQuotesRef.current.add(randomQuote.id);
          }
        }
      } catch (error) {
        console.error('Error loading quote from database:', error);
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        setCurrentQuote(quote);
        processQuote(quote);
      }
    } else {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const quote = quotes[randomIndex];
      setCurrentQuote(quote);
      processQuote(quote);
    }
  }, [quotes, scriptId, processQuote, setCurrentQuote, setCurrentQuoteId, setCompletedQuotes, processedQuotesRef]);

  return {
    processQuote,
    loadNewQuote
  };
};

export default useTypingQuotes;
