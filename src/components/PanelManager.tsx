import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CustomPanel, panelService } from '../services/panelService';
import PanelRenderer from './panels/PanelRenderer';
import AddPanelDialog from './AddPanelDialog';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from './ui/use-toast';
interface PanelManagerProps {
  className?: string;
}
const PanelManager: React.FC<PanelManagerProps> = ({
  className
}) => {
  const {
    user
  } = useAuth();
  const [panels, setPanels] = useState<CustomPanel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const fetchUserPanels = async () => {
      if (!user) {
        setPanels([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const userPanels = await panelService.getUserPanels(user.id);
        setPanels(userPanels);
      } catch (err) {
        console.error('Error fetching user panels:', err);
        toast({
          title: 'Error',
          description: 'Failed to load your custom panels',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserPanels();
  }, [user, toast]);
  const handleAddPanel = async (panelType: string, title: string, config: any) => {
    if (!user) return;
    try {
      const nextPosition = await panelService.getNextPosition(user.id);
      const newPanel = await panelService.createPanel(user.id, {
        panel_type: panelType,
        title,
        config,
        position: nextPosition
      });
      setPanels(prev => [...prev, newPanel]);
      toast({
        title: 'Panel added',
        description: `${title} panel has been added to your dashboard`
      });
    } catch (err) {
      console.error('Error adding panel:', err);
      toast({
        title: 'Error',
        description: 'Failed to add the panel',
        variant: 'destructive'
      });
    }
  };
  const handleDeletePanel = async (panelId: string) => {
    try {
      await panelService.deletePanel(panelId);
      setPanels(prev => prev.filter(panel => panel.id !== panelId));
      toast({
        title: 'Panel removed',
        description: 'The panel has been removed from your dashboard'
      });
    } catch (err) {
      console.error('Error deleting panel:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove the panel',
        variant: 'destructive'
      });
    }
  };

  // If the user isn't logged in, don't show the panel manager
  if (!user) {
    return null;
  }
  return <div className={`panel-manager space-y-4 ${className}`}>
      <div className="flex justify-between items-center -mt-12">
        
        <Button onClick={() => setIsAddPanelOpen(true)} variant="ghost" className="w-full flex items-center gap-2 font-normal text-zinc-400">
          <PlusCircle className="h-4 w-4" />
          Add Panel
        </Button>
      </div>

      {isLoading ? <div className="text-center py-8 text-gray-400">Loading your panels...</div> : panels.length === 0 ? <div className="text-center py-8 text-gray-400">
          <p>You don't have any custom panels yet.</p>
          <Button onClick={() => setIsAddPanelOpen(true)} variant="outline" className="mt-4">
            Add your first panel
          </Button>
        </div> : <div className="grid grid-cols-1 gap-4">
          {panels.map(panel => <PanelRenderer key={panel.id} panel={panel} onDelete={handleDeletePanel} className="w-full" />)}
        </div>}

      <AddPanelDialog open={isAddPanelOpen} onOpenChange={setIsAddPanelOpen} onAddPanel={handleAddPanel} />
    </div>;
};
export default PanelManager;