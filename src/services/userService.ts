import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
}

const LOCAL_STORAGE_USER_KEY = 'cached_user_profile';

// Fetch user profile from database with cache fallback
export const fetchUserProfile = async (id: string): Promise<User | null> => {
  try {
    console.log("Fetching user profile for ID:", id);
    
    // Try to get from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user profile from Supabase:", error);
      // Try to get from local cache as fallback
      const cachedUser = getCachedUserProfile(id);
      if (cachedUser) {
        console.log("Using cached user profile:", cachedUser);
        return cachedUser;
      }
      return null;
    }
    
    if (!data) {
      console.log("No user profile found in database for ID:", id);
      // Try to get from local cache as fallback
      const cachedUser = getCachedUserProfile(id);
      if (cachedUser) {
        console.log("Using cached user profile:", cachedUser);
        return cachedUser;
      }
      return null;
    }
    
    // Create user profile object
    const userProfile = {
      id: data.id,
      username: data.username,
      email: data.email,
      createdAt: data.created_at
    };
    
    console.log("User profile found:", userProfile);
    
    // Cache the profile for future use
    cacheUserProfile(userProfile);
    
    return userProfile;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    
    // Try to get from local cache as fallback
    const cachedUser = getCachedUserProfile(id);
    if (cachedUser) {
      console.log("Using cached user profile after error:", cachedUser);
      return cachedUser;
    }
    
    return null;
  }
};

// Cache the user profile in localStorage
const cacheUserProfile = (user: User): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Error caching user profile:", error);
  }
};

// Get cached user profile from localStorage
const getCachedUserProfile = (id: string): User | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      const cachedUserJson = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (cachedUserJson) {
        const cachedUser = JSON.parse(cachedUserJson) as User;
        // Only return if it's the same user ID
        if (cachedUser.id === id) {
          return cachedUser;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting cached user profile:", error);
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
