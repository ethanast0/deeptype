
import React from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  className
}) => {
  return (
    <footer className={cn("py-4 text-center text-gray-500 text-sm", className)}>
      <div className="container mx-auto">
        <p>© {new Date().getFullYear()} MonkeyType. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
