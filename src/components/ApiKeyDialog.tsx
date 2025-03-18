
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ 
  open, 
  onOpenChange,
  onSubmit
}) => {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved API key when dialog opens
    if (open) {
      const savedKey = localStorage.getItem('openai_api_key');
      if (savedKey) setApiKey(savedKey);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    // Save API key to localStorage
    localStorage.setItem('openai_api_key', apiKey.trim());
    
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
    
    if (onSubmit) onSubmit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to use smart quote extraction features.
            Your key is stored only in your browser's local storage and is never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Input
              id="apiKey"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Need an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Get one from OpenAI</a>
            </p>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save API Key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
