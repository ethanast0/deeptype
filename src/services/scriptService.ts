import { supabase } from '../integrations/supabase/client';

export interface SavedScript {
  id: string;
  name: string;
  quotes: string[];
  userId: string;
  createdAt: string;
  category?: string;
  stats?: {
    typed_count: number;
    unique_typers_count: number;
    average_wpm: number;
    average_accuracy: number;
  };
}

// Constants for script management
const MAX_USER_SCRIPTS = 5;

// Helper functions for script storage
export const scriptService = {
  // Get top scripts from script_views
  getTopScripts: async (limit: number = 5): Promise<SavedScript[]> => {
    try {
      const { data, error } = await supabase
        .from('script_views')
        .select('*')
        .order('unique_typers_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top scripts:', error);
        return [];
      }

      return data.map(script => ({
        id: script.id,
        name: script.title,
        quotes: JSON.parse(script.content),
        userId: script.user_id,
        createdAt: script.created_at,
        category: script.category,
        stats: {
          typed_count: script.typed_count,
          unique_typers_count: script.unique_typers_count,
          average_wpm: script.average_wpm,
          average_accuracy: script.average_accuracy
        }
      }));
    } catch (error) {
      console.error('Error fetching top scripts:', error);
      return [];
    }
  },

  // Save script to user's saved scripts
  saveToFavorites: async (scriptId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_scripts')
        .insert({ script_id: scriptId });

      if (error) {
        console.error('Error saving script to favorites:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving to favorites:', error);
      return false;
    }
  },

  // Remove script from user's saved scripts
  removeFromFavorites: async (scriptId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_scripts')
        .delete()
        .eq('script_id', scriptId);

      if (error) {
        console.error('Error removing script from favorites:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  },

  // Get user's saved scripts
  getSavedScripts: async (): Promise<SavedScript[]> => {
    try {
      const { data, error } = await supabase
        .from('script_views')
        .select('*')
        .eq('is_saved', true);

      if (error) {
        console.error('Error fetching saved scripts:', error);
        return [];
      }

      return data.map(script => ({
        id: script.id,
        name: script.title,
        quotes: JSON.parse(script.content),
        userId: script.user_id,
        createdAt: script.created_at,
        category: script.category,
        stats: {
          typed_count: script.typed_count,
          unique_typers_count: script.unique_typers_count,
          average_wpm: script.average_wpm,
          average_accuracy: script.average_accuracy
        }
      }));
    } catch (error) {
      console.error('Error fetching saved scripts:', error);
      return [];
    }
  },

  // Get scripts from Supabase
  getScripts: async (userId: string): Promise<SavedScript[]> => {
    try {
      const { data, error } = await supabase
        .from('script_views')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching scripts:', error);
        return [];
      }
      
      return data.map(script => ({
        id: script.id,
        name: script.title,
        quotes: JSON.parse(script.content),
        userId: script.user_id,
        createdAt: script.created_at,
        category: script.category,
        stats: {
          typed_count: script.typed_count,
          unique_typers_count: script.unique_typers_count,
          average_wpm: script.average_wpm,
          average_accuracy: script.average_accuracy
        }
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
