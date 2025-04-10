
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
import { AccuracyChartConfig, getPanelConfig } from '../../config/panelConfig';

interface AccuracyChartPanelProps {
  config?: Partial<AccuracyChartConfig>;
}

interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  movingAverage?: number | null;
}

const AccuracyChartPanel: React.FC<AccuracyChartPanelProps> = ({ config: userConfig }) => {
  const { user } = useAuth();
  const { theme, colorMode } = useTheme();
  const [accuracyData, setAccuracyData] = useState<AccuracyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get merged configuration
  const config = getPanelConfig<AccuracyChartConfig>('accuracy-chart', userConfig);
  const { windowSize, timeRange, showRawData } = config;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const history = await typingHistoryService.getUserHistoryWithMovingAverageAccuracy(user.id, windowSize);
        
        if (history.raw.length === 0) {
          setAccuracyData([]);
          setIsLoading(false);
          return;
        }
        
        // Create data points with dates
        let dataPoints: AccuracyDataPoint[] = [];
        for (let i = 0; i < history.raw.length; i++) {
          dataPoints.push({
            date: history.created_at && history.created_at[i] 
              ? new Date(history.created_at[i]).toLocaleDateString() 
              : `Point ${i+1}`,
            accuracy: history.raw[i],
            movingAverage: history.movingAverage[i]
          });
        }
        
        // Process data based on timeRange
        const now = new Date();
        let filteredData = [...dataPoints];
        
        if (timeRange === 'day') {
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredData = dataPoints.filter(point => 
            new Date(point.date) >= oneDayAgo
          );
        } else if (timeRange === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredData = dataPoints.filter(point => 
            new Date(point.date) >= oneWeekAgo
          );
        } else if (timeRange === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredData = dataPoints.filter(point => 
            new Date(point.date) >= oneMonthAgo
          );
        }
        
        setAccuracyData(filteredData);
      } catch (err) {
        console.error('Error fetching accuracy history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, timeRange, windowSize]);

  // Theme-aware colors
  const getThemeColors = () => {
    const isDark = theme === 'dark';
    
    const colors = {
      grid: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.5)',
      tick: isDark ? '#9CA3AF' : '#4B5563',
      rawLine: isDark ? '#6B7280' : '#9CA3AF',
      trendLine: colorMode === 'zinc' ? (isDark ? '#D4D4D8' : '#3F3F46') :
                colorMode === 'green' ? (isDark ? '#4ADE80' : '#16A34A') :
                colorMode === 'red' ? (isDark ? '#F87171' : '#DC2626') :
                isDark ? '#D1D5DB' : '#1F2937', // default for slate/gray
      tooltipBg: isDark ? '#374151' : '#F9FAFB',
      tooltipText: isDark ? '#F3F4F6' : '#111827',
      tooltipBorder: isDark ? '#4B5563' : '#E5E7EB'
    };

    return colors;
  };

  const colors = getThemeColors();

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center">Loading data...</div>;
  }

  if (accuracyData.length === 0) {
    return <div className="h-40 flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={accuracyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: colors.tick, fontSize: 10 }}
            tickLine={{ stroke: colors.tick }}
            axisLine={{ stroke: colors.tick }}
          />
          <YAxis 
            tick={{ fill: colors.tick, fontSize: 10 }}
            tickLine={{ stroke: colors.tick }}
            axisLine={{ stroke: colors.tick }}
            domain={[80, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colors.tooltipBg, 
              border: `1px solid ${colors.tooltipBorder}`, 
              borderRadius: '4px' 
            }}
            itemStyle={{ color: colors.tooltipText }}
            labelStyle={{ color: colors.tooltipText }}
            formatter={(value) => [`${value}%`, 'Accuracy']}
          />
          {showRawData && (
            <Line 
              type="basis"
              dataKey="accuracy" 
              stroke={colors.rawLine} 
              strokeWidth={1}
              dot={{ r: 1, fill: colors.rawLine }}
              activeDot={{ r: 3 }}
              name="acc"
            />
          )}
          <Line 
            type="basis"
            dataKey="movingAverage" 
            stroke={colors.trendLine}
            strokeWidth={3}
            dot={false}
            activeDot={false}
            name="acc trend"
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
