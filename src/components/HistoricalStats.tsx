import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingHistoryService } from '../services/typingHistoryService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';

interface HistoricalStatsProps {
  className?: string;
  displayAccuracy: boolean;  // Remove optional '?' to force explicit choice
}

interface UserStats {
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  totalScripts: number;
}

const HistoricalStats: React.FC<HistoricalStatsProps> = ({
  className,
  displayAccuracy,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    averageWpm: 0,
    averageAccuracy: 0,
    totalSessions: 0,
    totalScripts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.debug('Fetching historical stats for user:', user.id);
      setIsLoading(true);
      const userStats = await typingHistoryService.getUserStats(user.id);
      console.debug('Received historical stats:', userStats);
      setStats(userStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    console.debug('Setting up realtime subscription for user:', user.id);
    
    const channel = supabase
      .channel('realtime:typing_history')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'typing_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.debug('📡 Realtime change detected:', payload);
          fetchStats(); // Recompute stats on any change
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.debug('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Don't render anything if user is not authenticated.
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
    <div className={cn("flex items-center space-x-2 text-xs text-monkey-subtle py-2 px-3 rounded-md", className)}>
      <span>
        <span className="font-medium text-monkey-text">{stats.averageWpm}</span>{" avg wpm"}
      </span>

      {displayAccuracy && (
        <>
          <span className="text-zinc-600">•</span>
          <span>
            <span className="font-medium text-monkey-text">{stats.averageAccuracy}%</span>{" avg acc"}
          </span>
        </>
      )}

      <span className="text-zinc-600">•</span>
      
      <span>
        <span className="font-medium text-monkey-text">{stats.totalSessions}</span>{" total"}
      </span>

      <span className="text-zinc-600">•</span>

      <span>
        <span className="font-medium text-monkey-text">{stats.totalScripts}</span>{" scripts"}
      </span>
    </div>
  );
};

// Add prop documentation
HistoricalStats.defaultProps = {
  displayAccuracy: false,  // Default to hiding accuracy
};

export default HistoricalStats;
