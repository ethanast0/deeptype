
import React from 'react';
import { CustomPanel } from '../../services/panelService';
import HistoricalWpmPanel from './HistoricalWpmPanel';
import AccuracyChartPanel from './AccuracyChartPanel';
import LeaderboardPanel from './LeaderboardPanel';
import SessionStatsPanel from './SessionStatsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface PanelRendererProps {
  panel: CustomPanel;
  onDelete?: (id: string) => void;
  className?: string;
}

const PanelRenderer: React.FC<PanelRendererProps> = ({ 
  panel, 
  onDelete,
  className
}) => {
  const renderPanelContent = () => {
    switch (panel.panel_type) {
      case 'wpm-history':
        return <HistoricalWpmPanel config={panel.config} />;
      case 'accuracy-chart':
        return <AccuracyChartPanel config={panel.config} />;
      case 'leaderboard':
        return <LeaderboardPanel config={panel.config} />;
      case 'session-stats':
        return <SessionStatsPanel config={panel.config} />;
      default:
        return <div>Unknown panel type: {panel.panel_type}</div>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base text-gray-400">{panel.title || 'Untitled Panel'}</CardTitle>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={() => onDelete(panel.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {renderPanelContent()}
      </CardContent>
    </Card>
  );
};

export default PanelRenderer;
