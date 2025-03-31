
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import TemplateMenu from '../components/TemplateMenu';
import { defaultQuotes } from '../utils/typingUtils';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(defaultQuotes);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  useEffect(() => {
    const setupDefaultScript = async () => {
      if (!user) return;
      try {
        const {
          data: scripts,
          error
        } = await supabase.from('scripts').select('id').eq('user_id', user.id).eq('title', 'Default').maybeSingle();
        if (error) {
          console.error('Error fetching default script:', error);
          return;
        }
        if (scripts) {
          setActiveScriptId(scripts.id);
        } else {
          const {
            data: newScript,
            error: createError
          } = await supabase.from('scripts').insert({
            user_id: user.id,
            title: 'Default',
            content: JSON.stringify(defaultQuotes),
            category: 'Default',
            created_by: user.id
          }).select().single();
          if (createError) {
            console.error('Error creating default script:', createError);
            return;
          }
          setActiveScriptId(newScript.id);
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

  const handleTemplateSelected = (templateQuotes: string[], scriptId?: string) => {
    setQuotes(templateQuotes);
    if (scriptId) {
      setActiveScriptId(scriptId);
    }
  };

  return <div className="min-h-screen flex flex-col bg-zinc-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-3xl mx-auto">
          <TemplateMenu onSelectTemplate={handleTemplateSelected} />
        </div>
        
        <div className="w-full flex-1 flex items-center justify-center my-6">
          <TypingArea 
            quotes={quotes} 
            scriptId={activeScriptId} 
            onQuotesLoaded={handleQuotesLoaded}
            className="w-full max-w-3xl"
          />
        </div>
        
        <div className="mt-auto pb-4 text-center">
          <h2 className="text-sm text-monkey-subtle italic">for those who know typing bends time</h2>
        </div>
      </main>
      
      <Footer />
    </div>;
};

export default Index;
