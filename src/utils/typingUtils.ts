
// Character state types
export type CharacterState = 'inactive' | 'current' | 'correct' | 'incorrect';

// Character interface
export interface Character {
  char: string;
  state: CharacterState;
}

// Word interface
export interface Word {
  characters: Character[];
}

// Stats interface
export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  elapsedTime: number;
}

// Calculate WPM (words per minute)
export const calculateWPM = (correctChars: number, elapsedTimeInSeconds: number): number => {
  if (elapsedTimeInSeconds === 0) return 0;
  
  // Standard: 5 characters = 1 word
  const words = correctChars / 5;
  const minutes = elapsedTimeInSeconds / 60;
  
  return Math.round(words / minutes);
};

// Calculate accuracy percentage
export const calculateAccuracy = (correctChars: number, incorrectChars: number): number => {
  const totalAttempted = correctChars + incorrectChars;
  if (totalAttempted === 0) return 100;
  
  return Math.round((correctChars / totalAttempted) * 100);
};

// Format time (seconds) to MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Sample quotes for typing test
export const defaultQuotes = [
  "type your favorite things create your favorite scripts share it with others",
  "click on one of the favorite topics above to try them out",
  "upload a script from any llm app just ask it for json strings like ['x', 'y', 'z']",
  "use prompt create a json array of 20 quotes all lowercase no punctuation for the topic <your favorite topic>",
  "make typing personal again one line at a time",
  "don’t forget to sign up so you can follow your stats and build your vibe",
  "your words your rhythm their typing joy",
  "create calm funny sharp or weird scripts for the world to type",
  "typing is better when it comes from you",
  "give your friends something better to type and watch it spread"
];
