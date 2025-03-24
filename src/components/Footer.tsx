
import React from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  className
}) => {
  return (
    <footer className={cn("py-4 text-center text-xs text-gray-600", className)}>
      <p>Backspace navigates to previous words and corrects mistakes.</p>
    </footer>
  );
};

export default Footer;
