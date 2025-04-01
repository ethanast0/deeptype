import React from 'react';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/use-mobile';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  className
}) => {
  const isMobile = useIsMobile();
  
  return (
    <header className={cn("py-6 px-8", className)}>
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex flex-col items-center flex-grow">
          <h1 className="text-2xl font-medium tracking-tight"></h1>
          <p className={cn("text-monkey-subtle mt-1 text-center", isMobile ? "text-xs" : "text-sm")}>
            for those who know typing bends time
          </p>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;