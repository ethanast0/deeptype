
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import QuoteUploader from '../components/QuoteUploader';
import TemplateMenu from '../components/TemplateMenu';
import { defaultQuotes } from '../utils/typingUtils';
import templates from '../data/templates';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(defaultQuotes);
  
  const handleQuotesLoaded = (newQuotes: string[]) => {
    setQuotes(newQuotes);
  };
  
  const handleTemplateSelected = (templateQuotes: string[]) => {
    setQuotes(templateQuotes);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-lg text-monkey-subtle mb-2">type your favorite things</h2>
        </div>
        
        <TemplateMenu onSelectTemplate={handleTemplateSelected} />
        
        <TypingArea quotes={quotes} />
        
        <QuoteUploader onQuotesLoaded={handleQuotesLoaded} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
