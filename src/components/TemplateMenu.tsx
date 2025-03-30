import React, { useState, useEffect } from 'react';
import { BookOpen, History, Code, Book, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript, scriptService } from '../services/scriptService';
import ScriptManager from './ScriptManager';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
}
type MenuView = 'templates' | 'saved' | 'manage';
const TemplateMenu: React.FC<TemplateMenuProps> = ({
  onSelectTemplate
}) => {
  const [menuView, setMenuView] = useState<MenuView>('templates');
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
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
  return <div className="w-full mb-8 flex flex-col items-center justify-center">
      {/* Menu selector - minimal toggle group */}
      <div className="mb-4 opacity-70 hover:opacity-100 transition-opacity">
        <ToggleGroup type="single" value={menuView} onValueChange={handleMenuViewChange} className="flex items-center justify-center gap-4 text-xs">
          <ToggleGroupItem value="templates" className="h-6 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-monkey-subtle px-0 text-base font-normal">
            top
          </ToggleGroupItem>
          
          <ToggleGroupItem value="saved" className="h-6 bg-transparent data-[state=on]:bg-transparent px-0 text-emerald-700 text-base">
            saved
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
      
      {/* Template buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-in">
        {menuView === 'templates' && templates.map(template => <button key={template.id} onClick={() => handleSelectTemplate(template.id, template.quotes)} className={cn("transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2", activeTemplateId === template.id ? "bg-monkey-accent/20 text-monkey-accent" : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300")}>
            {getIcon(template.id)}
            <span>{template.name}</span>
          </button>)}

        {menuView === 'saved' && savedScripts.length > 0 && savedScripts.map(script => <button key={script.id} onClick={() => handleSelectSavedScript(script)} className={cn("transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2", activeTemplateId === script.id ? "bg-monkey-accent/20 text-monkey-accent" : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300")}>
            <Heart className="h-4 w-4" />
            <span>{script.name}</span>
          </button>)}

        {menuView === 'saved' && savedScripts.length === 0 && <div className="text-center py-4 text-monkey-subtle">
            No saved scripts. Save a script or upload one to get started.
          </div>}
      </div>

      {user && <ScriptManager open={isScriptManagerOpen} onOpenChange={setIsScriptManagerOpen} scripts={savedScripts} userId={user.id} onScriptsChange={loadSavedScripts} onSelectTemplate={onSelectTemplate} />}
    </div>;
};
export default TemplateMenu;