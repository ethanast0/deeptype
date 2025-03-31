import { supabase } from '../integrations/supabase/client';

export interface SavedScript {
  id: string;
  name: string;
  content: string;
  quotes: string[];
  category: string;
  created_at: string;
  user_id: string;
  is_featured: boolean;
  saves_count: number;
  typed_count: number;
  unique_typers_count: number;
  stats?: {
    avg_wpm: number;
    best_wpm: number;
    avg_accuracy: number;
  };
}

interface GetScriptsOptions {
  is_featured?: boolean;
  orderBy?: string;
  limit?: number;
}

interface ScriptRow {
  id: string;
  name: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
  is_featured: boolean;
  saves_count: number;
  typed_count: number;
  unique_typers_count: number;
  script_views?: Array<{
    avg_wpm: number;
    best_wpm: number;
    avg_accuracy: number;
  }>;
}

interface SavedScriptRow {
  script: ScriptRow;
}

// Constants for script management
const MAX_USER_SCRIPTS = 5;

// Helper functions for script storage
export const scriptService = {
  async getScripts(options: GetScriptsOptions = {}): Promise<SavedScript[]> {
    let query = supabase
      .from('scripts')
      .select('*, script_views(avg_wpm, best_wpm, avg_accuracy)');

    if (options.is_featured) {
      query = query.eq('is_featured', true);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scripts:', error);
      return [];
    }

    return (data as unknown as ScriptRow[]).map(script => ({
      ...script,
      quotes: script.content.split('\n').filter(Boolean),
      stats: script.script_views?.[0] || null
    }));
  },

  async getSavedScripts(userId: string): Promise<SavedScript[]> {
    try {
      const { data, error } = await supabase
        .from('saved_scripts')
        .select(`
          scripts:script_id(
            id,
            title,
            content,
            category,
            user_id,
            created_at,
            is_featured,
            saves_count,
            typed_count,
            unique_typers_count,
            quote_stats:script_quotes(
              id,
              typed_count,
              unique_typers_count,
              avg_wpm,
              best_wpm,
              avg_accuracy
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return (data?.map(item => ({
        ...item.scripts,
        stats: {
          avg_wpm: item.scripts.quote_stats?.[0]?.avg_wpm || 0,
          best_wpm: item.scripts.quote_stats?.[0]?.best_wpm || 0,
          avg_accuracy: item.scripts.quote_stats?.[0]?.avg_accuracy || 0
        }
      })) || []) as SavedScript[];
    } catch (error) {
      console.error('Error fetching saved scripts:', error);
      throw error;
    }
  },

  async saveToFavorites(scriptId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('saved_scripts')
      .insert({ user_id: user.id, script_id: scriptId });

    if (error) {
      console.error('Error saving script:', error);
      return false;
    }

    return true;
  },

  async removeFromFavorites(scriptId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('saved_scripts')
      .delete()
      .eq('user_id', user.id)
      .eq('script_id', scriptId);

    if (error) {
      console.error('Error removing script:', error);
      return false;
    }

    return true;
  },

  async uploadScript(name: string, content: string, category: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('scripts')
      .insert({
        name,
        content,
        category,
        user_id: user.id,
        is_featured: false,
        saves_count: 0,
        typed_count: 0,
        unique_typers_count: 0
      });

    if (error) {
      console.error('Error uploading script:', error);
      return false;
    }

    return true;
  },

  // Save script to Supabase
  async saveScriptToSupabase(userId: string, title: string, content: string, category: string = 'Custom'): Promise<SavedScript | null> {
    try {
      const script: Partial<SavedScript> = {
        title,
        content,
        category,
        user_id: userId,
        is_featured: false,
        saves_count: 0,
        typed_count: 0,
        unique_typers_count: 0
      };

      return await this.uploadScript(script);
    } catch (error) {
      console.error('Error saving script to Supabase:', error);
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
  },

  // Get script stats from script_views
  getScriptStats: async (scriptId: string) => {
    try {
      const { data, error } = await supabase
        .from('script_views')
        .select('typed_count, unique_typers_count, average_wpm, best_wpm')
        .eq('id', scriptId)
        .single();

      if (error) {
        console.error('Error fetching script stats:', error);
        return null;
      }

      return {
        typed_count: data.typed_count || 0,
        unique_typers_count: data.unique_typers_count || 0,
        average_wpm: data.average_wpm || 0,
        best_wpm: data.best_wpm || data.average_wpm || 0
      };
    } catch (error) {
      console.error('Error fetching script stats:', error);
      return null;
    }
  },
};
