import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, Settings, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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

type MenuView = 'featured' | 'top' | 'new' | 'saved' | 'manage';

const TemplateMenu: React.FC<TemplateMenuProps> = ({
  onSelectTemplate,
  isTyping = false
}) => {
  const [menuView, setMenuView] = useState<MenuView>('featured');
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();

  // Load scripts based on current view
  useEffect(() => {
    loadScripts();
  }, [menuView]);

  // Load saved scripts when user changes
  useEffect(() => {
    if (user) {
      loadSavedScripts();
    } else {
      setSavedScripts([]);
    }
  }, [user]);

  const loadScripts = async () => {
    try {
      let loadedScripts: SavedScript[] = [];
      
      switch (menuView) {
        case 'featured':
          loadedScripts = await scriptService.getScripts({ 
            is_featured: true 
          });
          break;
        case 'top':
          loadedScripts = await scriptService.getScripts({ 
            orderBy: 'saves_count',
            limit: 5 
          });
          break;
        case 'new':
          loadedScripts = await scriptService.getScripts({ 
            orderBy: 'created_at',
            limit: 5 
          });
          break;
      }
      
      setScripts(loadedScripts);
    } catch (error) {
      console.error('Error loading scripts:', error);
      toast({
        title: "Error",
        description: "Failed to load scripts.",
        variant: "destructive"
      });
    }
  };

  const loadSavedScripts = async () => {
    if (!user) return;
    const scripts = await scriptService.getSavedScripts();
    setSavedScripts(scripts);
  };

  const handleSaveScript = async (scriptId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save scripts.",
        variant: "destructive"
      });
      return;
    }

    const success = await scriptService.saveToFavorites(scriptId);
    if (success) {
      toast({
        title: "Script saved",
        description: "Added to your saved scripts."
      });
      loadSavedScripts();
      loadScripts(); // Reload current view to update saves count
    }
  };

  const handleUnsaveScript = async (scriptId: string) => {
    const success = await scriptService.removeFromFavorites(scriptId);
    if (success) {
      toast({
        title: "Script removed",
        description: "Removed from your saved scripts."
      });
      loadSavedScripts();
      loadScripts(); // Reload current view to update saves count
    }
  };

  const handleSelectScript = (script: SavedScript) => {
    setActiveTemplateId(script.id);
    onSelectTemplate(script.quotes, script.id);
  };

  const handleMenuViewChange = (value: string) => {
    if (value === 'manage') {
      handleOpenScriptManager();
    } else if (value) {
      setMenuView(value as MenuView);
    }
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

  const getMenuIcon = (view: MenuView) => {
    switch (view) {
      case 'featured':
        return <Sparkles className="h-4 w-4" />;
      case 'top':
        return <BookOpen className="h-4 w-4" />;
      case 'new':
        return <Clock className="h-4 w-4" />;
      case 'saved':
        return <Heart className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "w-full -mt-32 flex flex-col items-center justify-center transition-opacity duration-300",
      isTyping ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <div className="mb-4 opacity-70 hover:opacity-100 transition-opacity">
        <ToggleGroup 
          type="single" 
          value={menuView} 
          onValueChange={handleMenuViewChange} 
          className="flex items-center justify-center gap-1 text-xs"
        >
          <ToggleGroupItem 
            value="featured" 
            className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Featured</span>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="top" 
            className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent flex items-center gap-1"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Top</span>
          </ToggleGroupItem>

          <ToggleGroupItem 
            value="new" 
            className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent flex items-center gap-1"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>New</span>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="saved" 
            className="h-6 px-2 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent flex items-center gap-1"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Saved</span>
          </ToggleGroupItem>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem 
                  value="manage" 
                  className="h-6 px-2 rounded-full bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-accent"
                >
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
      
      <ScrollArea className="w-full max-w-full">
        <div className={cn(
          "flex animate-fade-in",
          isMobile ? "flex-nowrap overflow-x-auto pb-2 px-2" : "flex-wrap items-center justify-center gap-3"
        )}>
          {menuView !== 'saved' && scripts?.map(script => (
            <div key={script.id} className="relative group">
              <button
                onClick={() => handleSelectScript(script)}
                className={cn(
                  "transition-all duration-300 px-4 py-1.5 rounded-full flex items-center gap-2 shrink-0",
                  isMobile ? "mr-3" : "",
                  activeTemplateId === script.id
                    ? "bg-monkey-accent/20 text-monkey-accent"
                    : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300"
                )}
              >
                {getMenuIcon(menuView)}
                <span>{script.name}</span>
                {script.saves_count > 0 && (
                  <span className="text-xs text-monkey-subtle">({script.saves_count})</span>
                )}
              </button>
              
              <button
                onClick={() => savedScripts.some(s => s.id === script.id)
                  ? handleUnsaveScript(script.id)
                  : handleSaveScript(script.id)
                }
                className={cn(
                  "absolute -right-2 -top-2 p-1 rounded-full transition-opacity",
                  savedScripts.some(s => s.id === script.id)
                    ? "bg-monkey-accent/20 text-monkey-accent opacity-100"
                    : "bg-zinc-800 text-gray-400 opacity-0 group-hover:opacity-100"
                )}
              >
                <Heart className="h-3 w-3" />
              </button>
            </div>
          ))}

          {menuView === 'saved' && savedScripts.length > 0 && savedScripts.map(script => (
            <div key={script.id} className="relative group">
              <button
                onClick={() => handleSelectScript(script)}
                className={cn(
                  "transition-all duration-300 px-4 py-1.5 rounded-full flex items-center gap-2 shrink-0",
                  isMobile ? "mr-3" : "",
                  activeTemplateId === script.id
                    ? "bg-monkey-accent/20 text-monkey-accent"
                    : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300"
                )}
              >
                <Heart className="h-4 w-4" />
                <span>{script.name}</span>
              </button>
              
              <button
                onClick={() => handleUnsaveScript(script.id)}
                className="absolute -right-2 -top-2 p-1 rounded-full bg-monkey-accent/20 text-monkey-accent"
              >
                <Heart className="h-3 w-3" />
              </button>
            </div>
          ))}

          {menuView === 'saved' && savedScripts.length === 0 && (
            <div className="text-center py-4 text-monkey-subtle w-full">
              No saved scripts. Save a script or upload one to get started.
            </div>
          )}
        </div>
      </ScrollArea>

      {user && (
        <ScriptManager
          open={isScriptManagerOpen}
          onOpenChange={setIsScriptManagerOpen}
          scripts={savedScripts}
          userId={user.id}
          onScriptsChange={loadSavedScripts}
          onSelectTemplate={onSelectTemplate}
        />
      )}
    </div>
  );
};

export default TemplateMenu;