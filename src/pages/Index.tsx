
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import PanelManager from '../components/PanelManager';
import { typingContent } from '../data/typing_content';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import LevelCompletionModal from '../components/LevelCompletionModal';
import useGameProgression from '../hooks/useGameProgression';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';

const Index = () => {
  const [quotes, setQuotes] = useState<string[]>(typingContent.level_1);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const { user } = useAuth();
  
  // Use the game progression hook
  const { 
    userProgress, 
    levelParameters,
    showCompletionModal,
    setShowCompletionModal,
    resetProgress
  } = useGameProgression();

  useEffect(() => {
    console.log("Index component mounted");
    
    // Development mode only
    if (process.env.NODE_ENV === 'development') {
      const debugMode = localStorage.getItem('debugMode') === 'true';
      setIsDebugMode(debugMode);
    }

    const setupDefaultScript = async () => {
      if (!user) return;
      try {
        console.log("Setting up default script for user:", user.id);
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
          console.log("Found existing script with ID:", scriptId);
        } else {
          console.log("Creating new default script");
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
          console.log("Created new script with ID:", scriptId);

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
          } else {
            console.log("Quotes inserted successfully");
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
          console.log(`Loaded ${quoteData.length} quotes from script`);
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
    console.log(`New quotes loaded: ${newQuotes.length} quotes`);
    setQuotes(newQuotes);
  };

  const handleResetProgress = async () => {
    if (!user) return;
    
    try {
      const newProgress = await resetProgress(user.id);
      if (newProgress) {
        toast({
          title: "Progress Reset",
          description: "Your game progress has been reset to level 1.",
          variant: "default",
        });
      } else {
        toast({
          title: "Reset Failed",
          description: "Unable to reset your progress. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during reset:", error);
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Determine if we should show the level completion modal
  const renderLevelCompletionModal = () => {
    if (!userProgress || !showCompletionModal) return null;
    
    const currentLevel = userProgress.currentLevel - 1; // Show the completed level
    const nextLevel = userProgress.currentLevel;
    const nextLevelThreshold = userProgress.baselineWpm 
      ? Math.ceil(userProgress.baselineWpm * (nextLevel === 1 ? 0.5 : 0.4 + (nextLevel * 0.1)))
      : null;
    
    return (
      <LevelCompletionModal 
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        levelNumber={currentLevel}
        bestWpm={userProgress.levelBestWpm}
        nextLevelNumber={nextLevel}
        nextLevelThreshold={nextLevelThreshold}
        onAfterClose={() => {
          // Ensure typing area is refocused after modal closes
          document.querySelector('.typing-input')?.focus();
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-5 overflow-auto">
        {isDebugMode && (
          <div className="mb-4 bg-zinc-800 p-2 rounded-md text-xs">
            <div className="flex justify-between items-center">
              <div>
                <p>Debug Mode Active</p>
                {userProgress && (
                  <div className="mt-1">
                    <p>Level: {userProgress.currentLevel}</p>
                    <p>Quote Index: {userProgress.currentQuoteIndex}</p>
                    <p>Successful Quotes: {userProgress.successfulQuotesCount}</p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleResetProgress} 
                variant="destructive" 
                size="sm"
                className="text-xs"
              >
                Reset Progress
              </Button>
            </div>
          </div>
        )}
        
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
      
      {/* Level completion modal */}
      {renderLevelCompletionModal()}
      
      <Footer />
    </div>
  );
};

export default Index;
