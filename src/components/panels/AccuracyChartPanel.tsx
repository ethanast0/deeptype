
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

interface AccuracyChartPanelProps {
  config?: {
    timeRange?: 'day' | 'week' | 'month' | 'all';
    windowSize?: number;
  };
}

interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  movingAverage?: number | null;
}

const AccuracyChartPanel: React.FC<AccuracyChartPanelProps> = ({ 
  config = { timeRange: 'week', windowSize: 5 } 
}) => {
  const { user } = useAuth();
  const [accuracyData, setAccuracyData] = useState<AccuracyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const windowSize = config.windowSize || 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const history = await typingHistoryService.getUserHistoryWithMovingAverageAccuracy(user.id, windowSize);
        
        // Process data based on timeRange
        let filteredHistory = history;
        const now = new Date();
        
        if (config.timeRange === 'day') {
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneDayAgo
          );
        } else if (config.timeRange === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneWeekAgo
          );
        } else if (config.timeRange === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredHistory = history.filter(entry => 
            new Date(entry.created_at) >= oneMonthAgo
          );
        }
        
        // Format data for chart
        const formattedData = filteredHistory.map(entry => ({
          date: new Date(entry.created_at).toLocaleDateString(),
          accuracy: entry.accuracy,
          movingAverage: entry.moving_average_accuracy
        }));
        
        setAccuracyData(formattedData);
      } catch (err) {
        console.error('Error fetching accuracy history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, config.timeRange, windowSize]);

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center">Loading data...</div>;
  }

  if (accuracyData.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={accuracyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
            domain={[80, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#323437', border: 'none', borderRadius: '4px' }}
            itemStyle={{ color: '#d1d0c5' }}
            labelStyle={{ color: '#d1d0c5' }}
            formatter={(value) => [`${value}%`, 'Accuracy']}
          />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#27272a" 
            strokeWidth={1}
            dot={{ r: 1, fill: '#27272a' }}
            activeDot={{ r: 3 }}
            name="Accuracy"
          />
          <Line 
            type="monotone" 
            dataKey="movingAverage" 
            stroke="#f2d766"
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

export default AccuracyChartPanel;
