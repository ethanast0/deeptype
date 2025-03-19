
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, Edit, Trash, Plus, Save } from 'lucide-react';
import { SavedScript, scriptService } from '@/services/scriptService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScriptManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: SavedScript[];
  userId: string;
  onScriptsChange: () => void;
}

const ScriptManager: React.FC<ScriptManagerProps> = ({
  open,
  onOpenChange,
  scripts,
  userId,
  onScriptsChange
}) => {
  const [editingScript, setEditingScript] = useState<SavedScript | null>(null);
  const [scriptName, setScriptName] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const { toast } = useToast();

  const handleEdit = (script: SavedScript) => {
    setEditingScript(script);
    setScriptName(script.name);
    setScriptContent(script.quotes.join('\n'));
  };

  const handleCreate = () => {
    if (scripts.length >= 5) {
      toast({
        title: "Maximum scripts reached",
        description: "You can only save up to 5 scripts. Please delete some to create new ones.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingScript(null);
    setScriptName('New Script');
    setScriptContent('');
  };

  const handleSave = () => {
    if (!scriptName.trim()) {
      toast({
        title: "Script name required",
        description: "Please provide a name for your script.",
        variant: "destructive"
      });
      return;
    }

    const quotes = scriptContent.split('\n').filter(line => line.trim());
    
    if (quotes.length === 0) {
      toast({
        title: "Script content required",
        description: "Please provide content for your script.",
        variant: "destructive"
      });
      return;
    }

    if (editingScript) {
      // Update existing script
      const updated = scriptService.updateScript({
        ...editingScript,
        name: scriptName,
        quotes
      });
      
      if (updated) {
        toast({
          title: "Script updated",
          description: "Your script has been updated."
        });
        onScriptsChange();
        setEditingScript(null);
      }
    } else {
      // Create new script
      const newScript = scriptService.saveScript(userId, scriptName, quotes);
      
      if (newScript) {
        toast({
          title: "Script created",
          description: "Your new script has been saved."
        });
        onScriptsChange();
      } else {
        toast({
          title: "Failed to create script",
          description: "You can have a maximum of 5 saved scripts.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDelete = (scriptId: string) => {
    const deleted = scriptService.deleteScript(scriptId);
    
    if (deleted) {
      toast({
        title: "Script deleted",
        description: "Your script has been deleted."
      });
      onScriptsChange();
      
      if (editingScript?.id === scriptId) {
        setEditingScript(null);
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    
    const scriptIds = scripts.map(s => s.id);
    const temp = scriptIds[index];
    scriptIds[index] = scriptIds[index - 1];
    scriptIds[index - 1] = temp;
    
    const reordered = scriptService.reorderScripts(userId, scriptIds);
    if (reordered) {
      onScriptsChange();
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= scripts.length - 1) return;
    
    const scriptIds = scripts.map(s => s.id);
    const temp = scriptIds[index];
    scriptIds[index] = scriptIds[index + 1];
    scriptIds[index + 1] = temp;
    
    const reordered = scriptService.reorderScripts(userId, scriptIds);
    if (reordered) {
      onScriptsChange();
    }
  };

  const cancelEditing = () => {
    setEditingScript(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-monkey-text">
        <DialogHeader>
          <DialogTitle>Manage Your Scripts</DialogTitle>
        </DialogHeader>
        
        {!editingScript ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-monkey-subtle">Your saved scripts ({scripts.length}/5)</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreate} 
                disabled={scripts.length >= 5}
                className="bg-slate-800 hover:bg-slate-700 border-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Script
              </Button>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {scripts.map((script, index) => (
                <div key={script.id} className="flex items-center justify-between p-2 rounded-md bg-slate-800 border border-slate-700">
                  <span className="text-sm truncate flex-1">{script.name}</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                      <ArrowUp className="w-4 h-4 text-monkey-subtle hover:text-monkey-text" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleMoveDown(index)} disabled={index === scripts.length - 1}>
                      <ArrowDown className="w-4 h-4 text-monkey-subtle hover:text-monkey-text" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(script)}>
                      <Edit className="w-4 h-4 text-monkey-subtle hover:text-monkey-text" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(script.id)}>
                      <Trash className="w-4 h-4 text-monkey-subtle hover:text-monkey-text" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {scripts.length === 0 && (
                <div className="text-center py-4 text-monkey-subtle">
                  No scripts saved. Create one to get started.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="scriptName" className="block text-sm text-monkey-subtle mb-1">
                Script Name
              </label>
              <Input
                id="scriptName"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-monkey-text"
              />
            </div>
            
            <div>
              <label htmlFor="scriptContent" className="block text-sm text-monkey-subtle mb-1">
                Script Content (one quote per line)
              </label>
              <textarea
                id="scriptContent"
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={10}
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-monkey-text resize-y"
              />
            </div>
            
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={cancelEditing} className="bg-slate-800 hover:bg-slate-700 border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-monkey-accent text-black hover:bg-monkey-accent/80">
                <Save className="w-4 h-4 mr-2" />
                Save Script
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScriptManager;
