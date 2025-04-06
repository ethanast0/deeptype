
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { panelTemplates } from '../services/panelService';
import { BarChart, LineChart, Trophy, Activity, Percent } from 'lucide-react';

interface AddPanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPanel: (panelType: string, title: string, config: any) => void;
}

const AddPanelDialog: React.FC<AddPanelDialogProps> = ({ 
  open, 
  onOpenChange,
  onAddPanel 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'line-chart':
        return <LineChart className="h-6 w-6" />;
      case 'trophy':
        return <Trophy className="h-6 w-6" />;
      case 'activity':
        return <Activity className="h-6 w-6" />;
      case 'percent':
        return <Percent className="h-6 w-6" />;
      default:
        return <BarChart className="h-6 w-6" />;
    }
  };
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = panelTemplates.find(t => t.id === templateId);
    if (template) {
      onAddPanel(template.type, template.title, template.defaultConfig || {});
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl mb-4">Add Statistics Panel</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
          {panelTemplates.map(template => (
            <div 
              key={template.id}
              className={`
                p-4 border rounded-lg cursor-pointer transition-all
                ${selectedTemplate === template.id 
                  ? 'border-monkey-accent bg-zinc-800' 
                  : 'border-zinc-800 hover:border-gray-700 hover:bg-zinc-900'}
              `}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-zinc-800 rounded-md text-monkey-accent">
                  {getTemplateIcon(template.icon)}
                </div>
                <h3 className="font-medium">{template.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{template.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPanelDialog;
