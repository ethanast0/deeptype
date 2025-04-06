
import { supabase } from '../integrations/supabase/client';

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

interface PanelCreateParams {
  panel_type: string;
  title: string | null;
  config: any | null;
  position: number;
}

// Panel template definitions
export const panelTemplates = [
  {
    id: 'wpm-history',
    type: 'historical-wpm',
    title: 'WPM Over Time',
    description: 'Track your typing speed progress over time',
    icon: 'line-chart',
    defaultConfig: {
      timeRange: 'week',
      windowSize: 5
    }
  },
  {
    id: 'accuracy-chart',
    type: 'accuracy-chart',
    title: 'Accuracy Trend',
    description: 'Monitor your typing accuracy over time',
    icon: 'percent',
    defaultConfig: {
      timeRange: 'week',
      windowSize: 5
    }
  },
  {
    id: 'leaderboard',
    type: 'leaderboard',
    title: 'Leaderboard',
    description: 'See how you rank against other typists',
    icon: 'trophy',
    defaultConfig: {
      limit: 5
    }
  },
  {
    id: 'session-stats',
    type: 'session-stats',
    title: 'Recent Sessions',
    description: 'View stats from your recent typing sessions',
    icon: 'activity',
    defaultConfig: {
      limit: 5
    }
  }
];

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
      // First, check if there are any existing panels
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
      
      // If there are no panels, start at position 0
      if (!data || data.length === 0) {
        return 0;
      }
      
      // Otherwise, use the highest position + 1
      return data[0].position + 1;
    } catch (err) {
      console.error('Error in getNextPosition:', err);
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
