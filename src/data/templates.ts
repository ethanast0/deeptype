
// Physics - Interesting phenomena
const physicsQuotes = [
  "The universe is made of protons, neutrons, electrons, and morons.",
  "Every action has an equal and opposite reaction - Newton's Third Law of Motion.",
  "Energy can neither be created nor destroyed, only transformed from one form to another.",
  "The speed of light in a vacuum is exactly 299,792,458 meters per second.",
  "Quantum entanglement allows particles to be connected regardless of distance.",
  "Time dilation causes time to pass slower for objects moving at high speeds.",
  "Black holes are regions where gravity is so strong that nothing can escape, not even light.",
  "The double-slit experiment shows that particles can behave as both particles and waves.",
  "The Higgs boson gives other particles their mass through the Higgs field.",
  "The Uncertainty Principle states we cannot know both the position and momentum of a particle precisely."
];

// History - Facts
const historyQuotes = [
  "The Great Wall of China is not visible from space with the naked eye.",
  "Cleopatra lived closer in time to the moon landing than to the building of the Great Pyramid.",
  "Oxford University is older than the Aztec Empire.",
  "The shortest war in history was between Britain and Zanzibar in 1896, lasting just 38 minutes.",
  "Ancient Romans used crushed mouse brains as toothpaste.",
  "The first computer programmer was a woman named Ada Lovelace.",
  "Viking warriors used the skulls of their enemies as drinking vessels.",
  "The Hundred Years' War between England and France actually lasted 116 years.",
  "Napoleon was once attacked by thousands of rabbits that he had arranged to hunt.",
  "Ancient Egyptian pharaohs were buried with servants who were killed to serve them in the afterlife."
];

// Langraph - For coders
const codingQuotes = [
  "First, solve the problem. Then, write the code.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "The best way to predict the future is to implement it.",
  "Programming isn't about what you know; it's about what you can figure out.",
  "The most important property of a program is whether it accomplishes the intention of its user.",
  "Simplicity is the soul of efficiency.",
  "Make it work, make it right, make it fast.",
  "Premature optimization is the root of all evil.",
  "Code is like humor. When you have to explain it, it's bad.",
  "Software is like entropy: It's difficult to grasp, weighs nothing, and obeys the Second Law of Thermodynamics; i.e., it always increases."
];

// Build - Famous sayings of legends
const legendQuotes = [
  "Stay hungry, stay foolish. - Steve Jobs",
  "The best way to predict the future is to create it. - Peter Drucker",
  "It always seems impossible until it's done. - Nelson Mandela",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "If you want to go fast, go alone. If you want to go far, go together. - African Proverb",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "If your actions inspire others to dream more, learn more, do more and become more, you are a leader. - John Quincy Adams"
];

export interface Template {
  id: string;
  name: string;
  icon: string;
  quotes: string[];
}

export const templates: Template[] = [
  {
    id: "physics",
    name: "Physics",
    icon: "book-open",
    quotes: physicsQuotes
  },
  {
    id: "history",
    name: "History",
    icon: "history",
    quotes: historyQuotes
  },
  {
    id: "coding",
    name: "Coding",
    icon: "code",
    quotes: codingQuotes
  },
  {
    id: "legends",
    name: "Legends",
    icon: "book",
    quotes: legendQuotes
  }
];

export default templates;
