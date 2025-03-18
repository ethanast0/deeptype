import React, { useRef } from 'react';
import { cn } from '../lib/utils';
interface QuoteUploaderProps {
  onQuotesLoaded: (quotes: string[]) => void;
  className?: string;
}
const QuoteUploader: React.FC<QuoteUploaderProps> = ({
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

        // Validate that we have an array of strings
        if (Array.isArray(quotesData) && quotesData.every(quote => typeof quote === 'string')) {
          onQuotesLoaded(quotesData);
        } else {
          alert('Invalid quotes format. Please upload a JSON array of strings.');
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        alert('Error parsing file. Please ensure it is a valid JSON file.');
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
  return <div className={cn("mt-12 text-center", className)}>
      <p className="text-monkey-subtle mb-4 text-base font-extralight">Upload custom script (JSON array of strings)</p>
      
      <button onClick={handleButtonClick} className="px-4 py-2 rounded-md bg-monkey-subtle bg-opacity-20 text-monkey-text 
                   transition-all duration-300 hover:bg-opacity-30">
        Upload Quotes
      </button>
      
      <input type="file" ref={fileInputRef} onChange={handleFileSelection} accept=".json" className="hidden" />
    </div>;
};
export default QuoteUploader;