
import { supabase } from "../integrations/supabase/client";

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
