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
            <Link to="/">
              <span className="text-monkey-accent">type</span>gram
            </Link>
          </h1>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-monkey-subtle">
          <Link to="/" className="hover:text-monkey-text transition-colors duration-200">
            test
          </Link>
          
          
          
          {user ? <Link to="/profile" className="text-monkey-accent hover:text-monkey-text transition-colors duration-200">
              {user.username}
            </Link> : <>
              <Link to="/login" className="hover:text-monkey-text transition-colors duration-200">
                login
              </Link>
              <Link to="/signup" className="text-monkey-accent hover:text-monkey-accent/80 transition-colors duration-200">
                sign up
              </Link>
            </>}
        </nav>
      </div>
    </header>;
};
export default Header;
