import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";

export interface GameLevel {
  level: number;
  wpmThresholdMultiplier: number;
  accuracyThreshold: number;
  requiredQuotes: number;
  maxAttempts: number;
}

export interface UserProgress {
  userId: string;
  baselineWpm: number | null;
  currentLevel: number;
  levelAttemptsUsed: number;
  successfulQuotesCount: number;
  levelBestWpm: number;
  completedQuotes: string[]; // IDs of completed quotes
  currentQuoteIndex: number; // Track the current quote index within the level
}

// Define types for our table rows
interface GameLevelRow {
  id: string;
  level_number: number;
  wpm_threshold_multiplier: number;
  accuracy_threshold: number;
  required_quotes: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
}

interface GameProgressRow {
  id: string;
  user_id: string;
  baseline_wpm: number | null;
  current_level: number;
  level_attempts_used: number;
  successful_quotes_count: number;
  level_best_wpm: number;
  completed_quotes: string[];
  current_quote_index: number;
  created_at: string;
  updated_at: string;
}

interface LevelCompletionLogRow {
  id: string;
  user_id: string;
  level_number: number;
  baseline_wpm: number;
  level_best_wpm: number;
  next_level_number: number | null;
  next_level_threshold: number | null;
  completed_at: string;
}

export const gameProgressionService = {
  // Get the progression matrix from the database
  async getProgressionMatrix(): Promise<Record<number, GameLevel>> {
    try {
      const { data, error } = await supabase
        .from('game_levels')
        .select('*') as { data: GameLevelRow[] | null, error: any };
        
      if (error) {
        console.error("Error fetching game levels:", error);
        return this.getDefaultProgressionMatrix();
      }
      
      // Convert the array to a record indexed by level number
      const levels: Record<number, GameLevel> = {};
      if (data) {
        data.forEach(level => {
          levels[level.level_number] = {
            level: level.level_number,
            wpmThresholdMultiplier: level.wpm_threshold_multiplier,
            accuracyThreshold: level.accuracy_threshold,
            requiredQuotes: level.required_quotes,
            maxAttempts: level.max_attempts
          };
        });
      }
      
      return levels;
    } catch (error) {
      console.error("Unexpected error fetching game levels:", error);
      return this.getDefaultProgressionMatrix();
    }
  },
  
  // Fallback to default progression matrix if database fetch fails
  getDefaultProgressionMatrix(): Record<number, GameLevel> {
    return {
      1: { level: 1, wpmThresholdMultiplier: 0.5, accuracyThreshold: 90, requiredQuotes: 5, maxAttempts: 50 },
      2: { level: 2, wpmThresholdMultiplier: 0.6, accuracyThreshold: 92, requiredQuotes: 5, maxAttempts: 50 },
      3: { level: 3, wpmThresholdMultiplier: 0.7, accuracyThreshold: 94, requiredQuotes: 6, maxAttempts: 50 },
      4: { level: 4, wpmThresholdMultiplier: 0.8, accuracyThreshold: 96, requiredQuotes: 7, maxAttempts: 50 },
      5: { level: 5, wpmThresholdMultiplier: 0.9, accuracyThreshold: 98, requiredQuotes: 8, maxAttempts: 50 },
    };
  },

  // Get level parameters
  async getLevelParameters(level: number): Promise<GameLevel> {
    const matrix = await this.getProgressionMatrix();
    return matrix[level] || matrix[1]; // Default to level 1 if not found
  },

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      console.log("Fetching progress for user:", userId);
      // Get the user's progress from the database
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', userId)
        .single() as { data: GameProgressRow | null, error: any };
        
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log("No existing progress found, initializing new progress");
          // Create a new progress record for this user
          return this.initializeUserProgress(userId);
        }
        console.error("Error fetching user progress:", error);
        return null;
      }
      
      if (!data) return null;
      
      console.log("Progress data fetched:", data);
      
      return {
        userId: data.user_id,
        baselineWpm: data.baseline_wpm,
        currentLevel: data.current_level,
        levelAttemptsUsed: data.level_attempts_used,
        successfulQuotesCount: data.successful_quotes_count,
        levelBestWpm: data.level_best_wpm,
        completedQuotes: data.completed_quotes,
        currentQuoteIndex: data.current_quote_index,
      };
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return null;
    }
  },
  
  // Initialize a new progress record for a user
  async initializeUserProgress(userId: string): Promise<UserProgress> {
    const newProgress = {
      user_id: userId,
      baseline_wpm: null,
      current_level: 1,
      level_attempts_used: 0,
      successful_quotes_count: 0,
      level_best_wpm: 0,
      completed_quotes: [],
      current_quote_index: 0
    };
    
    try {
      const { error } = await supabase
        .from('game_progress')
        .insert(newProgress) as { error: any };
        
      if (error) {
        console.error("Error initializing user progress:", error);
      }
      
      return {
        userId,
        baselineWpm: null,
        currentLevel: 1,
        levelAttemptsUsed: 0,
        successfulQuotesCount: 0,
        levelBestWpm: 0,
        completedQuotes: [],
        currentQuoteIndex: 0
      };
    } catch (error) {
      console.error("Error initializing user progress:", error);
      return {
        userId,
        baselineWpm: null,
        currentLevel: 1,
        levelAttemptsUsed: 0,
        successfulQuotesCount: 0,
        levelBestWpm: 0,
        completedQuotes: [],
        currentQuoteIndex: 0
      };
    }
  },

  // Update user progress after a quote attempt
  async updateUserProgress(
    userId: string, 
    quoteId: string,
    wpm: number,
    accuracy: number,
    isSuccessful: boolean
  ): Promise<UserProgress | null> {
    try {
      // Get current progress
      const progress = await this.getUserProgress(userId);
      if (!progress) return null;
      
      // Get level parameters
      const levelParams = await this.getLevelParameters(progress.currentLevel);
      
      // Calculate updates
      const updatedProgress = { ...progress };
      updatedProgress.levelAttemptsUsed += 1;
      
      if (isSuccessful) {
        updatedProgress.successfulQuotesCount += 1;
        
        // Update completedQuotes array if not already included
        if (!updatedProgress.completedQuotes.includes(quoteId)) {
          updatedProgress.completedQuotes = [...updatedProgress.completedQuotes, quoteId];
        }
        
        // Update levelBestWpm
        if (wpm > updatedProgress.levelBestWpm) {
          updatedProgress.levelBestWpm = wpm;
        }
        
        // Update baseline WPM if not set or if this attempt is higher
        if (!updatedProgress.baselineWpm || wpm > updatedProgress.baselineWpm) {
          updatedProgress.baselineWpm = wpm;
        }
      }
      
      // Check if level is complete
      const isLevelComplete = this.isLevelComplete(
        updatedProgress.successfulQuotesCount, 
        levelParams.requiredQuotes
      );
      
      // Update in database
      const { error } = await supabase
        .from('game_progress')
        .update({
          baseline_wpm: updatedProgress.baselineWpm,
          level_attempts_used: updatedProgress.levelAttemptsUsed,
          successful_quotes_count: updatedProgress.successfulQuotesCount,
          level_best_wpm: updatedProgress.levelBestWpm,
          completed_quotes: updatedProgress.completedQuotes
        })
        .eq('user_id', userId) as { error: any };
        
      if (error) {
        console.error("Error updating user progress:", error);
        return progress; // Return old progress on error
      }
      
      // If level is complete, handle level completion
      if (isLevelComplete) {
        await this.handleLevelCompletion(userId, updatedProgress);
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating user progress:", error);
      return null;
    }
  },
  
  // Handle level completion
  async handleLevelCompletion(userId: string, progress: UserProgress): Promise<void> {
    try {
      const currentLevel = progress.currentLevel;
      const nextLevel = currentLevel + 1;
      const nextLevelParams = await this.getLevelParameters(nextLevel);
      
      // Calculate next level's WPM threshold
      const nextLevelThreshold = progress.baselineWpm 
        ? Math.round(progress.baselineWpm * nextLevelParams.wpmThresholdMultiplier) 
        : null;
      
      // Log the level completion
      await supabase
        .from('level_completion_logs')
        .insert({
          user_id: userId,
          level_number: currentLevel,
          baseline_wpm: progress.baselineWpm || 0,
          level_best_wpm: progress.levelBestWpm,
          next_level_number: nextLevel,
          next_level_threshold: nextLevelThreshold
        }) as { error: any };
      
      // Show level completion notification
      this.showLevelCompletionNotification(
        currentLevel, 
        progress.levelBestWpm, 
        nextLevel,
        nextLevelThreshold
      );
      
      // Reset progress for next level
      await supabase
        .from('game_progress')
        .update({
          current_level: nextLevel,
          level_attempts_used: 0,
          successful_quotes_count: 0,
          level_best_wpm: 0,
          completed_quotes: [],
          current_quote_index: 0
        })
        .eq('user_id', userId) as { error: any };
    } catch (error) {
      console.error("Error handling level completion:", error);
    }
  },
  
  // Show level completion notification
  showLevelCompletionNotification(
    currentLevel: number, 
    bestWpm: number, 
    nextLevel: number,
    nextThreshold: number | null
  ): void {
    // Title with green checkmark
    const title = `🎉 Level ${currentLevel} Complete!`;
    
    // Description with stats and next level goal
    let description = `Your best WPM: ${bestWpm}`;
    
    if (nextThreshold) {
      description += `\nNext Level ${nextLevel} Goal: ${nextThreshold} WPM`;
    }
    
    // Show toast notification
    toast({
      title,
      description,
      duration: 5000,
    });
  },

  // Calculate initial baseline WPM based on multiple attempts
  calculateBaselineWpm(attempts: number[]): number {
    if (attempts.length === 0) return 30; // Default baseline if no attempts
    return Math.max(...attempts);
  },

  // Check if a quote attempt is successful
  isAttemptSuccessful(
    attemptWpm: number,
    attemptAccuracy: number,
    baselineWpm: number,
    wpmThresholdMultiplier: number,
    accuracyThreshold: number
  ): boolean {
    const wpmThreshold = baselineWpm * wpmThresholdMultiplier;
    return attemptWpm >= wpmThreshold && attemptAccuracy >= accuracyThreshold;
  },

  // Check if level is complete
  isLevelComplete(successfulQuotesCount: number, requiredQuotes: number): boolean {
    return successfulQuotesCount >= requiredQuotes;
  },

  // Check if max attempts reached
  isMaxAttemptsReached(attemptsUsed: number, maxAttempts: number): boolean {
    return attemptsUsed >= maxAttempts;
  },

  // Get next quote index - sequential progression
  getNextQuoteIndex(currentIndex: number, totalQuotes: number): number {
    return (currentIndex + 1) % totalQuotes; // Loop back to start if we reach the end
  },
  
  // Update the current quote index
  async updateCurrentQuoteIndex(userId: string, newIndex: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_progress')
        .update({ current_quote_index: newIndex })
        .eq('user_id', userId) as { error: any };
        
      if (error) {
        console.error("Error updating current quote index:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating current quote index:", error);
      return false;
    }
  },

  // Delete a user's progress
  async deleteUserProgress(userId: string): Promise<boolean> {
    try {
      console.log("Deleting progress for user:", userId);
      const { error } = await supabase
        .from('game_progress')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error deleting user progress:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting user progress:", error);
      return false;
    }
  }
};

export default gameProgressionService;
