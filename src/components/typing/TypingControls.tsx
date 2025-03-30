
import React from 'react';

interface TypingControlsProps {
  resetTest: () => void;
  loadNewQuote: () => void;
}

const TypingControls: React.FC<TypingControlsProps> = ({
  resetTest,
  loadNewQuote
}) => {
  return (
    <div className="flex justify-center items-center w-full mt-4 mb-8">
      <div className="flex gap-4">
        <button 
          onClick={resetTest} 
          className="button button-accent bg-slate-850 hover:bg-slate-700 text-gray-400 font-normal text-base"
        >
          redo
        </button>
        <button 
          onClick={loadNewQuote} 
          className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base"
        >
          new [shift + enter]
        </button>
      </div>
    </div>
  );
};

export default TypingControls;
