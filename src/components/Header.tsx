
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  className
}) => {
  const {
    user
  } = useAuth();
  
  return <header className={cn("py-6 px-8", className)}>
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-medium tracking-tight">
            typings
          </h1>
        </div>
      </div>
    </header>;
};

export default Header;
