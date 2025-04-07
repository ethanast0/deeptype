
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorMode = "slate" | "zinc" | "gray" | "green" | "red";

interface ThemeContextType {
  theme: Theme;
  colorMode: ColorMode;
  setTheme: (theme: Theme) => void;
  setColorMode: (colorMode: ColorMode) => void;
  toggleTheme: () => void;
}

const defaultContext: ThemeContextType = {
  theme: "dark",
  colorMode: "zinc",
  setTheme: () => {},
  setColorMode: () => {},
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "dark"
  );
  
  const [colorMode, setColorMode] = useState<ColorMode>(
    () => (localStorage.getItem("colorMode") as ColorMode) || "zinc"
  );

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply color mode as a data attribute
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-color-mode", colorMode);
    localStorage.setItem("colorMode", colorMode);
  }, [colorMode]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        colorMode, 
        setTheme, 
        setColorMode,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
