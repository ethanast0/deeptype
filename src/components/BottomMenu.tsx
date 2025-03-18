
import React, { useRef, useState } from 'react';
import { MessageCircle, FileJson, FileInput, Link, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractQuotesWithAI } from "@/utils/openaiService";
import ApiKeyDialog from "./ApiKeyDialog";

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
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  
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

  // Extract text from document using OpenAI
  const processTextContent = async (text: string, source: string) => {
    if (!localStorage.getItem('openai_api_key')) {
      setIsApiKeyDialogOpen(true);
      return;
    }

    try {
      setProcessingItem(source);
      
      toast({
        title: "Processing Content",
        description: `Extracting quotes from ${source}...`,
      });

      const quotes = await extractQuotesWithAI(text);
      
      onQuotesLoaded(quotes);
      toast({
        title: "Success",
        description: `${quotes.length} quotes extracted from ${source}.`,
      });
    } catch (error) {
      console.error(`Error processing ${source}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to process ${source}.`,
        variant: "destructive",
      });
    } finally {
      setProcessingItem(null);
    }
  };

  // Handle document file upload
  const handleDocumentFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // For now, we'll just read text files directly
      // In a real application, you would use libraries like pdf.js for PDFs or other parsers for DOCX
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        await processTextContent(content, file.name);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading document:', error);
      toast({
        title: "Error",
        description: "Failed to read document.",
        variant: "destructive",
      });
    }
    
    // Reset the input so the same file can be uploaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle URL paste
  const handleUrlPaste = async () => {
    // Get URL from clipboard
    try {
      const url = await navigator.clipboard.readText();
      
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
      
      setProcessingItem('URL');
      toast({
        title: "Processing URL",
        description: `Fetching content from ${url}...`,
      });
      
      try {
        // Use a CORS proxy to fetch the URL content
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Extract text content from HTML using a simple approach
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        await processTextContent(textContent, url);
      } catch (error) {
        console.error('Error fetching URL:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch URL content.",
          variant: "destructive",
        });
        setProcessingItem(null);
      }
    } catch (err) {
      console.error('Error accessing clipboard:', err);
      toast({
        title: "Error",
        description: "Could not access clipboard. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Handle query (coming soon)
  const handleQuery = () => {
    toast({
      title: "Coming Soon",
      description: "The natural language query feature will be available soon!",
    });
  };

  return (
    <>
      <div className={cn("fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900 rounded-full px-4 py-2 flex items-center gap-3", className)}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleQuery}
          title="Natural Language Query (Coming Soon)"
          disabled={processingItem !== null}
        >
          <MessageCircle size={18} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleUrlPaste}
          title="Paste URL"
          disabled={processingItem !== null}
          className={processingItem === 'URL' ? 'animate-pulse' : ''}
        >
          <Link size={18} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => documentFileInputRef.current?.click()}
          title="Upload Document (PDF, TXT, DOCX)"
          disabled={processingItem !== null}
          className={processingItem === 'document' ? 'animate-pulse' : ''}
        >
          <FileInput size={18} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => jsonFileInputRef.current?.click()}
          title="Upload JSON"
          disabled={processingItem !== null}
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
      
      <ApiKeyDialog 
        open={isApiKeyDialogOpen} 
        onOpenChange={setIsApiKeyDialogOpen} 
      />
    </>
  );
};

export default BottomMenu;
