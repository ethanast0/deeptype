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
        description: "Please fill in all required fields."
      });
      return;
    }

    try {
      const success = await scriptService.uploadScript(name, content, category);

      if (success) {
        toast({
          title: "Success",
          description: "Script saved successfully."
        });
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
        description: "Failed to save script. Please try again."
      });
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

      const success = await scriptService.uploadScript(
        file.name.replace(/\.[^/.]+$/, ''),
        content,
        'Custom'
      );

      if (success) {
        toast({
          title: "Success",
          description: "Script uploaded successfully."
        });
        onScriptUploaded(quotes);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload script. Please try again."
      });
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter script name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter script content"
              className="h-32"
              type="textarea"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom">Custom</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
                <SelectItem value="Literature">Literature</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isUploading}>
              Save
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button variant="outline" disabled={isUploading}>
                Upload File
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptManager;
