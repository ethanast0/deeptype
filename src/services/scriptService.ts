import { supabase } from '../integrations/supabase/client';

export interface QuoteStats {
  id: string;
  script_id: string;
  content: string;
  quote_index: number;
  typed_count: number;
  unique_typers_count: number;
  avg_wpm: number;
  best_wpm: number;
  avg_accuracy: number;
}

export interface SavedScript {
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
  quotes?: QuoteStats[];
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
  script_quotes?: QuoteStats[];
}

interface SavedScriptRow {
  script: ScriptRow;
}

// Constants for script management
const MAX_USER_SCRIPTS = 5;

// Helper functions for script storage
export const scriptService = {
  async getScripts(options: GetScriptsOptions = {}): Promise<SavedScript[]> {
    try {
      let query = supabase
        .from('scripts')
        .select(`
          *,
          script_quotes (
            id,
            content,
            quote_index,
            typed_count,
            unique_typers_count,
            avg_wpm,
            best_wpm,
            avg_accuracy
          )
        `);

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

      if (error) throw error;

      return (data as unknown as ScriptRow[]).map(script => ({
        ...script,
        quotes: script.script_quotes || []
      }));
    } catch (error) {
      console.error('Error fetching scripts:', error);
      return [];
    }
  },

  async getSavedScripts(userId: string): Promise<SavedScript[]> {
    try {
      const { data, error } = await supabase
        .from('saved_scripts')
        .select(`
          script:script_id (
            id,
            name,
            content,
            category,
            user_id,
            created_at,
            is_featured,
            saves_count,
            typed_count,
            unique_typers_count,
            script_quotes (
              id,
              content,
              quote_index,
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

      return (data as unknown as SavedScriptRow[])?.map(item => ({
        ...item.script,
        quotes: item.script.script_quotes || []
      })) || [];
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

    try {
      // Start a transaction by using single batch
      const quotes = content.split('\n').filter(Boolean);
      
      // Insert the script first
      const { data: script, error: scriptError } = await supabase
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
        })
        .select('id')
        .single();

      if (scriptError) throw scriptError;

      // Then insert all quotes
      const quoteRows = quotes.map((quote, index) => ({
        script_id: script.id,
        content: quote,
        quote_index: index,
        typed_count: 0,
        unique_typers_count: 0,
        avg_wpm: 0,
        best_wpm: 0,
        avg_accuracy: 0
      }));

      const { error: quotesError } = await supabase
        .from('script_quotes')
        .insert(quoteRows);

      if (quotesError) throw quotesError;

      return true;
    } catch (error) {
      console.error('Error uploading script:', error);
      return false;
    }
  },

  async updateScript(script: SavedScript): Promise<boolean> {
    try {
      const { error: scriptError } = await supabase
        .from('scripts')
        .update({
          name: script.name,
          content: script.content,
          category: script.category
        })
        .eq('id', script.id);
      
      if (scriptError) throw scriptError;

      // Update quotes if they exist
      if (script.quotes) {
        const { error: quotesError } = await supabase
          .from('script_quotes')
          .upsert(
            script.quotes.map(quote => ({
              script_id: script.id,
              ...quote
            }))
          );
        
        if (quotesError) throw quotesError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating script:', error);
      return false;
    }
  },

  async deleteScript(scriptId: string): Promise<boolean> {
    try {
      // Due to CASCADE delete, this will also delete related quotes
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting script:', error);
      return false;
    }
  },

  async recordTypingHistory(
    userId: string,
    scriptId: string,
    quoteId: string,
    wpm: number,
    accuracy: number,
    elapsedTime: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('typing_history')
        .insert({
          user_id: userId,
          script_id: scriptId,
          quote_id: quoteId,
          wpm,
          accuracy,
          elapsed_time: elapsedTime
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error recording typing history:', error);
      return false;
    }
  },

  async getTypingHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select(`
          *,
          script:script_id (
            name,
            category
          ),
          quote:quote_id (
            content,
            quote_index
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  }
};
