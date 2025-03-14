
import React, { useState } from 'react';
import { parseQuotesFromJSON } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';

interface QuoteUploaderProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}

const QuoteUploader: React.FC<QuoteUploaderProps> = ({ onQuotesLoaded, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a valid JSON file.",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const quotes = parseQuotesFromJSON(jsonContent);
        
        if (quotes.length === 0) {
          toast({
            title: "Empty quotes file",
            description: "The file doesn't contain any quotes.",
            variant: "destructive",
          });
          return;
        }
        
        onQuotesLoaded(quotes);
        toast({
          title: "Quotes loaded successfully",
          description: `${quotes.length} quotes have been loaded.`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "The file contains invalid JSON or doesn't have the expected format.",
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the file.",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);
  };
  
  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };
  
  return (
    <div className={cn("mt-10 max-w-md mx-auto", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center transition-colors duration-300",
          {
            "border-monkey-accent bg-monkey-accent bg-opacity-5": isDragging,
            "border-monkey-subtle": !isDragging,
          }
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-lg mb-2">Upload Custom Quotes</div>
        <p className="text-monkey-subtle text-sm mb-4">
          Drag & drop a JSON file or click to browse
        </p>
        
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          id="file-upload"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        
        <label
          htmlFor="file-upload"
          className="button button-accent cursor-pointer inline-block"
        >
          Select File
        </label>
        
        <p className="text-xs text-monkey-subtle mt-4">
          File should contain a JSON array of strings or an object with a "quotes" property containing an array of strings.
        </p>
      </div>
    </div>
  );
};

export default QuoteUploader;
