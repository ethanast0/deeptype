
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import gameProgressionService, { UserProgress, GameLevel } from '../services/gameProgressionService';

interface UseGameProgressionReturn {
  userProgress: UserProgress | null;
  levelParameters: GameLevel | null;
  isLevelComplete: boolean;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  calculateRequiredWpm: () => number | null;
  checkAttemptSuccess: (wpm: number, accuracy: number) => boolean;
  updateProgress: (quoteId: string, wpm: number, accuracy: number, isSuccessful: boolean) => Promise<UserProgress | null>;
  updateCurrentQuoteIndex: (newIndex: number) => Promise<boolean>;
  resetProgress: (userId: string) => Promise<UserProgress | null>; // New function to reset progress
}

const useGameProgression = (): UseGameProgressionReturn => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [levelParameters, setLevelParameters] = useState<GameLevel | null>(null);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch user progress and level parameters
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching progress data for user:", user.id);
        
        // Get user's progress
        const progress = await gameProgressionService.getUserProgress(user.id);
        console.log("Progress data received:", progress);
        
        if (progress) {
          setUserProgress(progress);
          
          // Get level parameters
          const params = await gameProgressionService.getLevelParameters(progress.currentLevel);
          console.log("Level parameters received:", params);
          setLevelParameters(params);
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };
    
    fetchProgressData();
  }, [user]);

  // Calculate required WPM based on baseline and threshold multiplier
  const calculateRequiredWpm = useCallback((): number | null => {
    if (!userProgress || !levelParameters || !userProgress.baselineWpm) return null;
    
    return Math.round(userProgress.baselineWpm * levelParameters.wpmThresholdMultiplier);
  }, [userProgress, levelParameters]);

  // Check if attempt meets success criteria
  const checkAttemptSuccess = useCallback((wpm: number, accuracy: number): boolean => {
    if (!userProgress || !levelParameters) return false;
    
    const baselineWpm = userProgress.baselineWpm || 30; // Default if not set
    
    return gameProgressionService.isAttemptSuccessful(
      wpm,
      accuracy,
      baselineWpm,
      levelParameters.wpmThresholdMultiplier,
      levelParameters.accuracyThreshold
    );
  }, [userProgress, levelParameters]);

  // Update user progress after a quote attempt
  const updateProgress = useCallback(async (
    quoteId: string,
    wpm: number,
    accuracy: number,
    isSuccessful: boolean
  ): Promise<UserProgress | null> => {
    console.log("updateProgress called with params:", { quoteId, wpm, accuracy, isSuccessful });
    if (!user || !userProgress) return null;
    
    try {
      const updatedProgress = await gameProgressionService.updateUserProgress(
        user.id,
        quoteId,
        wpm,
        accuracy,
        isSuccessful
      );
      
      console.log("Updated progress:", updatedProgress);
      
      if (updatedProgress) {
        // Check if level was completed
        if (
          userProgress.currentLevel !== updatedProgress.currentLevel ||
          (levelParameters && 
           gameProgressionService.isLevelComplete(
             updatedProgress.successfulQuotesCount, 
             levelParameters.requiredQuotes
           ))
        ) {
          console.log("Level complete detected!");
          setIsLevelComplete(true);
          setShowCompletionModal(true);
        }
        
        setUserProgress(updatedProgress);
        
        // If level changed, update level parameters
        if (userProgress.currentLevel !== updatedProgress.currentLevel) {
          console.log("Level changed, updating parameters");
          const newParams = await gameProgressionService.getLevelParameters(updatedProgress.currentLevel);
          setLevelParameters(newParams);
        }
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating progress:", error);
      return null;
    }
  }, [user, userProgress, levelParameters]);

  // Update current quote index in the database
  const updateCurrentQuoteIndex = useCallback(async (newIndex: number): Promise<boolean> => {
    console.log("Updating current quote index to:", newIndex);
    if (!user) return false;
    
    const success = await gameProgressionService.updateCurrentQuoteIndex(user.id, newIndex);
    
    if (success && userProgress) {
      console.log("Quote index update successful");
      setUserProgress({
        ...userProgress,
        currentQuoteIndex: newIndex
      });
    } else {
      console.log("Quote index update failed");
    }
    
    return success;
  }, [user, userProgress]);

  // Reset a user's progress (new function)
  const resetProgress = useCallback(async (userId: string): Promise<UserProgress | null> => {
    console.log("Resetting progress for user:", userId);
    
    try {
      // Delete the current progress
      const deleted = await gameProgressionService.deleteUserProgress(userId);
      
      if (deleted) {
        console.log("Existing progress deleted successfully");
        
        // Initialize new progress
        const newProgress = await gameProgressionService.initializeUserProgress(userId);
        console.log("New progress initialized:", newProgress);
        
        // Update local state
        setUserProgress(newProgress);
        
        // Get level 1 parameters
        const params = await gameProgressionService.getLevelParameters(1);
        setLevelParameters(params);
        
        setIsLevelComplete(false);
        setShowCompletionModal(false);
        
        return newProgress;
      }
      
      return null;
    } catch (error) {
      console.error("Error resetting progress:", error);
      return null;
    }
  }, []);

  return {
    userProgress,
    levelParameters,
    isLevelComplete,
    showCompletionModal,
    setShowCompletionModal,
    calculateRequiredWpm,
    checkAttemptSuccess,
    updateProgress,
    updateCurrentQuoteIndex,
    resetProgress
  };
};

export default useGameProgression;
