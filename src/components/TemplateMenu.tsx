import React, { useState } from 'react';
import { BookOpen, History, Heart, Code, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
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
const TemplateItem: React.FC<TemplateItemProps> = ({
  id,
  name,
  icon,
  isActive,
  onClick
}) => {
  return <button onClick={onClick} className={cn("flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm", "focus:outline-none focus:ring-2 focus:ring-monkey-accent/50", isActive ? "bg-slate-800 text-monkey-accent" : "bg-slate-900/80 text-gray-400 hover:bg-slate-800/70 hover:text-gray-300")}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="whitespace-nowrap">{name}</span>
      </div>
    </button>;
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
        return <AtSign className="h-4 w-4" />;
      case 'Calm':
        return <History className="h-4 w-4" />;
      case 'Theory':
        return <Code className="h-4 w-4" />;
      case 'Legend':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };
  return <div className="w-full mb-6">
      <div className="relative w-full max-w-2xl mx-auto">
        <Carousel className="w-full">
          {/* Position the navigation arrows inside the Carousel context */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10">
            <CarouselPrevious className="h-8 w-8 bg-slate-900/80 border-slate-700 hover:bg-slate-800" />
          </div>
          
          {/* Content carousel */}
          <div className="w-full bg-slate-950 rounded-md py-2 px-1">
            <CarouselContent className="items-center bg-transparent">
              {templates.map(template => <CarouselItem key={template.id} className="flex-shrink-0 basis-auto px-1">
                  <TemplateItem id={template.id} name={template.name} icon={getIcon(template.id)} isActive={activeTemplateId === template.id} onClick={() => handleSelectTemplate(template.id, template.quotes)} />
                </CarouselItem>)}
            </CarouselContent>
          </div>
          
          {/* Right navigation arrow */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-10">
            <CarouselNext className="h-8 w-8 bg-slate-900/80 border-slate-700 hover:bg-slate-800" />
          </div>
        </Carousel>
      </div>
    </div>;
};
export default TemplateMenu;