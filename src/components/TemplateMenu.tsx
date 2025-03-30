
import React, { useState } from 'react';
import { 
  BookOpen, History, Heart, Code, Book, AtSign 
} from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { useAuth } from '../contexts/AuthContext';
import { SavedScript } from '../services/scriptService';
import { useToast } from '@/hooks/use-toast';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
}

interface TemplateItemProps {
  id: string;
  name: string;
  isActive: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

// Individual template item component
const TemplateItem: React.FC<TemplateItemProps> = ({ id, name, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center px-5 py-3 rounded-full transition-all",
        "focus:outline-none focus:ring-2 focus:ring-monkey-accent/50",
        isActive 
          ? "bg-slate-800 text-monkey-accent" 
          : "bg-slate-900/80 text-gray-400 hover:bg-slate-800/70 hover:text-gray-300"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="whitespace-nowrap">{name}</span>
      </div>
    </button>
  );
};

const TemplateMenu: React.FC<TemplateMenuProps> = ({
  onSelectTemplate
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string, quotes: string[]) => {
    setActiveTemplateId(templateId);
    onSelectTemplate(quotes);
  };

  const getIcon = (templateId: string) => {
    switch (templateId) {
      case 'Comedy':
        return <AtSign className="h-5 w-5" />;
      case 'Calm':
        return <History className="h-5 w-5" />;
      case 'Theory':
        return <Code className="h-5 w-5" />;
      case 'Legend':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Make the template menu take full width to match typing area */}
      <div className="flex items-center justify-center text-gray-400 py-4 px-2 rounded-lg w-full overflow-hidden bg-transparent">
        {/* Instagram-style horizontally scrollable stories with positioning fixes */}
        <Carousel className="w-full">
          <div className="relative w-full">
            <CarouselContent className="items-center">
              {templates.map(template => (
                <CarouselItem key={template.id} className="flex-shrink-0 basis-auto pl-2 pr-2">
                  <TemplateItem
                    id={template.id}
                    name={template.name}
                    icon={getIcon(template.id)}
                    isActive={activeTemplateId === template.id}
                    onClick={() => handleSelectTemplate(template.id, template.quotes)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Position the navigation arrows to avoid overlapping with buttons */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <CarouselPrevious className="relative left-0 bg-slate-900/80 border-slate-700 hover:bg-slate-800" />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <CarouselNext className="relative right-0 bg-slate-900/80 border-slate-700 hover:bg-slate-800" />
            </div>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default TemplateMenu;
