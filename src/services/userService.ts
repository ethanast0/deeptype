
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
  if (!id) {
    console.error("fetchUserProfile called with empty ID");
    return null;
  }

  console.log("Fetching user profile for ID:", id);
  
  // First check cache immediately - no need to wait if we have it
  const cachedUser = getCachedUserProfile(id);
  if (cachedUser) {
    console.log("Using cached user profile (immediate):", cachedUser);
    
    // Also fetch from DB in the background to update cache, but return cached version immediately
    refreshUserProfileCache(id).catch(err => 
      console.error("Background cache refresh failed:", err)
    );
    
    return cachedUser;
  }
  
  try {
    // Try to get from Supabase with timeout protection
    const fetchPromise = supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', id)
      .maybeSingle();
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database fetch timed out")), 5000);
    });
    
    // Use Promise.race to implement timeout
    const { data, error } = await Promise.race([
      fetchPromise,
      timeoutPromise.then(() => {
        throw new Error("Fetch timed out");
      })
    ]) as any;
    
    if (error) {
      console.error("Error fetching user profile from Supabase:", error);
      // Fall back to cache if DB fetch fails
      const cachedUser = getCachedUserProfile(id);
      if (cachedUser) {
        console.log("Using cached user profile after error:", cachedUser);
        return cachedUser;
      }
      return null;
    }
    
    if (!data) {
      console.log("No user profile found in database for ID:", id);
      // Fall back to cache one more time
      const cachedUser = getCachedUserProfile(id);
      if (cachedUser) {
        console.log("Using cached user profile when no data found:", cachedUser);
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
    
    console.log("User profile found from database:", userProfile);
    
    // Cache the profile for future use
    cacheUserProfile(userProfile);
    
    return userProfile;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    
    // Try to get from local cache as fallback
    const cachedUser = getCachedUserProfile(id);
    if (cachedUser) {
      console.log("Using cached user profile after exception:", cachedUser);
      return cachedUser;
    }
    
    // If all else fails, try to construct a minimal user object from ID
    // This is a last resort to prevent login failures
    if (id) {
      console.log("Creating minimal emergency user profile with ID:", id);
      const minimalUser = {
        id: id,
        username: "User", // Generic fallback
        email: "user@example.com", // Will be updated on next successful fetch
      };
      cacheUserProfile(minimalUser);
      return minimalUser;
    }
    
    return null;
  }
};

// Background refresh of user profile cache without blocking UI
const refreshUserProfileCache = async (id: string): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error("Background cache refresh error:", error);
      return;
    }
    
    if (!data) {
      console.log("No data found during background refresh");
      return;
    }
    
    const userProfile = {
      id: data.id,
      username: data.username,
      email: data.email,
      createdAt: data.created_at
    };
    
    console.log("Background cache updated with fresh data");
    cacheUserProfile(userProfile);
  } catch (error) {
    console.error("Error in background cache refresh:", error);
  }
};

// Cache the user profile in localStorage
const cacheUserProfile = (user: User): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      console.log("Caching user profile:", user);
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
        try {
          const cachedUser = JSON.parse(cachedUserJson) as User;
          // Only return if it's the same user ID
          if (cachedUser && cachedUser.id === id) {
            return cachedUser;
          } else {
            console.log("Cached user ID mismatch or invalid format");
          }
        } catch (e) {
          console.error("Error parsing cached user JSON:", e);
          // Clear invalid cache
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
      } else {
        console.log("No cached user profile found");
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
        name: parsedScript.name,
        content: JSON.stringify(parsedScript.quotes),
        category: 'Custom',
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
