
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
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching scripts from Supabase:', error);
        return [];
      }
      
      // Transform data to SavedScript format
      return data.map(script => ({
        id: script.id,
        name: script.title,
        quotes: JSON.parse(script.content),
        userId: script.user_id,
        createdAt: script.created_at,
        category: script.category
      }));
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
      const { data, error } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          title: name,
          content: JSON.stringify(quotes),
          category,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving script to Supabase:', error);
        return null;
      }
      
      // Return in SavedScript format
      return {
        id: data.id,
        name: data.title,
        quotes: JSON.parse(data.content),
        userId: data.user_id,
        createdAt: data.created_at,
        category: data.category
      };
    } catch (error) {
      console.error('Error saving script:', error);
      return null;
    }
  },
  
  // Update script in Supabase
  updateScript: async (script: SavedScript): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scripts')
        .update({
          title: script.name,
          content: JSON.stringify(script.quotes),
          category: script.category || 'Custom'
        })
        .eq('id', script.id);
      
      if (error) {
        console.error('Error updating script in Supabase:', error);
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
          speed_wpm: wpm,
          accuracy
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
