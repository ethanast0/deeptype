import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

const COLORS = [
  { name: 'Grey', value: 'grey' },
  { name: 'Zinc', value: 'zinc' },
  { name: 'Slate', value: 'slate' },
  { name: 'Green', value: 'green' },
  { name: 'Red', value: 'red' },
] as const

export function ThemeSwitcher() {
  const { theme, colorMode, setTheme, setColorMode } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-monkey-text hover:text-monkey-text hover:bg-monkey-subtle/20"
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-monkey-bg border-monkey-subtle">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="text-monkey-text hover:bg-monkey-subtle/20"
          >
            Light
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="text-monkey-text hover:bg-monkey-subtle/20"
          >
            Dark
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-monkey-subtle/20" />
          {COLORS.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={() => setColorMode(color.value)}
              className={`text-monkey-text hover:bg-monkey-subtle/20 ${
                colorMode === color.value ? 'bg-monkey-subtle/10' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-theme-${color.value}`} />
                {color.name}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 