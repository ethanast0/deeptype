import React, { useRef, useState, useEffect } from 'react';
import { MessageCircle, FileJson, FileInput, Link } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractQuotesWithAI } from "@/utils/openaiService";
import ApiKeyDialog from "./ApiKeyDialog";
import { ToastAction } from "@/components/ui/toast";

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
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Helper function to process text content
  const processTextContent = async (text: string, source?: string) => {
    try {
      setIsLoading(true);
      
      // Get subscription tier and API key
      const tier = localStorage.getItem('subscription_tier') || 'free';
      const apiKey = localStorage.getItem('together_api_key');
      
      toast({
        title: "Processing",
        description: `Extracting quotes${source ? ' from ' + source : ''}...`,
      });
      
      // Call API to extract quotes
      const response = await fetch('/api/extract-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // In a real app, this would be from auth
          'x-subscription-tier': tier,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          text,
          preferences: {
            count: 10,
            maxLength: 150
          }
        })
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for quota exceeded
        if (errorData.error?.code === 'QUOTA_EXCEEDED') {
          toast({
            title: "Quota Exceeded",
            description: "You've reached your free tier limit. Upgrade to Pro for unlimited quotes.",
            action: (
              <ToastAction altText="Upgrade" onClick={() => setIsApiKeyDialogOpen(true)}>
                Upgrade
              </ToastAction>
            ),
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.error?.message || 'Failed to extract quotes');
        }
        return;
      }
      
      const data = await response.json();
      
      // Update quotes in the handler function passed from parent
      onQuotesLoaded(data.quotes);
      
      toast({
        title: "Quotes Ready",
        description: `Extracted ${data.quotes.length} quotes using ${data.model_used}`,
      });
      
    } catch (error) {
      console.error('Error processing text:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingItem(null);
    }
  };

  // Handle document file upload
  const handleDocumentFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      toast({
        title: "Processing Document",
        description: `Reading ${file.name}...`,
      });
      
      // Get subscription tier
      const tier = localStorage.getItem('subscription_tier') || 'free';
      const apiKey = localStorage.getItem('together_api_key');
      
      // Check if user is on Pro tier
      if (tier !== 'pro') {
        toast({
          title: "Pro Plan Required",
          description: "Document processing requires a Pro subscription.",
          variant: "destructive",
          action: (
            <ToastAction altText="Upgrade" onClick={() => setIsApiKeyDialogOpen(true)}>
              Upgrade
            </ToastAction>
          ),
        });
        setIsLoading(false);
        return;
      }
      
      // Read file as base64
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        
        const base64String = (event.target.result as string).split(',')[1];
        
        // Get MIME type from file
        const mimeType = file.type;
        
        // Send to backend
        const response = await fetch('/api/process-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user', // In a real app, this would be from auth
            'x-subscription-tier': tier,
            ...(apiKey ? { 'x-api-key': apiKey } : {})
          },
          body: JSON.stringify({
            document: base64String,
            mimeType,
            preferences: {
              count: 10,
              maxLength: 150
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to process document');
        }
        
        const data = await response.json();
        
        // Update quotes in the handler function passed from parent
        onQuotesLoaded(data.quotes);
        
        toast({
          title: "Document Processed",
          description: `Extracted ${data.quotes.length} quotes in ${Math.round(data.processing_time / 1000)}s using ${data.model_used}`,
        });
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL paste
  const handleUrlPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      // Simple URL validation
      if (!clipboardText.startsWith('http')) {
        toast({
          title: "Invalid URL",
          description: "Please copy a valid URL to your clipboard.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      setProcessingItem('url');
      
      // Get subscription tier
      const tier = localStorage.getItem('subscription_tier') || 'free';
      const apiKey = localStorage.getItem('together_api_key');
      
      // Check if user is on Pro tier
      if (tier !== 'pro') {
        toast({
          title: "Pro Plan Required",
          description: "URL processing requires a Pro subscription.",
          variant: "destructive",
          action: (
            <ToastAction altText="Upgrade" onClick={() => setIsApiKeyDialogOpen(true)}>
              Upgrade
            </ToastAction>
          ),
        });
        setIsLoading(false);
        setProcessingItem(null);
        return;
      }
      
      toast({
        title: "Processing URL",
        description: `Reading content from ${clipboardText.substring(0, 30)}...`,
      });
      
      // Send to backend
      const response = await fetch('/api/process-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // In a real app, this would be from auth
          'x-subscription-tier': tier,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          url: clipboardText,
          preferences: {
            count: 10,
            maxLength: 150
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to process URL');
      }
      
      const data = await response.json();
      
      // Update quotes in the handler function passed from parent
      onQuotesLoaded(data.quotes);
      
      toast({
        title: "URL Processed",
        description: `Extracted ${data.quotes.length} quotes from ${clipboardText.substring(0, 20)}...`,
      });
      
    } catch (error) {
      console.error('Error processing URL:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingItem(null);
    }
  };

  // Handle query (coming soon)
  const handleQuery = () => {
    toast({
      title: "Coming Soon",
      description: "The natural language query feature will be available soon!",
    });
  };

  // Add this function to check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      // Get subscription tier from localStorage
      const tier = localStorage.getItem('subscription_tier') || 'free';
      
      // If we're in a real app with backend, we'd fetch the status
      const response = await fetch('/api/quota', {
        headers: {
          'x-user-id': 'demo-user', // In a real app, this would be from auth
          'x-subscription-tier': tier
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota status');
      }
      
      const data = await response.json();
      
      // Show different toast based on quota status
      if (tier === 'pro') {
        toast({
          title: "Pro Plan Active",
          description: `You have unlimited quotes available.`,
        });
      } else {
        toast({
          title: "Free Plan",
          description: `${data.quota.remaining} of ${data.quota.limit} quotes remaining this month.`,
        });
        
        // If quota is low, suggest upgrading
        if (data.quota.remaining < 10) {
          setTimeout(() => {
            toast({
              title: "Running Low",
              description: "Consider upgrading to Pro for unlimited quotes.",
              action: (
                <ToastAction altText="Upgrade" onClick={() => setIsApiKeyDialogOpen(true)}>
                  Upgrade
                </ToastAction>
              ),
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // Fallback to showing local storage data
      const tier = localStorage.getItem('subscription_tier') || 'free';
      toast({
        title: tier === 'pro' ? "Pro Plan" : "Free Plan",
        description: tier === 'pro' 
          ? "Unlimited quotes available" 
          : "100 quotes per month",
      });
    }
  };
  
  // Add this effect to check status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

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
