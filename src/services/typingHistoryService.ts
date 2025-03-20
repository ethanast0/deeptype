
import { useAuth } from '../contexts/AuthContext';

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
  // Record a new typing session
  recordSession: (userId: string, scriptId: string, wpm: number, accuracy: number): boolean => {
    try {
      const historyKey = `typetest_history_${userId}`;
      const existingHistory = localStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Check if we already have a session for this script today
      const today = new Date().toISOString().split('T')[0];
      const existingSession = history.find((session: TypingSession) => 
        session.scriptId === scriptId && session.date === today
      );
      
      if (existingSession) {
        // Update existing session
        existingSession.speed_wpm = Math.max(existingSession.speed_wpm, wpm);
        existingSession.accuracy = Math.max(existingSession.accuracy, accuracy);
        existingSession.points += 1;
      } else {
        // Create new session
        const newSession: TypingSession = {
          id: crypto.randomUUID(),
          userId,
          scriptId,
          date: today,
          time: new Date().toISOString().split('T')[1].split('.')[0],
          speed_wpm: wpm,
          accuracy,
          points: 1
        };
        history.push(newSession);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error recording typing session:', error);
      return false;
    }
  },
  
  // Get all typing sessions for a user
  getUserSessions: (userId: string): TypingSession[] => {
    try {
      const historyKey = `typetest_history_${userId}`;
      const existingHistory = localStorage.getItem(historyKey);
      return existingHistory ? JSON.parse(existingHistory) : [];
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  },
  
  // Get sessions for a specific script
  getScriptSessions: (userId: string, scriptId: string): TypingSession[] => {
    try {
      const historyKey = `typetest_history_${userId}`;
      const existingHistory = localStorage.getItem(historyKey);
      
      if (!existingHistory) return [];
      
      const history: TypingSession[] = JSON.parse(existingHistory);
      return history.filter(session => session.scriptId === scriptId);
    } catch (error) {
      console.error('Error fetching script history:', error);
      return [];
    }
  },
  
  // Get user stats (average WPM, accuracy, total sessions)
  getUserStats: (userId: string) => {
    try {
      const sessions = typingHistoryService.getUserSessions(userId);
      
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
