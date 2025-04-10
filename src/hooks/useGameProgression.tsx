
import { useState, useEffect } from 'react';
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
        // Get user's progress
        const progress = await gameProgressionService.getUserProgress(user.id);
        if (progress) {
          setUserProgress(progress);
          
          // Get level parameters
          const params = await gameProgressionService.getLevelParameters(progress.currentLevel);
          setLevelParameters(params);
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };
    
    fetchProgressData();
  }, [user]);

  // Calculate required WPM based on baseline and threshold multiplier
  const calculateRequiredWpm = (): number | null => {
    if (!userProgress || !levelParameters || !userProgress.baselineWpm) return null;
    
    return Math.round(userProgress.baselineWpm * levelParameters.wpmThresholdMultiplier);
  };

  // Check if attempt meets success criteria
  const checkAttemptSuccess = (wpm: number, accuracy: number): boolean => {
    if (!userProgress || !levelParameters) return false;
    
    const baselineWpm = userProgress.baselineWpm || 30; // Default if not set
    
    return gameProgressionService.isAttemptSuccessful(
      wpm,
      accuracy,
      baselineWpm,
      levelParameters.wpmThresholdMultiplier,
      levelParameters.accuracyThreshold
    );
  };

  // Update user progress after a quote attempt
  const updateProgress = async (
    quoteId: string,
    wpm: number,
    accuracy: number,
    isSuccessful: boolean
  ): Promise<UserProgress | null> => {
    if (!user || !userProgress) return null;
    
    try {
      const updatedProgress = await gameProgressionService.updateUserProgress(
        user.id,
        quoteId,
        wpm,
        accuracy,
        isSuccessful
      );
      
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
          setIsLevelComplete(true);
          setShowCompletionModal(true);
        }
        
        setUserProgress(updatedProgress);
        
        // If level changed, update level parameters
        if (userProgress.currentLevel !== updatedProgress.currentLevel) {
          const newParams = await gameProgressionService.getLevelParameters(updatedProgress.currentLevel);
          setLevelParameters(newParams);
        }
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating progress:", error);
      return null;
    }
  };

  // Update current quote index in the database
  const updateCurrentQuoteIndex = async (newIndex: number): Promise<boolean> => {
    if (!user) return false;
    
    const success = await gameProgressionService.updateCurrentQuoteIndex(user.id, newIndex);
    
    if (success && userProgress) {
      setUserProgress({
        ...userProgress,
        currentQuoteIndex: newIndex
      });
    }
    
    return success;
  };

  return {
    userProgress,
    levelParameters,
    isLevelComplete,
    showCompletionModal,
    setShowCompletionModal,
    calculateRequiredWpm,
    checkAttemptSuccess,
    updateProgress,
    updateCurrentQuoteIndex
  };
};

export default useGameProgression;
