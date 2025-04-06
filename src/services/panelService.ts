
import { supabase } from "../integrations/supabase/client";

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

export interface PanelTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  defaultConfig?: any;
}

export const panelTemplates: PanelTemplate[] = [
  {
    id: "wpm-history",
    type: "wpm-history",
    title: "WPM History",
    description: "Shows your WPM progress over time",
    icon: "line-chart",
    defaultConfig: {
      timeRange: "week"
    }
  },
  {
    id: "accuracy-chart",
    type: "accuracy-chart",
    title: "Accuracy Progress",
    description: "Tracks your typing accuracy over time",
    icon: "percent",
    defaultConfig: {
      timeRange: "week"
    }
  },
  {
    id: "leaderboard",
    type: "leaderboard",
    title: "WPM Leaderboard",
    description: "See how you rank among other typists",
    icon: "trophy",
    defaultConfig: {
      category: "all"
    }
  },
  {
    id: "session-stats",
    type: "session-stats",
    title: "Current Session",
    description: "View statistics for your current typing session",
    icon: "activity",
    defaultConfig: {}
  }
];

export const panelService = {
  async getUserPanels(userId: string): Promise<CustomPanel[]> {
    // Use the REST API directly since the type definitions haven't been updated yet
    const { data, error } = await supabase
      .from('custom_panels')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true }) as { data: CustomPanel[] | null, error: any };
    
    if (error) {
      console.error("Error fetching user panels:", error);
      throw error;
    }
    
    return data || [];
  },
  
  async createPanel(userId: string, panel: Omit<CustomPanel, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CustomPanel> {
    // Use the REST API directly since the type definitions haven't been updated yet
    const { data, error } = await supabase
      .from('custom_panels')
      .insert({
        user_id: userId,
        ...panel
      })
      .select() as { data: CustomPanel[] | null, error: any };
    
    if (error) {
      console.error("Error creating panel:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("No data returned after creating panel");
    }
    
    return data[0];
  },
  
  async updatePanel(panelId: string, updates: Partial<Omit<CustomPanel, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<CustomPanel> {
    // Use the REST API directly since the type definitions haven't been updated yet
    const { data, error } = await supabase
      .from('custom_panels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", panelId)
      .select() as { data: CustomPanel[] | null, error: any };
    
    if (error) {
      console.error("Error updating panel:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("No data returned after updating panel");
    }
    
    return data[0];
  },
  
  async deletePanel(panelId: string): Promise<void> {
    // Use the REST API directly since the type definitions haven't been updated yet
    const { error } = await supabase
      .from('custom_panels')
      .delete()
      .eq("id", panelId);
    
    if (error) {
      console.error("Error deleting panel:", error);
      throw error;
    }
  },
  
  async updatePanelPositions(updates: { id: string, position: number }[]): Promise<void> {
    try {
      // Use RPC function instead of direct updates
      const { error } = await supabase.rpc(
        'update_panel_positions', 
        { position_updates: updates }
      );
      
      if (error) {
        console.error("Error updating panel positions:", error);
        throw error;
      }
    } catch (e) {
      console.error("Error in updatePanelPositions:", e);
      // Fallback to individual updates if RPC fails
      try {
        for (const update of updates) {
          await supabase
            .from('custom_panels')
            .update({ position: update.position })
            .eq("id", update.id);
        }
      } catch (e) {
        console.error("Error in fallback position updates:", e);
        throw e;
      }
    }
  },
  
  // Get the next available position for a new panel
  async getNextPosition(userId: string): Promise<number> {
    // Use the REST API directly since the type definitions haven't been updated yet
    const { data, error } = await supabase
      .from('custom_panels')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1) as { data: { position: number }[] | null, error: any };
    
    if (error) {
      console.error("Error getting next position:", error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0].position + 1 : 0;
  }
};
