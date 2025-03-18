
import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SmartQuoteUploaderProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}

const SmartQuoteUploader: React.FC<SmartQuoteUploaderProps> = ({ 
  onQuotesLoaded,
  className 
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [url, setUrl] = useState('');
  const [generatedQuotes, setGeneratedQuotes] = useState<string[]>([]);
  const [rawText, setRawText] = useState('');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      // For text files, we'll read them directly
      if (file.type === 'text/plain') {
        const text = await readTextFile(file);
        setRawText(text);
        toast({
          title: "File loaded",
          description: "Text extracted successfully. You can now generate quotes.",
        });
      } else {
        // For this demo, we'll simulate handling PDFs and DOCXs
        // In a real implementation, you would use libraries to extract text from these formats
        toast({
          title: "File type support",
          description: `For this demo, we'll simulate processing ${file.type} files.`,
        });
        
        // Simulate text extraction with a delay
        setTimeout(() => {
          const simulatedText = `This is extracted text from ${file.name}.\n\n` +
            "The quick brown fox jumps over the lazy dog. " +
            "Programming is the art of telling another human what one wants the computer to do. " +
            "The best way to predict the future is to invent it. " +
            "The only way to learn a new programming language is by writing programs in it.";
          
          setRawText(simulatedText);
        }, 1500);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUrlFetch = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, you would call a backend API to fetch and parse the URL
      // For this demo, we'll simulate the fetching with a delay
      toast({
        title: "Fetching URL",
        description: "Attempting to extract content from the URL.",
      });
      
      setTimeout(() => {
        const simulatedText = `Content extracted from ${url}.\n\n` +
          "Simplicity is the ultimate sophistication. " +
          "Code is like humor. When you have to explain it, it's bad. " +
          "First, solve the problem. Then, write the code. " +
          "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.";
        
        setRawText(simulatedText);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Error fetching URL:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content from the URL.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };
  
  const generateQuotes = async () => {
    if (!rawText.trim()) {
      toast({
        title: "Error",
        description: "Please upload a document or paste text first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, you would process the text using an NLP model
      // For this demo, we'll simply split the text on periods to simulate quote extraction
      const sentences = rawText.split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 20); // Only sentences of a certain length
      
      // Take up to 10 sentences as quotes
      const extractedQuotes = sentences.slice(0, 10).map(quote => `${quote}.`);
      
      setGeneratedQuotes(extractedQuotes);
      toast({
        title: "Success",
        description: `${extractedQuotes.length} quotes generated.`,
      });
    } catch (error) {
      console.error('Error generating quotes:', error);
      toast({
        title: "Error",
        description: "Failed to generate quotes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const saveQuotes = () => {
    if (generatedQuotes.length === 0) {
      toast({
        title: "Error",
        description: "No quotes to save.",
        variant: "destructive",
      });
      return;
    }
    
    onQuotesLoaded(generatedQuotes);
    toast({
      title: "Success",
      description: "Quotes saved and ready for typing practice!",
    });
  };
  
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="ml-2 inline-flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Smart Upload
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] md:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Smart Quote Generator</SheetTitle>
          <SheetDescription>
            Upload documents, paste URLs, or enter text to generate quotes for typing practice.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <Tabs defaultValue="document">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="document">Upload Document</TabsTrigger>
              <TabsTrigger value="url">Paste URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="mt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="document-upload" className="block text-sm font-medium mb-2">
                    Upload a document (TXT, PDF, DOCX)
                  </label>
                  <Input
                    id="document-upload"
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For demo purposes, only TXT files are fully processed.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="url-input" className="block text-sm font-medium mb-2">
                    Enter website URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isProcessing}
                    />
                    <Button 
                      onClick={handleUrlFetch}
                      disabled={isProcessing || !url.trim()}
                    >
                      Fetch
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <label htmlFor="extracted-text" className="block text-sm font-medium mb-2">
              Extracted Text
            </label>
            <Textarea
              id="extracted-text"
              placeholder="Text will appear here after uploading a document or fetching a URL..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="h-32"
            />
          </div>
          
          <Button 
            className="mt-4 w-full"
            onClick={generateQuotes}
            disabled={isProcessing || !rawText.trim()}
          >
            {isProcessing ? "Processing..." : "Generate Quotes"}
          </Button>
          
          {generatedQuotes.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Generated Quotes ({generatedQuotes.length})
              </label>
              <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                {generatedQuotes.map((quote, index) => (
                  <div key={index} className="mb-2 pb-2 border-b last:border-0">
                    {quote}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setGeneratedQuotes([])}>
                  Clear
                </Button>
                <Button onClick={saveQuotes}>
                  Save Quotes
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SmartQuoteUploader;
