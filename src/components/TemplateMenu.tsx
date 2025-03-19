
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  History, 
  Code, 
  Book, 
  Save, 
  Wrench,
  Settings
} from "lucide-react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar";
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
    <div className="w-full mb-6">
      <Menubar className="flex bg-slate-800 border-slate-700 rounded-lg w-full overflow-x-auto">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 flex gap-2 text-monkey-subtle hover:text-monkey-text hover:bg-slate-800 rounded-md",
              activeTemplateId === template.id && "text-monkey-accent"
            )}
            onClick={() => handleSelectTemplate(template.id, template.quotes)}
          >
            {getIcon(template.icon)}
            <span>{template.name}</span>
          </Button>
        ))}

        {user && (
          <>
            <MenubarMenu>
              <MenubarTrigger className={cn(
                "h-10 flex gap-2 text-monkey-subtle hover:text-monkey-text data-[state=open]:text-monkey-accent",
                savedScripts.some(s => activeTemplateId === s.id) && "text-monkey-accent"
              )}>
                <Save className="h-4 w-4" />
                <span>saved</span>
              </MenubarTrigger>
              <MenubarContent className="bg-slate-800 border-slate-700 min-w-[150px]">
                {savedScripts.length > 0 ? (
                  savedScripts.map((script) => (
                    <MenubarItem 
                      key={script.id}
                      className={cn(
                        "text-monkey-subtle hover:text-monkey-text hover:bg-slate-700 focus:bg-slate-700 cursor-pointer",
                        activeTemplateId === script.id && "text-monkey-accent"
                      )}
                      onClick={() => handleSelectSavedScript(script)}
                    >
                      {script.name}
                    </MenubarItem>
                  ))
                ) : (
                  <MenubarItem disabled className="text-monkey-subtle opacity-50">
                    No saved scripts
                  </MenubarItem>
                )}
                <MenubarItem 
                  className="mt-2 text-monkey-subtle hover:text-monkey-text hover:bg-slate-700 focus:bg-slate-700 cursor-pointer border-t border-slate-700"
                  onClick={handleOpenScriptManager}
                >
                  <Settings className="h-3 w-3 mr-2" />
                  change
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </>
        )}
      </Menubar>

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
