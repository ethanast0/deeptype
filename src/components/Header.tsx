import React from 'react';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/use-mobile';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  className
}) => {
  const isMobile = useIsMobile();
  
  return (
    <header className={cn("py-6 px-8", className)}>
      <div className="container max-w-6xl mx-auto flex flex-col items-center relative">
        <h1 className="text-2xl font-medium tracking-tight">
          <span className="text-zinc-500">deep</span>
          <span className="text-green-500">type</span>
        </h1>
        <p className={cn("text-monkey-subtle mt-1 text-center", isMobile ? "text-xs" : "text-sm")}>
          for those who know typing bends time
        </p>
        <div className="absolute right-0 top-0">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;