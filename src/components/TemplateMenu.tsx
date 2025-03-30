import React, { useState, useEffect } from 'react';
import { BookOpen, History, Heart, Code, Book, Save, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript, scriptService } from '../services/scriptService';
import ScriptManager from './ScriptManager';
import { useToast } from '@/hooks/use-toast';

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
}

const TemplateMenu: React.FC<TemplateMenuProps> = ({
  onSelectTemplate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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

  return (
    <div className="w-full mb-8 flex justify-center">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => handleSelectTemplate(template.id, template.quotes)}
            className={cn(
              "transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2",
              activeTemplateId === template.id
                ? "bg-monkey-accent/20 text-monkey-accent" 
                : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300"
            )}
          >
            {getIcon(template.id)}
            <span>{template.name}</span>
          </button>
        ))}

        {user && (
          <>
            <button
              onClick={toggleExpand}
              className={cn(
                "transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2",
                isExpanded 
                  ? "bg-monkey-accent/20 text-monkey-accent"
                  : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300",
                savedScripts.some(s => activeTemplateId === s.id) && "bg-monkey-accent/20 text-monkey-accent"
              )}
            >
              <Heart className="h-4 w-4" />
              <span>Saved</span>
            </button>

            <button
              onClick={handleOpenScriptManager}
              className={cn(
                "transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2",
                isScriptManagerOpen
                  ? "bg-monkey-accent/20 text-monkey-accent"
                  : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Manage</span>
            </button>
          </>
        )}
      </div>

      {isExpanded && savedScripts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center animate-fade-in">
          {savedScripts.map(script => (
            <button
              key={script.id}
              onClick={() => handleSelectSavedScript(script)}
              className={cn(
                "transition-all duration-300 px-6 py-2.5 rounded-full flex items-center justify-center gap-2",
                activeTemplateId === script.id
                  ? "bg-monkey-accent/20 text-monkey-accent" 
                  : "bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-300"
              )}
            >
              <Heart className="h-4 w-4" />
              <span>{script.name}</span>
            </button>
          ))}
        </div>
      )}

      {user && <ScriptManager 
        open={isScriptManagerOpen} 
        onOpenChange={setIsScriptManagerOpen} 
        scripts={savedScripts} 
        userId={user.id} 
        onScriptsChange={loadSavedScripts} 
        onSelectTemplate={onSelectTemplate}
      />}
    </div>
  );
};

export default TemplateMenu;
