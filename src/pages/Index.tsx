
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import QuoteUploader from '../components/QuoteUploader';
import TemplateMenu from '../components/TemplateMenu';
import { defaultQuotes } from '../utils/typingUtils';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(defaultQuotes);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Handle template selection
  const handleTemplateSelected = (templateQuotes: string[], scriptId?: string) => {
    setQuotes(templateQuotes);
    if (scriptId) {
      setActiveScriptId(scriptId);
    } else {
      setActiveScriptId(null);
    }
  };

  // Handle quotes loaded from uploader
  const handleQuotesLoaded = (newQuotes: string[]) => {
    setQuotes(newQuotes);
    setActiveScriptId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-lg text-monkey-subtle mb-2">type your favorite things</h2>
        </div>
        
        <div className="w-full">
          <TemplateMenu onSelectTemplate={handleTemplateSelected} />
          <TypingArea quotes={quotes} scriptId={activeScriptId} />
        </div>
        
        <QuoteUploader onQuotesLoaded={handleQuotesLoaded} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
