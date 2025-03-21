
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
  const tempScripts = localStorage.getItem("temp_script");
  if (!tempScripts) return;

  try {
    const parsedScript = JSON.parse(tempScripts);
    
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: parsedScript.name,
        content: JSON.stringify(parsedScript.quotes),
        category: 'Custom',
        created_by: user.id
      });
    
    if (error) {
      console.error("Error saving temp script to Supabase:", error);
      throw error;
    }
    
    localStorage.removeItem("temp_script");
  } catch (error) {
    console.error("Error processing temp script:", error);
  }
};
