
import React, { useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { scriptService } from '../services/scriptService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuoteUploaderProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}

export const QuoteUploaderButton: React.FC<QuoteUploaderProps> = ({
  onQuotesLoaded,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [scriptName, setScriptName] = useState('');

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const quotesData = JSON.parse(content);

        if (Array.isArray(quotesData) && quotesData.every(quote => typeof quote === 'string')) {
          onQuotesLoaded(quotesData);
          setQuotes(quotesData);
          setScriptName(`Script ${new Date().toLocaleDateString()}`);
          if (user) {
            setIsDialogOpen(true);
          } else {
            const tempScript = {
              name: `Script ${new Date().toLocaleDateString()}`,
              quotes: quotesData
            };
            localStorage.setItem("temp_script", JSON.stringify(tempScript));
          }
        } else {
          // Silent failure, no toast
          console.error('Invalid format: Please upload a JSON array of strings.');
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        // Silent failure, no toast
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveScript = async () => {
    if (!user) {
      // Silent failure, no toast
      setIsDialogOpen(false);
      return;
    }
    if (!scriptName.trim()) {
      // Silent failure, no toast
      return;
    }
    try {
      const savedScript = await scriptService.saveScript(user.id, scriptName, quotes);
      if (savedScript) {
        // Silent success, no toast
        setIsDialogOpen(false);
      } else {
        // Silent failure, no toast
        console.error('Failed to save script');
      }
    } catch (error) {
      console.error("Error saving script:", error);
      // Silent failure, no toast
    }
  };

  return <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleButtonClick} className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal p-2" aria-label="Upload script">
              <Upload size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-monkey-text">
            <p>Upload JSON array of strings.<br />Ask an AI to create one with your favorite topics.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <input type="file" ref={fileInputRef} onChange={handleFileSelection} accept=".json" className="hidden" />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-monkey-text">
          <DialogTitle>Save Script</DialogTitle>
          
          <div className="py-4">
            <label htmlFor="scriptName" className="block text-sm text-monkey-subtle mb-2">
              Script Name
            </label>
            <Input id="scriptName" value={scriptName} onChange={e => setScriptName(e.target.value)} className="bg-slate-800 border-slate-700 text-monkey-text" placeholder="Enter a name for your script" />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-slate-800 hover:bg-slate-700 border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleSaveScript} className="bg-monkey-accent text-black hover:bg-monkey-accent/80">
              Save Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
};

const QuoteUploader: React.FC<QuoteUploaderProps> = (props) => {
  return <QuoteUploaderButton {...props} />;
};

export default QuoteUploader;
