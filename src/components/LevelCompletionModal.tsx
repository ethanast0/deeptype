
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LevelCompletionModalProps {
  open: boolean;
  onClose: () => void;
  levelNumber: number;
  bestWpm: number;
  nextLevelNumber: number;
  nextLevelThreshold: number | null;
}

const LevelCompletionModal: React.FC<LevelCompletionModalProps> = ({
  open,
  onClose,
  levelNumber,
  bestWpm,
  nextLevelNumber,
  nextLevelThreshold
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">🎉</span> Level {levelNumber} Complete!
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Congratulations on completing this level!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-white mb-2">Your Performance</h3>
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Best WPM:</span>
                <span className="text-monkey-accent font-semibold">{bestWpm}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white mb-2">Next Level</h3>
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Level:</span>
                <span className="text-green-400 font-semibold">{nextLevelNumber}</span>
              </div>
              {nextLevelThreshold && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Target WPM:</span>
                  <span className="text-yellow-400 font-semibold">{nextLevelThreshold} WPM</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="bg-monkey-accent hover:bg-monkey-accent-dark text-black w-full" 
            onClick={onClose}
          >
            Continue to Level {nextLevelNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompletionModal;
