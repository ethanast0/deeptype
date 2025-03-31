
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  className
}) => {
  const { user } = useAuth();
  
  return <footer className={cn("py-4 text-center text-xs text-monkey-subtle", className)}>
      <div className="container max-w-6xl mx-auto flex justify-center items-center">
        <nav className="flex space-x-2 items-center">
          <Link to="/" className="hover:text-monkey-text transition-colors duration-200">
            home
          </Link>
          <span>/</span>
          
          {user ? (
            <Link to="/profile" className="text-monkey-accent hover:text-monkey-text transition-colors duration-200">
              {user.username}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-monkey-text transition-colors duration-200">
                login
              </Link>
            </>
          )}
          
          <span>/</span>
          <Link to="#" className="hover:text-monkey-text transition-colors duration-200">
            user guide
          </Link>
          <span>/</span>
          <Link to="#" className="hover:text-monkey-text transition-colors duration-200">
            themes
          </Link>
        </nav>
      </div>
    </footer>;
};

export default Footer;
