
import React from 'react';
import { cn } from '../lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("py-6 px-8", className)}>
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-medium tracking-tight">
            <span className="text-monkey-accent">type</span>test
          </h1>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-monkey-subtle">
          <a 
            href="#" 
            className="hover:text-monkey-text transition-colors duration-200"
          >
            test
          </a>
          <a 
            href="#" 
            className="hover:text-monkey-text transition-colors duration-200"
          >
            about
          </a>
          <a 
            href="#" 
            className="hover:text-monkey-text transition-colors duration-200"
          >
            settings
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
