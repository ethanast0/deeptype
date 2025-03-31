import { supabase } from '../integrations/supabase/client';

interface TypingSession {
  id: string;
  user_id: string;
  script_id: string;
  quote_id: string;
  wpm: number;
  accuracy: number;
  elapsed_time: number;
  created_at: string;
}

interface ScriptWithQuote {
  name: string;
  category: string;
  quote: {
    content: string;
    quote_index: number;
  };
}

export const typingHistoryService = {
  // Record a new typing session
  recordSession: async (
    userId: string,
    scriptId: string,
    quoteId: string,
    wpm: number,
    accuracy: number,
    elapsedTime: number
  ): Promise<boolean> => {
    try {
      if (!userId || !scriptId || !quoteId) {
        console.error('Missing required parameters:', { userId, scriptId, quoteId });
        return false;
      }

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
      console.error('Error recording typing session:', error);
      return false;
    }
  },

  // Get all typing sessions for a user
  getUserSessions: async (userId: string): Promise<TypingSession[]> => {
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(session => ({
        id: session.id,
        user_id: session.user_id,
        script_id: session.script_id,
        quote_id: session.quote_id,
        wpm: session.wpm,
        accuracy: session.accuracy,
        elapsed_time: session.elapsed_time,
        created_at: session.created_at
      }));
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  },

  // Get sessions for a specific script
  getScriptSessions: async (userId: string, scriptId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select(`
          *,
          quote:quote_id (
            content,
            quote_index
          )
        `)
        .eq('user_id', userId)
        .eq('script_id', scriptId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(session => ({
        id: session.id,
        user_id: session.user_id,
        script_id: session.script_id,
        quote_id: session.quote_id,
        wpm: session.wpm,
        accuracy: session.accuracy,
        elapsed_time: session.elapsed_time,
        created_at: session.created_at
      }));
    } catch (error) {
      console.error('Error fetching script history:', error);
      return [];
    }
  },

  // Get user stats
  getUserStats: async (userId: string) => {
    try {
      const { data: sessions, error } = await supabase
        .from('typing_history')
        .select('wpm, accuracy, script_id')
        .eq('user_id', userId);

      if (error) throw error;

      if (sessions.length === 0) {
        return {
          averageWpm: 0,
          averageAccuracy: 0,
          totalSessions: 0,
          totalScripts: 0
        };
      }

      const totalWpm = sessions.reduce((sum, session) => sum + session.wpm, 0);
      const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0);
      const uniqueScripts = new Set(sessions.map(session => session.script_id));

      return {
        averageWpm: Math.round(totalWpm / sessions.length),
        averageAccuracy: parseFloat((totalAccuracy / sessions.length).toFixed(2)),
        totalSessions: sessions.length,
        totalScripts: uniqueScripts.size
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return {
        averageWpm: 0,
        averageAccuracy: 0,
        totalSessions: 0,
        totalScripts: 0
      };
    }
  }
};
