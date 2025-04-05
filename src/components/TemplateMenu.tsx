
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { templates } from '../data/templates';
import { Categories, TemplateItem } from '../utils/typingUtils';
import { cn } from '../lib/utils';
import { scriptService } from '../services/scriptService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface TemplateMenuProps {
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
  isTyping?: boolean;
}

const TemplateMenu: React.FC<TemplateMenuProps> = ({ onSelectTemplate, isTyping = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Categories>('featured');
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleMenu = () => {
    if (isTyping) {
      toast({
        title: "Test in progress",
        description: "Please finish or reset your current test before changing templates.",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleCategoryClick = (category: Categories) => {
    setActiveCategory(category);
  };

  const handleTemplateClick = async (template: TemplateItem) => {
    setIsOpen(false);

    if (template.type === 'local') {
      onSelectTemplate(template.quotes);
    } else if (template.type === 'script' && template.scriptId) {
      try {
        const scriptQuotes = await scriptService.getScriptQuotes(template.scriptId);
        if (scriptQuotes.length > 0) {
          onSelectTemplate(scriptQuotes, template.scriptId);
        } else {
          toast({
            title: "Empty script",
            description: "This script doesn't contain any quotes.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading script:", error);
        toast({
          title: "Error loading script",
          description: "Failed to load the selected script.",
          variant: "destructive",
        });
      }
    }
  };

  const renderTemplates = () => {
    const filteredTemplates = templates[activeCategory] || [];
    
    if (filteredTemplates.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          {!user && activeCategory === 'saved' 
            ? 'Please log in to see your saved scripts' 
            : 'No templates available in this category'}
        </div>
      );
    }

    return filteredTemplates.map((template, index) => (
      <div
        key={index}
        className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-between"
        onClick={() => handleTemplateClick(template)}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-200">{template.name}</div>
          <div className="text-xs text-gray-400">
            {template.description || `${template.quotes.length} quotes`}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="template-menu w-full mb-6">
      <div
        className="flex items-center justify-between cursor-pointer bg-slate-800 p-3 rounded-md"
        onClick={toggleMenu}
      >
        <span className="text-gray-300 text-sm font-medium">Templates</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {isOpen && (
        <div className="bg-slate-800 mt-1 rounded-md overflow-hidden">
          <div className="flex border-b border-slate-700">
            {Object.keys(templates).map((category) => (
              <div
                key={category}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer",
                  activeCategory === category
                    ? "text-monkey-accent border-b-2 border-monkey-accent"
                    : "text-gray-400 hover:text-gray-300"
                )}
                onClick={() => handleCategoryClick(category as Categories)}
              >
                {category}
              </div>
            ))}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {renderTemplates()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateMenu;
