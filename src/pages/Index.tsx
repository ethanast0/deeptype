import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import QuoteUploader from '../components/QuoteUploader';
import { defaultQuotes } from '../utils/typingUtils';
const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(defaultQuotes);
  const handleQuotesLoaded = (newQuotes: string[]) => {
    setQuotes(newQuotes);
  };
  return <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-lg text-monkey-subtle mb-2">type your favorite things</h2>
          <p className="text-sm text-monkey-subtle opacity-70">
            click anywhere on the text area to focus and start typing
          </p>
        </div>
        
        <TypingArea quotes={quotes} />
        
        <QuoteUploader onQuotesLoaded={handleQuotesLoaded} />
      </main>
      
      <Footer />
    </div>;
};
export default Index;