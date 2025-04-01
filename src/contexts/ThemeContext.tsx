import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ColorMode = 'grey' | 'zinc' | 'slate' | 'green' | 'red'

interface ThemeContextType {
  theme: Theme
  colorMode: ColorMode
  setTheme: (theme: Theme) => void
  setColorMode: (color: ColorMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    return 'light'
  })
  
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    return (localStorage.getItem('colorMode') as ColorMode) || 'slate'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('colorMode', colorMode)
    
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    root.classList.remove('theme-grey', 'theme-zinc', 'theme-slate', 'theme-green', 'theme-red')
    root.classList.add(`theme-${colorMode}`)
  }, [theme, colorMode])

  return (
    <ThemeContext.Provider value={{ theme, colorMode, setTheme, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 