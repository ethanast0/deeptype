
import React, { useRef } from 'react';
import { MessageCircle, FileJson, FileInput, Link, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BottomMenuProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}

const BottomMenu: React.FC<BottomMenuProps> = ({ 
  onQuotesLoaded,
  className 
}) => {
  const { toast } = useToast();
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle JSON file upload
  const handleJsonFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const quotesData = JSON.parse(content);
        
        // Validate that we have an array of strings
        if (Array.isArray(quotesData) && quotesData.every(quote => typeof quote === 'string')) {
          onQuotesLoaded(quotesData);
          toast({
            title: "Success",
            description: `${quotesData.length} quotes loaded from JSON file.`,
          });
        } else {
          toast({
            title: "Invalid format",
            description: "Please upload a JSON array of strings.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        toast({
          title: "Error",
          description: "Failed to parse JSON file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be uploaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle document file upload
  const handleDocumentFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    toast({
      title: "Processing document",
      description: `Processing ${file.name}...`,
    });
    
    // For demo purposes, we're simulating the API call
    setTimeout(() => {
      // This would be replaced with actual API call to process the document
      // and extract quotes using GPT-4o-mini
      const simulatedQuotes = [
        "The art of typing is not just about speed, but accuracy and rhythm.",
        "Practice makes perfect, especially when it comes to developing typing skills.",
        "A good typist doesn't look at the keyboard, but focuses on the screen.",
        "Typing is like playing an instrument; it requires muscle memory and coordination."
      ];
      
      onQuotesLoaded(simulatedQuotes);
      toast({
        title: "Success",
        description: `${simulatedQuotes.length} quotes extracted from document.`,
      });
    }, 2000);
    
    // Reset the input so the same file can be uploaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle URL paste
  const handleUrlPaste = () => {
    // Get URL from clipboard
    navigator.clipboard.readText()
      .then(url => {
        if (!url.trim()) {
          toast({
            title: "Empty clipboard",
            description: "Please copy a URL before clicking this button.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate URL format
        try {
          new URL(url);
        } catch (e) {
          toast({
            title: "Invalid URL",
            description: "The clipboard content is not a valid URL.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Processing URL",
          description: `Fetching content from ${url}...`,
        });
        
        // For demo purposes, we're simulating the API call
        setTimeout(() => {
          // This would be replaced with actual API call to process the URL
          // and extract quotes using GPT-4o-mini
          const simulatedQuotes = [
            "Success is not final, failure is not fatal: It is the courage to continue that counts.",
            "The best way to predict the future is to create it.",
            "The only limit to our realization of tomorrow is our doubts of today.",
            "Believe you can and you're halfway there."
          ];
          
          onQuotesLoaded(simulatedQuotes);
          toast({
            title: "Success",
            description: `${simulatedQuotes.length} quotes extracted from URL.`,
          });
        }, 2000);
      })
      .catch(err => {
        console.error('Error accessing clipboard:', err);
        toast({
          title: "Error",
          description: "Could not access clipboard. Please check permissions.",
          variant: "destructive",
        });
      });
  };

  // Handle query (coming soon)
  const handleQuery = () => {
    toast({
      title: "Coming Soon",
      description: "The natural language query feature will be available soon!",
    });
  };

  return (
    <div className={cn("fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900 rounded-full px-4 py-2 flex items-center gap-3", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleQuery}
        title="Natural Language Query (Coming Soon)"
      >
        <MessageCircle size={18} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleUrlPaste}
        title="Paste URL"
      >
        <Link size={18} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => documentFileInputRef.current?.click()}
        title="Upload Document (PDF, TXT, DOCX)"
      >
        <FileInput size={18} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => jsonFileInputRef.current?.click()}
        title="Upload JSON"
      >
        <FileJson size={18} />
      </Button>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleJsonFileSelection}
        accept=".json"
        className="hidden"
      />
      
      <input
        type="file"
        ref={documentFileInputRef}
        onChange={handleDocumentFileSelection}
        accept=".txt,.pdf,.docx"
        className="hidden"
      />
    </div>
  );
};

export default BottomMenu;
