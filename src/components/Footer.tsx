
import React from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("py-6 px-8 text-monkey-subtle text-sm", className)}>
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>A minimalist typing test application</p>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="#" 
              className="hover:text-monkey-text transition-colors duration-200"
            >
              github
            </a>
            <a 
              href="#" 
              className="hover:text-monkey-text transition-colors duration-200"
            >
              privacy
            </a>
            <a 
              href="#" 
              className="hover:text-monkey-text transition-colors duration-200"
            >
              terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
