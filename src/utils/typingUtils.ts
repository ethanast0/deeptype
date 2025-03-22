
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
  "type your favorite things create your favorite scripts make it public so others can type too",
  "click on one of the favorite topics above to try them out",
  "click on one of the favorite topics above to try them out",
  "make typing personal again one line at a time",
  "upload a script upload a script its right at the bottom use json strings",
  "give the world something better to type and watch it spread",
  "we passed paper in class now we send silence online",
  "writing slow made the thoughts feel real, writing slow made the thoughts feel real, writing so slow made the thoughts feel real",
  "typewriters shouted your thoughts and now keyboards whisper them",
  "doodles in notebooks said more than most group chats",
  "stationery is our love language stationery is our love language",
  "use prompt create a json array of 20 quotes all lowercase no punctuation for the topic <your favorite topic>",
  "handwriting had personality typing has font settings",
  "make typing personal again one line at a time",
  "dont forget to sign up so you can follow your stats and build your vibe",
  "your words your rhythm their typing joy",
  "create calm funny sharp or weird scripts for the world to type",
  "typing is better when it comes from you",
  "give your friends something better to type and watch it spread"
  "built by a typist who touched 168 wpm on monkeytype",
  "what are the odds that you used an ink pen with the same care you now type a password",
  "ink stains on fingers felt like proof you had something to say",
  "you could tell how someone felt by their slant",
  "even the margins had meaning"
];
