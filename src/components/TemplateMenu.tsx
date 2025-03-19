
import React, { useState, useEffect } from 'react';
import { AtSign, Hash, Clock, Type, Quote, Triangle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript, scriptService } from '../services/scriptService';
import ScriptManager from './ScriptManager';
import { useToast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[]) => void;
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

  const loadSavedScripts = () => {
    if (!user) return;
    const scripts = scriptService.getScripts(user.id);
    setSavedScripts(scripts);
  };

  const getIcon = (templateId: string) => {
    switch (templateId) {
      case 'physics':
        return <AtSign className="h-5 w-5" />;
      case 'history':
        return <Hash className="h-5 w-5" />;
      case 'coding':
        return <Clock className="h-5 w-5" />;
      case 'legends':
        return <Type className="h-5 w-5" />;
      default:
        return <Triangle className="h-5 w-5" />;
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
      <div className="flex items-center justify-center text-gray-400 py-4 px-2 rounded-lg w-full overflow-hidden bg-transparent">
        <div className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isExpanded ? "w-full" : "w-fit mx-auto"}`}>
          {/* Main template buttons */}
          {templates.map(template => (
            <button
              key={template.id}
              className={cn(
                "flex items-center gap-2 transition-colors px-3",
                activeTemplateId === template.id 
                  ? "text-monkey-accent" 
                  : "hover:text-monkey-text text-monkey-subtle"
              )}
              onClick={() => handleSelectTemplate(template.id, template.quotes)}
            >
              {getIcon(template.id)}
              <span>{template.name}</span>
            </button>
          ))}

          {/* Saved button with toggle functionality */}
          {user && (
            <button
              className={cn(
                "flex items-center gap-2 transition-colors px-3",
                isExpanded 
                  ? "text-monkey-text" 
                  : "hover:text-monkey-text text-monkey-subtle",
                savedScripts.some(s => activeTemplateId === s.id) && "text-monkey-accent"
              )}
              onClick={toggleExpand}
            >
              <Quote className="h-5 w-5" />
              <span>saved</span>
            </button>
          )}

          {/* Expanded section with separator */}
          {user && (
            <div
              className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
                isExpanded ? "opacity-100 max-w-[500px]" : "opacity-0 max-w-0"
              }`}
            >
              {/* Separator after Saved */}
              <div className="h-5 w-px bg-slate-700 mx-2 flex-shrink-0"></div>

              {/* Script buttons */}
              {savedScripts.length > 0 ? (
                savedScripts.map((script) => (
                  <button
                    key={script.id}
                    className={cn(
                      "flex items-center gap-2 transition-colors px-3 whitespace-nowrap flex-shrink-0",
                      activeTemplateId === script.id 
                        ? "text-monkey-accent" 
                        : "hover:text-monkey-text text-monkey-subtle"
                    )}
                    onClick={() => handleSelectSavedScript(script)}
                  >
                    <Triangle className="h-5 w-5" />
                    <span>{script.name}</span>
                  </button>
                ))
              ) : (
                <span className="text-monkey-subtle opacity-50 px-3 whitespace-nowrap flex-shrink-0">No saved scripts</span>
              )}

              {/* Separator before Change */}
              <div className="h-5 w-px bg-slate-700 mx-2 flex-shrink-0"></div>

              {/* Settings button only in expanded state */}
              <button
                className="hover:text-monkey-text text-monkey-subtle transition-colors px-3 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                onClick={handleOpenScriptManager}
              >
                <Settings className="h-5 w-5" />
                <span>change</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {user && <ScriptManager 
        open={isScriptManagerOpen} 
        onOpenChange={setIsScriptManagerOpen} 
        scripts={savedScripts} 
        userId={user.id} 
        onScriptsChange={loadSavedScripts} 
      />}
    </div>
  );
};

export default TemplateMenu;
