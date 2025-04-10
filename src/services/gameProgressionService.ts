
import { supabase } from "../integrations/supabase/client";

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

// Default progression matrix
const progressionMatrix: Record<number, GameLevel> = {
  1: { level: 1, wpmThresholdMultiplier: 0.5, accuracyThreshold: 90, requiredQuotes: 5, maxAttempts: 50 },
  2: { level: 2, wpmThresholdMultiplier: 0.6, accuracyThreshold: 92, requiredQuotes: 5, maxAttempts: 50 },
  3: { level: 3, wpmThresholdMultiplier: 0.7, accuracyThreshold: 94, requiredQuotes: 6, maxAttempts: 50 },
  4: { level: 4, wpmThresholdMultiplier: 0.8, accuracyThreshold: 96, requiredQuotes: 7, maxAttempts: 50 },
  5: { level: 5, wpmThresholdMultiplier: 0.9, accuracyThreshold: 98, requiredQuotes: 8, maxAttempts: 50 },
};

export const gameProgressionService = {
  // Get the progression matrix
  getProgressionMatrix(): Record<number, GameLevel> {
    return progressionMatrix;
  },

  // Get level parameters
  getLevelParameters(level: number): GameLevel {
    return progressionMatrix[level] || progressionMatrix[1]; // Default to level 1 if not found
  },

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      // TODO: Implement database call to get user progress once we create the table
      // For now, return default values
      return {
        userId,
        baselineWpm: null,
        currentLevel: 1,
        levelAttemptsUsed: 0,
        successfulQuotesCount: 0,
        levelBestWpm: 0,
        completedQuotes: [],
        currentQuoteIndex: 0, // Start with the first quote
      };
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return null;
    }
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
};

export default gameProgressionService;
