import React from 'react';
import { CarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceAnimationProps {
  totalChars: number;
  currentCharIndex: number;
  className?: string;
}

const RaceAnimation: React.FC<RaceAnimationProps> = ({
  totalChars,
  currentCharIndex,
  className
}) => {
  // Calculate progress percentage
  const progress = totalChars > 0 ? (currentCharIndex / totalChars) * 100 : 0;
  
  return (
    <div className={cn("w-full h-8 relative flex items-center px-2", className)}>
      {/* Track line */}
      <div className="w-full h-[2px] bg-zinc-800 rounded">
        {/* Progress line */}
        <div 
          className="h-full bg-monkey-accent rounded transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Car icon */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-100 ease-linear"
        style={{ left: `${progress}%` }}
      >
        <CarIcon 
          className="w-6 h-6 text-monkey-accent -translate-x-1/2" 
          style={{ transform: 'scaleX(-1)' }} // Flip the car horizontally
        />
      </div>
    </div>
  );
};

export default RaceAnimation; 