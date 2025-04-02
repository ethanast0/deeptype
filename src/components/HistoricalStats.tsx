
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingHistoryService } from '../services/typingHistoryService';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Fetching historical stats for user:', user.id);
        setIsLoading(true);
        const userStats = await typingHistoryService.getUserStats(user.id);
        console.log('Received historical stats:', userStats);
        setStats(userStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Don't render anything if user is not authenticated
  if (!user) return null;

  if (error) {
    return (
      <div className={cn("text-xs text-monkey-error p-2", className)}>
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-2 py-2 px-3", className)}>
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[70px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded border border-slate-700 bg-slate-800/50", 
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
