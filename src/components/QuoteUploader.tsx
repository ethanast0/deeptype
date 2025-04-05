
import React, { useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload } from 'lucide-react';

interface QuoteUploaderProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}

export const QuoteUploaderButton: React.FC<QuoteUploaderProps> = ({
  onQuotesLoaded,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleButtonClick} 
              className="button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal p-2" 
              aria-label="Upload script"
            >
              <Upload size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-monkey-text">
            <p>Upload JSON array of strings.<br />Ask an AI to create one with your favorite topics.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelection} 
        accept=".json" 
        className="hidden" 
      />
    </>
  );
};

const QuoteUploader: React.FC<QuoteUploaderProps> = (props) => {
  return <QuoteUploaderButton {...props} />;
};

export default QuoteUploader;
