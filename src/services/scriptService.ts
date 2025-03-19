import { useAuth } from '../contexts/AuthContext';

export interface SavedScript {
  id: string;
  name: string;
  quotes: string[];
  userId: string;
  createdAt: string;
}

const STORAGE_KEY = 'typetest_saved_scripts';

// Helper functions for script storage
export const scriptService = {
  getScripts: (userId: string): SavedScript[] => {
    try {
      const scripts = localStorage.getItem(STORAGE_KEY);
      if (!scripts) return [];
      
      const parsedScripts: SavedScript[] = JSON.parse(scripts);
      return parsedScripts.filter(script => script.userId === userId);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      return [];
    }
  },
  
  saveScript: (userId: string, name: string, quotes: string[]): SavedScript | null => {
    try {
      const scripts = scriptService.getScripts(userId);
      
      // Limit to 5 scripts per user
      if (scripts.length >= 5) {
        return null;
      }
      
      const newScript: SavedScript = {
        id: Date.now().toString(),
        name,
        quotes,
        userId,
        createdAt: new Date().toISOString()
      };
      
      const updatedScripts = [...scripts, newScript];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts));
      
      return newScript;
    } catch (error) {
      console.error('Error saving script:', error);
      return null;
    }
  },
  
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
  }
};
