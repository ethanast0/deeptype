
import { supabase } from "../integrations/supabase/client";

interface UserStats {
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalScripts: number;
}

interface HistoryWithMovingAverage {
  raw: number[];
  movingAverage: number[];
  created_at?: string[];
}

export const typingHistoryService = {
  // Record a typing session
  async recordSession(
    userId: string,
    scriptId: string,
    wpm: number,
    accuracy: number,
    elapsedTime: number,
    quoteId?: string
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

      if (error) {
        console.error('Error recording typing history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error recording typing history:', error);
      return false;
    }
  },
  
  // Record a typing session for content
  async recordContentSession(
    userId: string,
    contentId: string,
    wpm: number,
    accuracy: number,
    elapsedTime: number,
    levelNumber: number,
    contentIdString: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('typing_history')
        .insert({
          user_id: userId,
          content_id: contentId,
          wpm,
          accuracy,
          elapsed_time: elapsedTime,
          metadata: {
            level_number: levelNumber,
            content_id_string: contentIdString
          }
        });

      if (error) {
        console.error('Error recording content typing history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error recording content typing history:', error);
      return false;
    }
  },

  // Get user stats (aggregated statistics)
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get average WPM
      const averageWpm = await this.getUserAverageWPM(userId) || 0;
      
      // Get average accuracy
      const averageAccuracy = await this.getUserAverageAccuracy(userId) || 0;
      
      // Get total sessions
      const { count: totalSessions, error: sessionsError } = await supabase
        .from('typing_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (sessionsError) {
        console.error('Error fetching session count:', sessionsError);
      }
      
      // Get total unique scripts
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('typing_history')
        .select('script_id')
        .eq('user_id', userId)
        .not('script_id', 'is', null);
        
      if (scriptsError) {
        console.error('Error fetching scripts count:', scriptsError);
      }
      
      // Count unique script IDs
      const uniqueScripts = new Set();
      scriptsData?.forEach(session => {
        if (session.script_id) {
          uniqueScripts.add(session.script_id);
        }
      });

      return {
        averageWpm,
        averageAccuracy,
        totalSessions: totalSessions || 0,
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
  },

  // Get user's average WPM
  async getUserAverageWPM(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('wpm')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user WPM history:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const total = data.reduce((sum, record) => sum + record.wpm, 0);
      return Math.round(total / data.length);
    } catch (error) {
      console.error('Error calculating average WPM:', error);
      return null;
    }
  },

  // Get user's average accuracy
  async getUserAverageAccuracy(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('accuracy')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user accuracy history:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const total = data.reduce((sum, record) => sum + record.accuracy, 0);
      return Math.round(total / data.length);
    } catch (error) {
      console.error('Error calculating average accuracy:', error);
      return null;
    }
  },

  // Get user's WPM history
  async getUserWPMHistory(userId: string, limit: number = 10): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('wpm')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user WPM history:', error);
        return [];
      }

      return data ? data.map(record => record.wpm).reverse() : [];
    } catch (error) {
      console.error('Error fetching WPM history:', error);
      return [];
    }
  },
  
  // Get user's WPM history with moving average
  async getUserHistoryWithMovingAverageWpm(userId: string, limit: number = 50): Promise<HistoryWithMovingAverage> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('wpm, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching user WPM history:', error);
        return { raw: [], movingAverage: [], created_at: [] };
      }

      if (!data || data.length === 0) {
        return { raw: [], movingAverage: [], created_at: [] };
      }

      const wpmValues = data.map(record => record.wpm);
      const createdAt = data.map(record => record.created_at);
      
      // Calculate 5-point moving average
      const windowSize = 5;
      const movingAverage = wpmValues.map((_, index, array) => {
        // Get start of window, clamping to array bounds
        const start = Math.max(0, index - Math.floor(windowSize / 2));
        // Get end of window, clamping to array bounds
        const end = Math.min(array.length, index + Math.floor(windowSize / 2) + 1);
        // Calculate average of values in window
        const sum = array.slice(start, end).reduce((acc, val) => acc + val, 0);
        return Math.round(sum / (end - start));
      });

      return { 
        raw: wpmValues, 
        movingAverage,
        created_at: createdAt
      };
    } catch (error) {
      console.error('Error fetching WPM history with moving average:', error);
      return { raw: [], movingAverage: [], created_at: [] };
    }
  },
  
  // Get user's accuracy history with moving average
  async getUserHistoryWithMovingAverageAccuracy(userId: string, limit: number = 50): Promise<HistoryWithMovingAverage> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('accuracy, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching user accuracy history:', error);
        return { raw: [], movingAverage: [], created_at: [] };
      }

      if (!data || data.length === 0) {
        return { raw: [], movingAverage: [], created_at: [] };
      }

      const accuracyValues = data.map(record => record.accuracy);
      const createdAt = data.map(record => record.created_at);
      
      // Calculate 5-point moving average
      const windowSize = 5;
      const movingAverage = accuracyValues.map((_, index, array) => {
        // Get start of window, clamping to array bounds
        const start = Math.max(0, index - Math.floor(windowSize / 2));
        // Get end of window, clamping to array bounds
        const end = Math.min(array.length, index + Math.floor(windowSize / 2) + 1);
        // Calculate average of values in window
        const sum = array.slice(start, end).reduce((acc, val) => acc + val, 0);
        return Math.round(sum / (end - start));
      });

      return { 
        raw: accuracyValues, 
        movingAverage,
        created_at: createdAt
      };
    } catch (error) {
      console.error('Error fetching accuracy history with moving average:', error);
      return { raw: [], movingAverage: [], created_at: [] };
    }
  },
  
  // Get user's best WPM
  async getUserBestWPM(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('typing_history')
        .select('wpm')
        .eq('user_id', userId)
        .order('wpm', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No data found
        }
        console.error('Error fetching user best WPM:', error);
        return null;
      }

      return data ? data.wpm : null;
    } catch (error) {
      console.error('Error fetching best WPM:', error);
      return null;
    }
  }
};

export default typingHistoryService;
