
import React from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";

interface ColorModeSelectorProps {
  className?: string;
}

export function ColorModeSelector({ className }: ColorModeSelectorProps) {
  const { colorMode, setColorMode } = useTheme();

  const colorModes = [
    { value: "zinc", label: "Zinc" },
    { value: "slate", label: "Slate" },
    { value: "gray", label: "Gray" },
    { value: "green", label: "Green" },
    { value: "red", label: "Red" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Select color mode"
          title="Select color theme"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={colorMode}
          onValueChange={(value) => setColorMode(value as any)}
        >
          {colorModes.map((mode) => (
            <DropdownMenuRadioItem
              key={mode.value}
              value={mode.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              {mode.label}
              {colorMode === mode.value && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
