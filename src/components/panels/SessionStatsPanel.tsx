
import React from 'react';
import SessionWpmChart from '../SessionWpmChart';
import { SessionStatsConfig, getPanelConfig } from '../../config/panelConfig';

interface SessionStatsPanelProps {
  config?: Partial<SessionStatsConfig>;
}

const SessionStatsPanel: React.FC<SessionStatsPanelProps> = ({ config: userConfig }) => {
  // Get merged configuration
  const config = getPanelConfig<SessionStatsConfig>('session-stats', userConfig);
  
  // This component can reuse the existing SessionWpmChart component
  // We just need to ensure we get the wpmData from somewhere
  
  // For demonstration, we'll use some dummy data
  const dummyWpmData = [65, 72, 68, 75, 80, 78, 82];
  
  return (
    <SessionWpmChart wpmData={dummyWpmData} className="border-none p-0" />
  );
};

export default SessionStatsPanel;
