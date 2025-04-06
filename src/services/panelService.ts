import { supabase } from '../integrations/supabase/client';
import { BaseConfig } from '../config/panelConfig';

// Panel templates for the Add Panel dialog
export const panelTemplates = [
  {
    id: 'wpm-history',
    title: 'WPM History',
    description: 'Shows your typing speed history over time',
    panel_type: 'wpm-history',
    defaultConfig: {
      timeRange: 'week',
      windowSize: 5
    }
  },
  {
    id: 'accuracy-chart',
    title: 'Accuracy Chart',
    description: 'Shows your typing accuracy over time',
    panel_type: 'accuracy-chart',
    defaultConfig: {
      timeRange: 'week',
      windowSize: 5
    }
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'Shows top typists in different categories',
    panel_type: 'leaderboard',
    defaultConfig: {
      timeRange: 'week',
      category: 'all'
    }
  },
  {
    id: 'session-stats',
    title: 'Session Stats',
    description: 'Shows statistics for your current typing session',
    panel_type: 'session-stats',
    defaultConfig: {}
  }
];

export interface CustomPanel {
  id: string;
  user_id: string;
  panel_type: string;
  title: string | null;
  config: any | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PanelData {
  panel_type: string;
  title: string | null;
  config?: any;
  position?: number;
}

export const panelService = {
  // Gets all panels for a specific user
  getUserPanels: async (userId: string): Promise<CustomPanel[]> => {
    try {
      // Use native Supabase REST API for better TypeScript compatibility
      const { data, error } = await supabase
        .from('custom_panels')
        .select('*')
        .eq('user_id', userId)
        .order('position');
      
      if (error) {
        console.error('Error fetching panels:', error);
        return [];
      }
      
      return data as CustomPanel[];
    } catch (err) {
      console.error('Error in getUserPanels:', err);
      return [];
    }
  },
  
  // Creates a new panel for a user
  createPanel: async (userId: string, params: PanelCreateParams): Promise<CustomPanel> => {
    try {
      // Use native Supabase REST API for better TypeScript compatibility
      const { data, error } = await supabase
        .from('custom_panels')
        .insert({
          user_id: userId,
          panel_type: params.panel_type,
          title: params.title,
          config: params.config,
          position: params.position
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating panel:', error);
        throw new Error('Failed to create panel');
      }
      
      return data as CustomPanel;
    } catch (err) {
      console.error('Error in createPanel:', err);
      throw err;
    }
  },
  
  // Gets the next available position for a new panel
  getNextPosition: async (userId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('custom_panels')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting next position:', error);
        return 0;
      }

      return data && data.length > 0 ? data[0].position + 1 : 0;
    } catch (error) {
      console.error('Unexpected error getting next position:', error);
      return 0;
    }
  },
  
  // Delete a panel
  deletePanel: async (panelId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('custom_panels')
        .delete()
        .eq('id', panelId);
      
      if (error) {
        console.error('Error deleting panel:', error);
        throw new Error('Failed to delete panel');
      }
    } catch (err) {
      console.error('Error in deletePanel:', err);
      throw err;
    }
  },
  
  // Update panel order
  updatePanelPosition: async (panelId: string, position: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('custom_panels')
        .update({ position })
        .eq('id', panelId);
      
      if (error) {
        console.error('Error updating panel position:', error);
        throw new Error('Failed to update panel position');
      }
    } catch (err) {
      console.error('Error in updatePanelPosition:', err);
      throw err;
    }
  }
};
