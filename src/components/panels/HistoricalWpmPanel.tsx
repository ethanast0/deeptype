
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { typingHistoryService } from '../../services/typingHistoryService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { WpmHistoryConfig, getPanelConfig } from '../../config/panelConfig';

interface HistoricalWpmPanelProps {
  config?: Partial<WpmHistoryConfig>;
}

interface WpmDataPoint {
  date: string;
  wpm: number;
  movingAverage?: number | null;
}

const HistoricalWpmPanel: React.FC<HistoricalWpmPanelProps> = ({ config: userConfig }) => {
  const { user } = useAuth();
  const [wpmData, setWpmData] = useState<WpmDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get merged configuration
  const config = getPanelConfig<WpmHistoryConfig>('wpm-history', userConfig);
  const { windowSize, timeRange, showRawData } = config;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const history = await typingHistoryService.getUserHistoryWithMovingAverageWpm(user.id, windowSize);
        
        // Process data based on timeRange
        let filteredHistory = history;
        const now = new Date();
        
        if (timeRange === 'day') {
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneDayAgo
          );
        } else if (timeRange === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneWeekAgo
          );
        } else if (timeRange === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneMonthAgo
          );
        }
        
        // Format data for chart
        const formattedData = filteredHistory.map(entry => ({
          date: new Date(entry.created_at).toLocaleDateString(),
          wpm: entry.wpm,
          movingAverage: entry.moving_average_wpm
        }));
        
        setWpmData(formattedData);
      } catch (err) {
        console.error('Error fetching WPM history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, timeRange, windowSize]);

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center">Loading data...</div>;
  }

  if (wpmData.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={wpmData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#323437" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#646669', fontSize: 10 }}
            tickLine={{ stroke: '#646669' }}
            axisLine={{ stroke: '#646669' }}
          />
          <YAxis 
            tick={{ fill: '#646669', fontSize: 10 }}
            tickLine={{ stroke: '#646669' }}
            axisLine={{ stroke: '#646669' }}
            domain={[80, 'dataMax']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#323437', border: 'none', borderRadius: '4px' }}
            itemStyle={{ color: '#d1d0c5' }}
            labelStyle={{ color: '#d1d0c5' }}
          />
          {showRawData && (
            <Line 
              type="basis"
              dataKey="wpm" 
              stroke="#27272a" 
              strokeWidth={1}
              dot={{ r: 3, fill: '#27272a' }}
              activeDot={{ r: 2 }}
              name="WPM"
            />
          )}
          <Line 
            type="basis"
            dataKey="movingAverage" 
            stroke="#9AE19F"
            strokeWidth={3}
            dot={false}
            activeDot={false}
            name="Trend"
            connectNulls={true}
          />
          <Legend 
            iconType="circle" 
            iconSize={8} 
            wrapperStyle={{ fontSize: 10 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalWpmPanel;
