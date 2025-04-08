import { supabase } from '../integrations/supabase/client';

interface TypingSession {
  id: string;
  user_id: string;
  created_at: string;
  wpm: number;
  accuracy: number;
  script_id: string | null;
  quote_id: string | null;
  elapsed_time: number;
  moving_average_wpm?: number | null;
  moving_average_accuracy?: number | null;
}

interface UserStats {
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalScripts: number;
  emaWpm: number;
}

export const typingHistoryService = {
  recordSession: async (
    userId: string,
    scriptId: string,
    wpm: number,
    accuracy: number,
    elapsedTime: number = 0,
    quoteId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from('typing_history').insert({
        user_id: userId,
        script_id: scriptId,
        quote_id: quoteId,
        wpm,
        accuracy,
        elapsed_time: elapsedTime
      });

      if (error) {
        console.error('Error recording typing session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error recording session:', error);
      return false;
    }
  },

  getUserSessions: async (userId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching user sessions:', error);
      return [];
    }
  },

  getScriptSessions: async (userId: string, scriptId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId)
        .eq('script_id', scriptId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching script sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching script sessions:', error);
      return [];
    }
  },

  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('wpm, accuracy')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user stats:', error);
        return { averageWpm: 0, averageAccuracy: 0, totalSessions: 0, totalScripts: 0, emaWpm: 0 };
      }

      if (!data || data.length === 0) {
        return { averageWpm: 0, averageAccuracy: 0, totalSessions: 0, totalScripts: 0, emaWpm: 0 };
      }

      const totalSessions = data.length;
      
      // Calculate EMA for WPM
      const alpha = 2 / (totalSessions + 1); // Smoothing factor
      let emaWpm = data[0].wpm; // Start with the first WPM value

      for (let i = 1; i < data.length; i++) {
        emaWpm = alpha * data[i].wpm + (1 - alpha) * emaWpm;
      }

      // Calculate average WPM
      const totalWpm = data.reduce((sum, session) => sum + session.wpm, 0);
      const averageWpm = Math.round(totalWpm / totalSessions);
      
      // Calculate average accuracy
      const totalAccuracy = data.reduce((sum, session) => sum + session.accuracy, 0);
      const averageAccuracy = Math.round(totalAccuracy / totalSessions);
      
      // Get unique scripts count
      const { data: scriptData, error: scriptError } = await supabase
        .from('typing_history')
        .select('script_id')
        .eq('user_id', userId)
        .not('script_id', 'is', null);
        
      if (scriptError) {
        console.error('Error fetching script stats:', scriptError);
        return { averageWpm, averageAccuracy, totalSessions, totalScripts: 0, emaWpm: Math.round(emaWpm) };
      }
      
      const uniqueScripts = new Set(scriptData.map(item => item.script_id));
      const totalScripts = uniqueScripts.size;

      return {
        averageWpm,
        averageAccuracy,
        totalSessions,
        totalScripts,
        emaWpm: Math.round(emaWpm)
      };
    } catch (error) {
      console.error('Unexpected error fetching user stats:', error);
      return { averageWpm: 0, averageAccuracy: 0, totalSessions: 0, totalScripts: 0, emaWpm: 0 };
    }
  },

  // Generic function to get user history
  getUserHistory: async (userId: string): Promise<TypingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching user history:', error);
      return [];
    }
  },

  // Helper function to calculate moving average for any property
  calculateMovingAverage: (data: any[], property: string, windowSize: number = 5): any[] => {
    if (!data || data.length === 0) {
      return [];
    }

    // Sort by created_at
    const sortedData = [...data].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return sortedData.map((item, index, array) => {
      const result = { ...item };
      
      if (index < windowSize - 1) {
        // Not enough data points for a full window
        result[`moving_average_${property}`] = null;
      } else {
        // Calculate moving average
        let sum = 0;
        for (let i = index - windowSize + 1; i <= index; i++) {
          sum += array[i][property];
        }
        result[`moving_average_${property}`] = sum / windowSize;
      }
      
      return result;
    });
  },

  // Get user history with moving average WPM
  getUserHistoryWithMovingAverageWpm: async (userId: string, windowSize: number = 5): Promise<TypingSession[]> => {
    const history = await typingHistoryService.getUserHistory(userId);
    return typingHistoryService.calculateMovingAverage(history, 'wpm', windowSize);
  },

  // Get user history with moving average accuracy
  getUserHistoryWithMovingAverageAccuracy: async (userId: string, windowSize: number = 5): Promise<TypingSession[]> => {
    const history = await typingHistoryService.getUserHistory(userId);
    return typingHistoryService.calculateMovingAverage(history, 'accuracy', windowSize);
  }
};
