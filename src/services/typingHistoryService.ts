import { supabase } from '../integrations/supabase/client';

interface TypingSession {
  id: string;
  userId: string;
  scriptId: string;
  wpm: number;
  accuracy: number;
  elapsed_time: number;
  created_at: string;
  quote_id?: string;
}

export const typingHistoryService = {
  // Record a new typing session in Supabase
  recordSession: async (userId: string, scriptId: string, wpm: number, accuracy: number, elapsedTime: number = 0, quoteId?: string): Promise<boolean> => {
    try {
      if (!userId || !scriptId) {
        console.error('Missing required parameters:', { userId, scriptId });
        return false;
      }
      
      console.log('Recording typing session with params:', { userId, scriptId, wpm, accuracy, elapsedTime, quoteId });
      
      // Ensure elapsedTime is an integer as expected by the database
      const roundedElapsedTime = Math.round(elapsedTime);
      
      const record: any = {
        user_id: userId,
        script_id: scriptId,
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy * 100) / 100,
        elapsed_time: roundedElapsedTime
      };
      
      // Add quote_id if provided
      if (quoteId) {
        record.quote_id = quoteId;
      }
      
      const { error: insertError } = await supabase
        .from('typing_history')
        .insert(record);
      
      if (insertError) {
        console.error('Error updating typing stats:', insertError);
        return false;
      }
      
      console.log('Your typing stats have been updated');
      return true;
    } catch (error) {
      console.error('Unexpected error updating typing stats:', error);
      return false;
    }
  },
  
  // Get all typing sessions for a user from Supabase
  getUserSessions: async (userId: string): Promise<TypingSession[]> => {
    try {
      console.log('Fetching user sessions for user ID:', userId);
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching typing history:', error);
        return [];
      }
      
      console.log(`Retrieved ${data.length} typing sessions`);
      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        scriptId: session.script_id,
        wpm: session.wpm,
        accuracy: session.accuracy,
        elapsed_time: session.elapsed_time,
        created_at: session.created_at,
        quote_id: session.quote_id
      }));
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  },
  
  // Get sessions for a specific script from Supabase
  getScriptSessions: async (userId: string, scriptId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId)
        .eq('script_id', scriptId);
      
      if (error) {
        console.error('Error fetching script history:', error);
        return [];
      }
      
      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        scriptId: session.script_id,
        wpm: session.wpm,
        accuracy: session.accuracy,
        elapsed_time: session.elapsed_time,
        created_at: session.created_at,
        quote_id: session.quote_id
      }));
    } catch (error) {
      console.error('Error fetching script history:', error);
      return [];
    }
  },
  
  // Get user stats from Supabase
  getUserStats: async (userId: string) => {
    try {
      console.log('Calculating user stats for user ID:', userId);
      const sessions = await typingHistoryService.getUserSessions(userId);
      
      if (sessions.length === 0) {
        console.log('No typing sessions found for user');
        return {
          averageWpm: 0,
          averageAccuracy: 0,
          totalSessions: 0,
          totalScripts: 0
        };
      }
      
      const totalWpm = sessions.reduce((sum, session) => sum + session.wpm, 0);
      const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0);
      const uniqueScripts = new Set(sessions.map(session => session.scriptId));
      
      const stats = {
        averageWpm: Math.round(totalWpm / sessions.length),
        averageAccuracy: parseFloat((totalAccuracy / sessions.length).toFixed(2)),
        totalSessions: sessions.length,
        totalScripts: uniqueScripts.size
      };
      
      console.log('Calculated user stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return {
        averageWpm: 0,
        averageAccuracy: 0,
        totalSessions: 0,
        totalScripts: 0
      };
    }
  },
  
  async getUserHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('typing_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user history:', error);
      throw error;
    }
    
    return data || [];
  }
};
