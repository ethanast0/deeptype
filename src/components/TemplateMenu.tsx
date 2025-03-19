
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { 
  BookOpen, 
  History, 
  Code, 
  Book, 
  Save, 
  ChevronDown, 
  ChevronUp,
  Settings
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript, scriptService } from '../services/scriptService';
import ScriptManager from './ScriptManager';
import { useToast } from '@/hooks/use-toast';

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[]) => void;
}

const TemplateMenu: React.FC<TemplateMenuProps> = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSavedScripts();
    } else {
      setSavedScripts([]);
    }
  }, [user]);

  const loadSavedScripts = () => {
    if (!user) return;
    const scripts = scriptService.getScripts(user.id);
    setSavedScripts(scripts);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'book-open':
        return <BookOpen className="h-4 w-4" />;
      case 'history':
        return <History className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'book':
        return <Book className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSelectTemplate = (templateId: string, quotes: string[]) => {
    setActiveTemplateId(templateId);
    onSelectTemplate(quotes);
  };

  const handleSelectSavedScript = (script: SavedScript) => {
    setActiveTemplateId(script.id);
    onSelectTemplate(script.quotes);
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

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 flex flex-col gap-1 text-monkey-subtle hover:text-monkey-text hover:bg-slate-800 rounded-md",
              activeTemplateId === template.id && "text-monkey-accent"
            )}
            onClick={() => handleSelectTemplate(template.id, template.quotes)}
          >
            {getIcon(template.icon)}
            <span className="text-xs">{template.name}</span>
          </Button>
        ))}
        
        {user && (
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
          >
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 flex flex-col gap-1 text-monkey-subtle hover:text-monkey-text hover:bg-slate-800 rounded-md"
                >
                  <Save className="h-4 w-4" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">Saved</span>
                    {isOpen ? 
                      <ChevronUp className="h-3 w-3" /> : 
                      <ChevronDown className="h-3 w-3" />
                    }
                  </div>
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="mt-2 space-y-2">
              {savedScripts.length > 0 ? (
                savedScripts.map((script) => (
                  <Button
                    key={script.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-8 text-monkey-subtle hover:text-monkey-text hover:bg-slate-800 rounded-md text-xs px-2",
                      activeTemplateId === script.id && "text-monkey-accent"
                    )}
                    onClick={() => handleSelectSavedScript(script)}
                  >
                    {script.name}
                  </Button>
                ))
              ) : (
                <div className="text-xs text-monkey-subtle py-1 px-2">
                  No saved scripts
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 h-8 text-xs bg-slate-800 hover:bg-slate-700 border-slate-700 text-monkey-subtle hover:text-monkey-text"
                onClick={handleOpenScriptManager}
              >
                <Settings className="h-3 w-3 mr-1" />
                Change
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {user && (
        <ScriptManager 
          open={isScriptManagerOpen}
          onOpenChange={setIsScriptManagerOpen}
          scripts={savedScripts}
          userId={user.id}
          onScriptsChange={loadSavedScripts}
        />
      )}
    </div>
  );
};

export default TemplateMenu;
