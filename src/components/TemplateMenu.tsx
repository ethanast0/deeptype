
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { BookOpen, History, Code, Book } from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "../data/templates";

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[]) => void;
}

const TemplateMenu: React.FC<TemplateMenuProps> = ({ onSelectTemplate }) => {
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

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <Carousel className="w-full">
        <CarouselContent>
          {templates.map((template) => (
            <CarouselItem key={template.id} className="basis-1/4">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full h-10 flex flex-col gap-1 text-monkey-subtle hover:text-monkey-text hover:bg-slate-800 rounded-md",
                )}
                onClick={() => onSelectTemplate(template.quotes)}
              >
                {getIcon(template.icon)}
                <span className="text-xs">{template.name}</span>
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TemplateMenu;
