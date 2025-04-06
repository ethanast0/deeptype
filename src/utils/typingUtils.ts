
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
  "fair grass after a great test join him upon my opinon",
  "the best race against that car pin on my joy upon him a kin opinion",
  "The future belongs to those who believe in the beauty of their dreams. The important thing is not to stop questioning. Curiosity has its own reason for existence. One cannot help but be in awe when he contemplates the mysteries of eternity, of life, of the marvelousstructure of reality. It is enough if one tries merely to comprehend a little of this mystery each day. Never lose a holy curiosity. Try not to become a man of success but rather try to become a man of value. He is considered successful in our day who gets more out of life than he puts in. But a man of value will give more than he receives",
  "make typing personal again one line at a time",
  "The pressure to have it all figured out by a certain age is a myth. There is no magic timeline for success, for love, for happiness. Everyone's journey is different, and comparing your chapter one to someone else's chapter twenty will only lead to unnecessary anxiety. Focus on your own pace, your own growth, and trust that you are exactly where you need to be in this moment",
  "give the world something better to type and watch it spread",
  "we passed paper in class now we send silence online",
  "writing slow made the thoughts feel real, writing slow made the thoughts feel real, writing so slow made the thoughts feel real",
  "typewriters shouted your thoughts and now keyboards whisper them",
  "doodles in notebooks said more than most group chats",
  "People don't buy what you do, they buy why you do it. And what you do simply proves what you believe. In fact, people will do business with and work for those who believe what they themselves believe. The goal is not to sell to everyone who needs what you have. The goal is to sell to people who believe what you believe. The goal is not to simply hire people who need a job. It's to hire people who believe what you believe. I always say that if you hire people just because they can do a job, they'll work for your money. But if you hire people who believe what you believe, they'll work for you with blood and sweat and tears",
  "make typing personal again one line at a time",
  "dont forget to sign up so you can follow your stats and build your progress",
  "The idea that the future is unpredictable is undermined every day by the ease with which the past is explained. Hindsight bias has pernicious effects on the evaluations of decision makers. It leads observers to assess the quality of a decision not by whether the process was sound but by whether its outcome was good or bad. A particularly unfortunate consequence is that professionals who make genuinely uncertain predictions are often punished for being wrong, and those who happen to be right are rewarded for mere luck",
  "create calm funny sharp or weird scripts for the world to type",
  "typing is better when it comes from you",
  "what are the odds that you used an ink pen with the same care you now type a password",
  "you could tell how someone felt by their slant",
  "even the margins had meaning",
  "the only true wisdom is in knowing you know nothing",
  "see his pale face as his pain is real"
];
