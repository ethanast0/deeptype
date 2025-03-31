import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SavedScript, scriptService } from '../services/scriptService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

interface ScriptManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onScriptsChange: () => void;
  onSelectTemplate: (quotes: string[], scriptId?: string) => void;
  onScriptUploaded?: (quotes: string[]) => void;
}

const ScriptManager: React.FC<ScriptManagerProps> = ({
  open,
  onOpenChange,
  userId,
  onScriptsChange,
  onSelectTemplate,
  onScriptUploaded = () => {}
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Custom');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !content) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields.",
      } as const);
      return;
    }

    try {
      const script = await scriptService.uploadScript({
        title: name,
        content,
        category,
        user_id: userId || '',
        is_featured: false,
        saves_count: 0,
        typed_count: 0,
        unique_typers_count: 0
      });

      if (script) {
        toast({
          title: "Success",
          description: "Script saved successfully.",
        } as const);
        onScriptsChange();
        onOpenChange(false);
        setName('');
        setContent('');
        setCategory('Custom');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save script. Please try again.",
      } as const);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to upload scripts"
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const content = await file.text();
      const quotes = content.split('\n').filter(Boolean);
      
      if (quotes.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: "No valid quotes found in file"
        });
        return;
      }

      const script = await scriptService.uploadScript({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        content: quotes.join('\n'),
        category: 'Custom',
        user_id: user.id,
        is_featured: false,
        saves_count: 0,
        typed_count: 0,
        unique_typers_count: 0
      });

      if (script) {
        toast({
          title: "Success",
          description: "Script uploaded successfully.",
        } as const);
        onScriptUploaded(quotes);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload script. Please try again.",
      } as const);
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  }, [user, onScriptUploaded, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Script</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter script name"
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter script content"
              className="w-full h-32 p-2 border rounded"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom">Custom</SelectItem>
                <SelectItem value="Code">Code</SelectItem>
                <SelectItem value="Quote">Quote</SelectItem>
                <SelectItem value="Article">Article</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>

          <div>
            <input
              type="file"
              accept=".txt,.json"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="script-upload"
            />
            <label
              htmlFor="script-upload"
              className={`button button-accent bg-slate-800 hover:bg-slate-700 text-gray-400 font-normal text-base cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'uploading...' : 'upload'}
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptManager;
