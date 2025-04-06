
/**
 * Central configuration for all panel types
 * This allows for app-wide default settings that can be overridden per-instance
 */

export type TimeRange = 'day' | 'week' | 'month' | 'all';

export interface BaseConfig {
  windowSize?: number;
  timeRange?: TimeRange;
}

export interface WpmHistoryConfig extends BaseConfig {
  showRawData?: boolean;
}

export interface AccuracyChartConfig extends BaseConfig {
  showRawData?: boolean;
}

export interface LeaderboardConfig extends BaseConfig {
  category?: 'all' | 'beginners' | 'intermediate' | 'advanced';
}

export interface SessionStatsConfig extends BaseConfig {
  showGitView?: boolean;
}

// Default configurations for each panel type
export const defaultConfigs = {
  'wpm-history': {
    windowSize: 5,
    timeRange: 'week',
    showRawData: true,
  } as WpmHistoryConfig,
  
  'accuracy-chart': {
    windowSize: 5,
    timeRange: 'week',
    showRawData: false,
  } as AccuracyChartConfig,
  
  'leaderboard': {
    timeRange: 'week',
    category: 'all',
  } as LeaderboardConfig,
  
  'session-stats': {
    showGitView: false,
  } as SessionStatsConfig,
};

// Helper function to merge default config with user-provided config
export function getPanelConfig<T extends BaseConfig>(panelType: keyof typeof defaultConfigs, userConfig?: Partial<T>): T {
  const defaultConfig = defaultConfigs[panelType as keyof typeof defaultConfigs] as T;
  return {
    ...defaultConfig,
    ...userConfig,
  };
}
