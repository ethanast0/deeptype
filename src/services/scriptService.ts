
import { supabase } from '../integrations/supabase/client';

export interface SavedScript {
  id: string;
  name: string;
  quotes: string[];
  userId: string;
  createdAt: string;
  category?: string;
}

// Constants for script management
const MAX_USER_SCRIPTS = 5;

// Helper functions for script storage
export const scriptService = {
  // Get scripts from Supabase
  getScripts: async (userId: string): Promise<SavedScript[]> => {
    try {
      const { data: scripts, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching scripts from Supabase:', error);
        return [];
      }
      
      // Now we need to fetch quotes for each script
      const scriptsWithQuotes = await Promise.all(
        scripts.map(async (script) => {
          const { data: quotes, error: quotesError } = await supabase
            .from('script_quotes')
            .select('content')
            .eq('script_id', script.id)
            .order('quote_index', { ascending: true });
          
          if (quotesError) {
            console.error(`Error fetching quotes for script ${script.id}:`, quotesError);
            return {
              id: script.id,
              name: script.name,
              quotes: [],
              userId: script.user_id,
              createdAt: script.created_at,
              category: script.category
            };
          }
          
          return {
            id: script.id,
            name: script.name,
            quotes: quotes.map(q => q.content),
            userId: script.user_id,
            createdAt: script.created_at,
            category: script.category
          };
        })
      );
      
      return scriptsWithQuotes;
    } catch (error) {
      console.error('Error fetching scripts:', error);
      return [];
    }
  },
  
  // Save script to Supabase
  saveScript: async (userId: string, name: string, quotes: string[], category: string = 'Custom'): Promise<SavedScript | null> => {
    try {
      // Check if user already has 5 scripts
      const existingScripts = await scriptService.getScripts(userId);
      
      if (existingScripts.length >= MAX_USER_SCRIPTS) {
        return null;
      }
      
      // Insert script to Supabase
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          name: name,
          content: JSON.stringify(quotes), // Keep content for backward compatibility
          category
        })
        .select()
        .single();
      
      if (scriptError) {
        console.error('Error saving script to Supabase:', scriptError);
        return null;
      }
      
      // Now insert each quote separately
      const quoteInserts = quotes.map((quote, index) => ({
        script_id: scriptData.id,
        content: quote,
        quote_index: index
      }));
      
      const { error: quotesError } = await supabase
        .from('script_quotes')
        .insert(quoteInserts);
      
      if (quotesError) {
        console.error('Error saving quotes to Supabase:', quotesError);
        // Consider rolling back the script insert here
      }
      
      // Return in SavedScript format
      return {
        id: scriptData.id,
        name: scriptData.name,
        quotes: quotes,
        userId: scriptData.user_id,
        createdAt: scriptData.created_at,
        category: scriptData.category
      };
    } catch (error) {
      console.error('Error saving script:', error);
      return null;
    }
  },
  
  // Update script in Supabase
  updateScript: async (script: SavedScript): Promise<boolean> => {
    try {
      // Update the script entry
      const { error: scriptError } = await supabase
        .from('scripts')
        .update({
          name: script.name,
          content: JSON.stringify(script.quotes), // Keep content for backward compatibility
          category: script.category || 'Custom'
        })
        .eq('id', script.id);
      
      if (scriptError) {
        console.error('Error updating script in Supabase:', scriptError);
        return false;
      }
      
      // Delete existing quotes
      const { error: deleteError } = await supabase
        .from('script_quotes')
        .delete()
        .eq('script_id', script.id);
      
      if (deleteError) {
        console.error('Error deleting existing quotes:', deleteError);
        return false;
      }
      
      // Insert new quotes
      const quoteInserts = script.quotes.map((quote, index) => ({
        script_id: script.id,
        content: quote,
        quote_index: index
      }));
      
      const { error: quotesError } = await supabase
        .from('script_quotes')
        .insert(quoteInserts);
      
      if (quotesError) {
        console.error('Error inserting updated quotes:', quotesError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating script:', error);
      return false;
    }
  },
  
  // Delete script from Supabase
  deleteScript: async (scriptId: string): Promise<boolean> => {
    try {
      // With cascade delete, this will also delete the quotes
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);
      
      if (error) {
        console.error('Error deleting script from Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting script:', error);
      return false;
    }
  },
  
  // Get system templates is not needed as templates are handled separately
  getTemplates: (): SavedScript[] => {
    return [];
  },

  // Record typing history in Supabase
  recordTypingHistory: async (userId: string, scriptId: string, wpm: number, accuracy: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('typing_history')
        .insert({
          user_id: userId,
          script_id: scriptId,
          wpm,
          accuracy,
          elapsed_time: 0 // Required field in the new schema
        });
      
      if (error) {
        console.error('Error recording typing history to Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error recording typing history:', error);
      return false;
    }
  },

  // Get typing history from Supabase
  getTypingHistory: async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching typing history from Supabase:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  }
};
