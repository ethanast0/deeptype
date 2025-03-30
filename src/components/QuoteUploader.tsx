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

const QuoteUploader: React.FC<QuoteUploaderProps> = ({
  onQuotesLoaded,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
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

        // Validate that we have an array of strings
        if (Array.isArray(quotesData) && quotesData.every(quote => typeof quote === 'string')) {
          // First load the quotes into the typing area
          onQuotesLoaded(quotesData);
          
          // If user is logged in, prompt to save
          // If not logged in, store in temporary storage
          setQuotes(quotesData);
          setScriptName(`Script ${new Date().toLocaleDateString()}`);
          
          if (user) {
            setIsDialogOpen(true);
          } else {
            // Store temporarily in localStorage
            const tempScript = {
              name: `Script ${new Date().toLocaleDateString()}`,
              quotes: quotesData
            };
            localStorage.setItem("temp_script", JSON.stringify(tempScript));
            
            toast({
              title: "Script loaded",
              description: "Sign up or log in to save this script permanently."
            });
          }
        } else {
          toast({
            title: "Invalid format",
            description: "Please upload a JSON array of strings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        toast({
          title: "Error parsing file",
          description: "Please ensure it is a valid JSON file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSaveScript = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save scripts.",
        variant: "destructive"
      });
      setIsDialogOpen(false);
      return;
    }
    
    if (!scriptName.trim()) {
      toast({
        title: "Script name required",
        description: "Please provide a name for your script.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const savedScript = await scriptService.saveScript(user.id, scriptName, quotes);
      
      if (savedScript) {
        toast({
          title: "Script saved",
          description: "Your script has been saved successfully to Supabase."
        });
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Failed to save",
          description: "You can have a maximum of 5 saved scripts.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving script:", error);
      toast({
        title: "Error saving script",
        description: "There was an error saving your script.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelection} 
        accept=".json" 
        className="hidden" 
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-monkey-text">
          <DialogTitle>Save Script</DialogTitle>
          
          <div className="py-4">
            <label htmlFor="scriptName" className="block text-sm text-monkey-subtle mb-2">
              Script Name
            </label>
            <Input
              id="scriptName"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-monkey-text"
              placeholder="Enter a name for your script"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveScript}
              className="bg-monkey-accent text-black hover:bg-monkey-accent/80"
            >
              Save Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuoteUploader;
