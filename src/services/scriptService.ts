
import { useAuth } from '../contexts/AuthContext';

export interface SavedScript {
  id: string;
  name: string;
  quotes: string[];
  userId: string;
  createdAt: string;
  category?: string;
}

// Constants for script management
const STORAGE_KEY = 'typetest_saved_scripts';
const MAX_USER_SCRIPTS = 5;

// Helper functions for script storage
export const scriptService = {
  // Get scripts - will check localStorage first, then database when integrated
  getScripts: (userId: string): SavedScript[] => {
    try {
      // For now, we'll still use localStorage until DB integration is complete
      const scripts = localStorage.getItem(STORAGE_KEY);
      if (!scripts) return [];
      
      const parsedScripts: SavedScript[] = JSON.parse(scripts);
      return parsedScripts.filter(script => script.userId === userId);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      return [];
    }
  },
  
  // Save script - will save to localStorage first, then database when integrated
  saveScript: (userId: string, name: string, quotes: string[], category: string = 'Custom'): SavedScript | null => {
    try {
      const scripts = scriptService.getScripts(userId);
      
      // Limit to 5 scripts per user
      if (scripts.length >= MAX_USER_SCRIPTS) {
        return null;
      }
      
      const newScript: SavedScript = {
        id: crypto.randomUUID(), // More reliable UUID generation
        name,
        quotes,
        userId,
        createdAt: new Date().toISOString(),
        category
      };
      
      // Store in localStorage for now
      const allScripts = localStorage.getItem(STORAGE_KEY) 
        ? JSON.parse(localStorage.getItem(STORAGE_KEY)!) 
        : [];
        
      const updatedScripts = [...allScripts.filter((s: SavedScript) => s.userId !== userId || !scripts.some(us => us.id === s.id)), ...scripts, newScript];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts));
      
      return newScript;
    } catch (error) {
      console.error('Error saving script:', error);
      return null;
    }
  },
  
  // Update script
  updateScript: (script: SavedScript): boolean => {
    try {
      const allScripts = localStorage.getItem(STORAGE_KEY);
      if (!allScripts) return false;
      
      const parsedScripts: SavedScript[] = JSON.parse(allScripts);
      const updatedScripts = parsedScripts.map(s => 
        s.id === script.id ? script : s
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts));
      return true;
    } catch (error) {
      console.error('Error updating script:', error);
      return false;
    }
  },
  
  // Delete script
  deleteScript: (scriptId: string): boolean => {
    try {
      const allScripts = localStorage.getItem(STORAGE_KEY);
      if (!allScripts) return false;
      
      const parsedScripts: SavedScript[] = JSON.parse(allScripts);
      const updatedScripts = parsedScripts.filter(s => s.id !== scriptId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts));
      return true;
    } catch (error) {
      console.error('Error deleting script:', error);
      return false;
    }
  },
  
  // Reorder scripts
  reorderScripts: (userId: string, scriptIds: string[]): boolean => {
    try {
      const allScripts = localStorage.getItem(STORAGE_KEY);
      if (!allScripts) return false;
      
      const parsedScripts: SavedScript[] = JSON.parse(allScripts);
      const userScripts = parsedScripts.filter(s => s.userId === userId);
      
      // Create a new array with the reordered scripts
      const reorderedScripts = scriptIds.map(id => 
        userScripts.find(s => s.id === id)
      ).filter(Boolean) as SavedScript[];
      
      // Keep other users' scripts intact
      const otherScripts = parsedScripts.filter(s => s.userId !== userId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...reorderedScripts, ...otherScripts]));
      return true;
    } catch (error) {
      console.error('Error reordering scripts:', error);
      return false;
    }
  },

  // Get system templates
  getTemplates: (): SavedScript[] => {
    // We would normally fetch this from the database
    // For now, we'll return an empty array as templates are handled separately
    return [];
  },

  // Record typing history
  recordTypingHistory: (userId: string, scriptId: string, wpm: number, accuracy: number): boolean => {
    try {
      const historyKey = `typetest_history_${userId}`;
      const existingHistory = localStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const newEntry = {
        id: crypto.randomUUID(),
        userId,
        scriptId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].split('.')[0],
        speed_wpm: wpm,
        accuracy,
        points: 1
      };
      
      history.push(newEntry);
      localStorage.setItem(historyKey, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error recording typing history:', error);
      return false;
    }
  },

  // Get typing history for a user
  getTypingHistory: (userId: string): any[] => {
    try {
      const historyKey = `typetest_history_${userId}`;
      const existingHistory = localStorage.getItem(historyKey);
      return existingHistory ? JSON.parse(existingHistory) : [];
    } catch (error) {
      console.error('Error fetching typing history:', error);
      return [];
    }
  }
};
