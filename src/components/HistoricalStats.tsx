import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingHistoryService } from '../services/typingHistoryService';
import { cn } from '../lib/utils';

interface HistoricalStatsProps {
  className?: string;
}

interface UserStats {
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalScripts: number;
}

const HistoricalStats: React.FC<HistoricalStatsProps> = ({ className }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    averageWpm: 0,
    averageAccuracy: 0,
    totalSessions: 0,
    totalScripts: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const userStats = await typingHistoryService.getUserStats(user.id);
        setStats(userStats);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className={cn("flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded", 
      className
    )}>
      <span>
        <span className="font-medium text-monkey-text">{stats.averageWpm}</span>{" avg wpm"}
      </span>

      <span className="text-zinc-600">•</span>
      
      <span>
        <span className="font-medium text-monkey-text">{stats.averageAccuracy}%</span>{" avg acc"}
      </span>

      <span className="text-zinc-600">•</span>

      <span>
        <span className="font-medium text-monkey-text">{stats.totalSessions}</span>{" tests"}
      </span>

      <span className="text-zinc-600">•</span>

      <span>
        <span className="font-medium text-monkey-text">{stats.totalScripts}</span>{" scripts"}
      </span>
    </div>
  );
};

export default HistoricalStats; 