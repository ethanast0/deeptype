
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
  "The quick brown fox jumps over the lazy dog.",
  "Programming is the art of telling another human what one wants the computer to do.",
  "The best way to predict the future is to invent it.",
  "The only way to learn a new programming language is by writing programs in it.",
  "Simplicity is the ultimate sophistication.",
  "Code is like humor. When you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "The most disastrous thing that you can ever learn is your first programming language.",
  "The most important property of a program is whether it accomplishes the intention of its user."
];
