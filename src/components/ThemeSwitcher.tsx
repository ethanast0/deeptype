import React from "react";
import { ThemeToggle } from "./ui/theme-toggle";
import { ColorModeSelector } from "./ui/color-mode-selector";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ThemeToggle />
      {/* <ColorModeSelector /> */}
    </div>
  );
};

export default ThemeSwitcher;
