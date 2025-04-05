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
  return;
};
export default TemplateMenu;