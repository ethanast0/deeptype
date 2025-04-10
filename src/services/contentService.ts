
import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";

export interface Content {
  id: string;
  level_number: number;
  quote_index: number;
  content: string;
  content_id: string;
}

// We need to manually handle the content table since it's not in the types
export const contentService = {
  /**
   * Fetch content for a specific level
   */
  async getContentForLevel(level: number): Promise<Content[]> {
    try {
      // Use any to bypass TypeScript type checking for the content table
      const { data, error } = await supabase
        .from('content' as any)
        .select('*')
        .eq('level_number', level)
        .order('quote_index', { ascending: true });

      if (error) {
        console.error("Error fetching content for level:", error);
        toast({
          title: "Error",
          description: "Could not fetch content for this level",
          variant: "destructive",
        });
        return [];
      }

      return data as Content[] || [];
    } catch (error) {
      console.error("Unexpected error fetching content:", error);
      return [];
    }
  },

  /**
   * Fetch a specific quote by its content ID (e.g., "L1Q1")
   */
  async getContentById(contentId: string): Promise<Content | null> {
    try {
      const { data, error } = await supabase
        .from('content' as any)
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) {
        console.error("Error fetching content by ID:", error);
        return null;
      }

      return data as Content;
    } catch (error) {
      console.error("Unexpected error fetching content by ID:", error);
      return null;
    }
  },

  /**
   * Get first quote for a level
   */
  async getFirstQuoteForLevel(level: number): Promise<Content | null> {
    try {
      const { data, error } = await supabase
        .from('content' as any)
        .select('*')
        .eq('level_number', level)
        .eq('quote_index', 1)
        .single();

      if (error) {
        console.error("Error fetching first quote for level:", error);
        return null;
      }

      return data as Content;
    } catch (error) {
      console.error("Unexpected error fetching first quote:", error);
      return null;
    }
  },

  /**
   * Get next quote based on current index
   */
  async getNextQuote(level: number, currentIndex: number): Promise<Content | null> {
    try {
      // First try to get the next quote in sequence
      const nextIndex = currentIndex + 1;
      
      const { data, error } = await supabase
        .from('content' as any)
        .select('*')
        .eq('level_number', level)
        .eq('quote_index', nextIndex)
        .single();

      if (error) {
        // If we've reached the end of quotes for this level, circle back to the first
        if (error.code === 'PGRST116') { // no rows returned
          return this.getFirstQuoteForLevel(level);
        }
        
        console.error("Error fetching next quote:", error);
        return null;
      }

      return data as Content;
    } catch (error) {
      console.error("Unexpected error fetching next quote:", error);
      return null;
    }
  }
};

export default contentService;
