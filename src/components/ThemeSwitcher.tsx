
import React from "react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  // ThemeSwitcher component is empty now, as we're removing the theme toggles
  return <div className={cn(className)} />;
};

export default ThemeSwitcher;
