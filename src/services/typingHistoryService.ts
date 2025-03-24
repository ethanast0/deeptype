
import { supabase } from '../integrations/supabase/client';

interface TypingSession {
  id: string;
  userId: string;
  scriptId: string;
  date: string;
  time: string;
  speed_wpm: number;
  accuracy: number;
  points: number;
}

export const typingHistoryService = {
  // Record a new typing session in Supabase
  recordSession: async (userId: string, scriptId: string, wpm: number, accuracy: number): Promise<boolean> => {
    try {
      if (!userId || !scriptId) {
        console.error('Missing required parameters:', { userId, scriptId });
        return false;
      }
      
      console.log('Recording typing session with params:', { userId, scriptId, wpm, accuracy });
      
      // Check if we already have a session for this script today
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString();
      
      const { data: existingSessions, error: fetchError } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId)
        .eq('script_id', scriptId)
        .eq('date', today);
      
      if (fetchError) {
        console.error('Error checking existing typing sessions:', fetchError);
        return false;
      }
      
      if (existingSessions && existingSessions.length > 0) {
        // Update existing session if new score is better
        const existingSession = existingSessions[0];
        
        // Only update if new WPM is higher
        if (wpm > existingSession.speed_wpm) {
          const { error: updateError } = await supabase
            .from('typing_history')
            .update({
              speed_wpm: Math.round(wpm),
              accuracy: Math.round(accuracy * 100) / 100,
              points: existingSession.points + 1,
              time: currentTime
            })
            .eq('id', existingSession.id);
          
          if (updateError) {
            console.error('Error updating typing session:', updateError);
            return false;
          }
          
          console.log('Updated existing typing session with better score');
          return true;
        } else {
          // Just increment points
          const { error: updateError } = await supabase
            .from('typing_history')
            .update({
              points: existingSession.points + 1
            })
            .eq('id', existingSession.id);
          
          if (updateError) {
            console.error('Error updating typing session points:', updateError);
            return false;
          }
          
          console.log('Updated existing typing session points');
          return true;
        }
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('typing_history')
          .insert({
            user_id: userId,
            script_id: scriptId,
            speed_wpm: Math.round(wpm),
            accuracy: Math.round(accuracy * 100) / 100,
            date: today,
            time: currentTime,
            points: 1
          });
        
        if (insertError) {
          console.error('Error recording new typing session:', insertError);
          return false;
        }
        
        console.log('Created new typing session record');
        return true;
      }
    } catch (error) {
      console.error('Unexpected error recording typing session:', error);
      return false;
    }
  },
  
  // Get all typing sessions for a user from Supabase
  getUserSessions: async (userId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching typing history:', error);
        return [];
      }
      
      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        scriptId: session.script_id,
        date: session.date,
        time: session.time,
        speed_wpm: session.speed_wpm,
        accuracy: session.accuracy,
        points: session.points
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
        date: session.date,
        time: session.time,
        speed_wpm: session.speed_wpm,
        accuracy: session.accuracy,
        points: session.points
      }));
    } catch (error) {
      console.error('Error fetching script history:', error);
      return [];
    }
  },
  
  // Get user stats from Supabase
  getUserStats: async (userId: string) => {
    try {
      const sessions = await typingHistoryService.getUserSessions(userId);
      
      if (sessions.length === 0) {
        return {
          averageWpm: 0,
          averageAccuracy: 0,
          totalSessions: 0,
          totalScripts: 0
        };
      }
      
      const totalWpm = sessions.reduce((sum, session) => sum + session.speed_wpm, 0);
      const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0);
      const uniqueScripts = new Set(sessions.map(session => session.scriptId));
      
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
