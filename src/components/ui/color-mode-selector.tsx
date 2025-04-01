import React from "react";
import { Palette } from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ColorModeSelectorProps {
  className?: string;
}

export function ColorModeSelector({ className }: ColorModeSelectorProps) {
  const { colorMode, setColorMode } = useTheme();
  
  const colorModes = [
    { value: "slate", label: "Slate" },
    { value: "zinc", label: "Zinc" },
    { value: "gray", label: "Gray" },
    { value: "green", label: "Green" },
    { value: "red", label: "Red" },
  ];

  const getColorPreview = (color: string) => {
    switch (color) {
      case "slate": return "bg-slate-500";
      case "zinc": return "bg-zinc-500";
      case "gray": return "bg-gray-500";
      case "green": return "bg-green-500";
      case "red": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("rounded-full", className)}
          aria-label="Select color mode"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select color mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colorModes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => setColorMode(mode.value as any)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={cn("w-4 h-4 rounded-full", getColorPreview(mode.value))} />
            <span>{mode.label}</span>
            {colorMode === mode.value && (
              <span className="ml-auto font-medium">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 