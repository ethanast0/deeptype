
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
}

// Fetch user profile from database
export const fetchUserProfile = async (id: string): Promise<User | null> => {
  try {
    console.log("Fetching user profile for ID:", id);
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    if (!data) {
      console.log("No user profile found for ID:", id);
      return null;
    }
    
    console.log("User profile found:", data);
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

// Associate temporary scripts with user
export const associateTempScriptsWithUser = async (user: User) => {
  try {
    const tempScripts = localStorage.getItem("temp_script");
    if (!tempScripts) return;

    const parsedScript = JSON.parse(tempScripts);
    
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: parsedScript.name,
        content: JSON.stringify(parsedScript.quotes),
        category: 'Custom',
        created_by: user.id
      })
      .select();
    
    if (error) {
      console.error("Error saving temp script to Supabase:", error);
      throw error;
    }
    
    localStorage.removeItem("temp_script");
    return data;
  } catch (error) {
    console.error("Error processing temp script:", error);
    return null;
  }
};
