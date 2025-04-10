
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import PanelManager from '../components/PanelManager';
import { typingContent } from '../data/typing_content';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(typingContent.level_1);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const setupDefaultScript = async () => {
      if (!user) return;
      try {
        const { data: scripts, error } = await supabase
          .from('scripts')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', 'Quantum Computing - Level 1')
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching default script:', error);
          return;
        }
        
        let scriptId: string;
        if (scripts) {
          scriptId = scripts.id;
        } else {
          const { data: newScript, error: createError } = await supabase
            .from('scripts')
            .insert({
              user_id: user.id,
              name: 'Quantum Computing - Level 1',
              content: JSON.stringify(typingContent.level_1),
              category: 'Quantum Computing'
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating default script:', createError);
            return;
          }
          
          scriptId = newScript.id;

          // Insert quotes into script_quotes table sequentially with index
          const quoteInserts = typingContent.level_1.map((quote, index) => ({
            script_id: scriptId,
            content: quote,
            quote_index: index
          }));
          
          const { error: quotesError } = await supabase
            .from('script_quotes')
            .insert(quoteInserts);
            
          if (quotesError) {
            console.error('Error saving default quotes:', quotesError);
          }
        }
        
        setActiveScriptId(scriptId);

        // Fetch quotes from script_quotes table in order
        const { data: quoteData, error: quotesError } = await supabase
          .from('script_quotes')
          .select('content')
          .eq('script_id', scriptId)
          .order('quote_index', { ascending: true });
          
        if (quotesError) {
          console.error('Error fetching quotes:', quotesError);
          return;
        }
        
        if (quoteData && quoteData.length > 0) {
          setQuotes(quoteData.map(q => q.content));
        }
      } catch (error) {
        console.error('Unexpected error during script setup:', error);
      }
    };

    if (user) {
      setupDefaultScript();
    }
  }, [user]);

  const handleQuotesLoaded = (newQuotes: string[]) => {
    setQuotes(newQuotes);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-5 overflow-auto">
        <div className="typing-panels-container flex flex-col gap-6">
          <TypingArea 
            quotes={quotes} 
            scriptId={activeScriptId} 
            onQuotesLoaded={handleQuotesLoaded} 
            onTypingStateChange={setIsTyping} 
          />
          
          {/* Add the PanelManager component */}
          <PanelManager />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
