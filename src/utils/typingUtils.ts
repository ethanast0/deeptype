
export interface Character {
  char: string;
  state: 'inactive' | 'correct' | 'incorrect' | 'current';
}

export interface Word {
  characters: Character[];
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  elapsedTime: number;
}

export const defaultQuotes = [
  "The quick brown fox jumps over the lazy dog.",
  "We promptly judged antique ivory buckles for the next prize.",
  "How vexingly quick daft zebras jump!",
  "Pack my box with five dozen liquor jugs.",
  "Amazingly few discotheques provide jukeboxes.",
  "Sphinx of black quartz, judge my vow.",
  "The five boxing wizards jump quickly.",
  "How razorback-jumping frogs can level six piqued gymnasts!",
  "Crazy Fredrick bought many very exquisite opal jewels.",
  "Sixty zippers were quickly picked from the woven jute bag.",
  "A quivering Texas zombie fought republic linked jewelry.",
  "All questions asked by five watch experts amazed the judge.",
  "The job requires extra pluck and zeal from every young wage earner.",
  "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.",
  "Jaded zombies acted quaintly but kept driving their oxen forward.",
  "The explorer was frozen in his big kayak just after making queer discoveries.",
  "Watch 'Jeopardy!', Alex Trebek's fun TV quiz game.",
  "A wizard's job is to vex chumps quickly in fog.",
  "Bright vixens jump; dozy fowl quack.",
  "Both fickle dwarves jinx my pig quiz.",
  "Big July earthquakes confound zany experimental vow.",
  "Fickle jinx bog dwarves spy math quiz.",
  "Public junk dwarves hug my quartz fox.",
  "Quick fox jumps nightly above wizard.",
  "Jackdaws love my big sphinx of quartz.",
  "Five or six big jet planes zoomed quickly by the tower.",
  "My grandfather picks up quartz and valuable onyx jewels.",
  "Crazy Fredrick bought many very exquisite opal jewels.",
  "We promptly judged antique ivory buckles for the next prize.",
  "The job of waxing linoleum frequently peeves chintzy kids.",
  "Back in June we delivered oxygen equipment of the same size.",
  "The wizard quickly jinxed the gnomes before they vaporized.",
  "Zelda might fix the job growth plans very quickly on Monday.",
  "The public was amazed to view the quickness and dexterity of the juggler.",
  "We have just quoted on nine dozen boxes of gray lamp wicks.",
  "The July sun caused a fragment of black pine wax to ooze on the velvet quilt.",
  "Six big devils from Japan quickly forgot how to waltz.",
  "William excelled at playing jazz with his big saxophone, quite well.",
  "The explorer was frozen in his big kayak just after making queer discoveries.",
  "A quick movement of the enemy will jeopardize five gunboats.",
  "All questions asked by five watch experts amazed the judge.",
  "Jack amazed a few girls by dropping the antique onyx vase.",
  "The silver fox jumped and quickly let out a surprised yelp.",
  "The job requires extra pluck and zeal from every young wage earner.",
  "The large boy jumped over the fence and quickly won the race.",
  "The sympathetic judge was very quick and forward to explain the law.",
  "The prize of the exemplary job was a quick vacation to Zimbabwe.",
  "Six boys guzzled cheap raw whiskey quite joyfully.",
  "Please wait outside of the house for the quail and jackrabbit.",
  "My faxed joke won a pager in the cable TV quiz show."
];

export const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const calculateWPM = (correctChars: number, elapsedTimeInSeconds: number): number => {
  // Standard calculation: Characters per minute / 5 (average word length)
  if (elapsedTimeInSeconds === 0) return 0;
  const minutes = elapsedTimeInSeconds / 60;
  return Math.round(correctChars / 5 / minutes);
};

export const calculateAccuracy = (correctChars: number, incorrectChars: number): number => {
  const totalAttempted = correctChars + incorrectChars;
  if (totalAttempted === 0) return 100;
  return Math.round((correctChars / totalAttempted) * 100);
};

export const parseQuotesFromJSON = (jsonString: string): string[] => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Handle array of strings
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
    
    // Handle object with quotes array
    if (parsed.quotes && Array.isArray(parsed.quotes) && 
        parsed.quotes.every(item => typeof item === 'string')) {
      return parsed.quotes;
    }
    
    throw new Error('Invalid format: JSON must contain an array of strings or an object with a "quotes" array.');
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw error;
  }
};
