
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import QuoteUploader from '../components/QuoteUploader';
import TemplateMenu from '../components/TemplateMenu';
import { defaultQuotes } from '../utils/typingUtils';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(defaultQuotes);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  
  // Force a refresh when user changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [user]);
  
  const handleQuotesLoaded = (newQuotes: string[]) => {
    setQuotes(newQuotes);
  };
  
  const handleTemplateSelected = (templateQuotes: string[]) => {
    setQuotes(templateQuotes);
  };

  // This will cause the TemplateMenu to re-render and fetch the latest scripts
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-lg text-monkey-subtle mb-2">type your favorite things</h2>
        </div>
        
        <TemplateMenu 
          key={refreshKey} 
          onSelectTemplate={handleTemplateSelected} 
        />
        
        <TypingArea quotes={quotes} />
        
        <QuoteUploader onQuotesLoaded={handleQuotesLoaded} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
