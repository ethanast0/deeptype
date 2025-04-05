import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, History, Code, Book, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript, scriptService } from '../services/scriptService';
import ScriptManager from './ScriptManager';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from '../hooks/use-mobile';

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
  isTyping?: boolean;
}

type MenuView = 'templates' | 'saved' | 'manage';

const TemplateMenu: React.FC<TemplateMenuProps> = ({
  onSelectTemplate,
  isTyping = false
}) => {
  const [menuView, setMenuView] = useState<MenuView>('templates');
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      loadSavedScripts();
    } else {
      setSavedScripts([]);
    }
  }, [user]);
  const loadSavedScripts = async () => {
    if (!user) return;
    try {
      const scripts = await scriptService.getScripts(user.id);
      setSavedScripts(scripts);
    } catch (error) {
      console.error("Error loading saved scripts:", error);
    }
  };
  const getIcon = (templateId: string) => {
    switch (templateId) {
      case 'Comedy':
        return <BookOpen className="h-4 w-4" />;
      case 'Calm':
        return <History className="h-4 w-4" />;
      case 'Theory':
        return <Code className="h-4 w-4" />;
      case 'Legend':
        return <Book className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };
  const handleSelectTemplate = (templateId: string, quotes: string[]) => {
    setActiveTemplateId(templateId);
    onSelectTemplate(quotes);
  };
  const handleSelectSavedScript = (script: SavedScript) => {
    setActiveTemplateId(script.id);
    onSelectTemplate(script.quotes, script.id);
  };
  const handleOpenScriptManager = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to manage your saved scripts.",
        variant: "destructive"
      });
      return;
    }
    setIsScriptManagerOpen(true);
  };
  const handleMenuViewChange = (value: string) => {
    if (value === 'manage') {
      handleOpenScriptManager();
    } else if (value) {
      setMenuView(value as MenuView);
    }
  };
  return <div className={cn(
    "w-full -mt-16 flex flex-col items-center justify-center transition-opacity duration-300",
    isTyping ? "opacity-0 pointer-events-none" : "opacity-100"
  )}>
      {/* Menu selector - minimal toggle group */}
      <div className="mb-4 opacity-70 hover:opacity-100 transition-opacity">
        <ToggleGroup type="single" value={menuView} onValueChange={handleMenuViewChange} className="flex items-center justify-center gap-1 text-xs">
          <ToggleGroupItem value="templates" className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent">
            Top
          </ToggleGroupItem>
          
          <ToggleGroupItem value="saved" className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent">
            Saved
          </ToggleGroupItem>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="manage" className="h-6 px-2 rounded-full bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent">
                  <Settings className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 text-monkey-text">
                Manage Scripts
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ToggleGroup>
      </div>
      
      {/* Template buttons - horizontally scrollable on mobile */}
      <ScrollArea className="w-full max-w-full">
        <div className={cn("flex animate-fade-in", isMobile ? "flex-nowrap overflow-x-auto pb-2 px-2" : "flex-wrap items-center justify-center gap-3")}>
          {menuView === 'templates' && templates.map(template => <button key={template.id} onClick={() => handleSelectTemplate(template.id, template.quotes)} className={cn("transition-all duration-300 px-1 py-0.5 flex items-center justify-center gap-2 shrink-0", isMobile ? "mr-3" : "", activeTemplateId === template.id ? "bg-monkey-accent/20 text-monkey-accent" : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300")}>
              {getIcon(template.id)}
              <span>{template.name}</span>
            </button>)}

          {menuView === 'saved' && savedScripts.length > 0 && savedScripts.map(script => <button key={script.id} onClick={() => handleSelectSavedScript(script)} className={cn("transition-all duration-300 px-1 py-0.5 flex items-center justify-center gap-2 shrink-0", isMobile ? "mr-3" : "", activeTemplateId === script.id ? "bg-monkey-accent/20 text-monkey-accent" : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300")}>
              <Heart className="h-4 w-4" />
              <span>{script.name}</span>
            </button>)}

          {menuView === 'saved' && savedScripts.length === 0 && <div className="text-center py-2 text-monkey-subtle w-full">
              No saved scripts. Save a script or upload one to get started.
            </div>}
        </div>
      </ScrollArea>

      {user && <ScriptManager open={isScriptManagerOpen} onOpenChange={setIsScriptManagerOpen} scripts={savedScripts} userId={user.id} onScriptsChange={loadSavedScripts} onSelectTemplate={onSelectTemplate} />}
    </div>;
};
export default TemplateMenu;