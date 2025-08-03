// Performance data formatting utilities for the new user_performance_summary table structure

export interface PerformanceMetric {
  column: string;
  title: string;
  description: string;
}

// Format values based on column names and data types
export const formatPerformanceValue = (value: number | null | undefined, columnName: string): string => {
  if (value === null || value === undefined) return "N/A";
  
  // Handle percentage values
  if (columnName.includes('win_rate') || columnName.includes('rate')) {
    return `${value.toFixed(1)}%`;
  }
  
  // Handle currency values
  if (columnName.includes('profit') || columnName.includes('loss')) {
    return `¥${value.toLocaleString()}`;
  }
  
  // Handle pips values
  if (columnName.includes('pips')) {
    return `${value.toFixed(1)} pips`;
  }
  
  // Handle time values (assuming seconds)
  if (columnName.includes('holding_time')) {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  
  // Handle count values
  if (columnName.includes('trades') || columnName.includes('count')) {
    return `${value}回`;
  }
  
  // Default formatting
  return value.toLocaleString();
};

// Get color based on metric type and value
export const getPerformanceMetricColor = (columnName: string, value: number | null | undefined): string => {
  if (value === null || value === undefined) return "text-gray-500";
  
  // For win rates, green if high, red if low
  if (columnName.includes('win_rate')) {
    return value >= 60 ? "text-green-600" : value >= 40 ? "text-yellow-600" : "text-red-600";
  }
  
  // For profits, green if positive, red if negative
  if (columnName.includes('profit')) {
    return value >= 0 ? "text-green-600" : "text-red-600";
  }
  
  // For pips, green if positive, red if negative
  if (columnName.includes('pips')) {
    return value >= 0 ? "text-green-600" : "text-red-600";
  }
  
  // For payoff ratio, green if > 1, red if < 1
  if (columnName.includes('payoff_ratio')) {
    return value >= 1.5 ? "text-green-600" : value >= 1.0 ? "text-yellow-600" : "text-red-600";
  }
  
  // Default color
  return "text-gray-900 dark:text-gray-100";
};

// Define all available performance metrics with their Japanese titles
export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  { column: 'win_rate', title: '勝率', description: '全取引の勝率' },
  { column: 'avg_win_trade_profit', title: '平均利益', description: '利益時の平均' },
  { column: 'avg_loss_trade_pips', title: '平均損失pips', description: '損失時の平均pips' },
  { column: 'avg_win_trade_pips', title: '平均利益pips', description: '利益時の平均pips' },
  { column: 'avg_daily_win_trades', title: '日平均利益取引', description: '1日の平均利益取引数' },
  { column: 'avg_holding_time', title: '平均保有時間', description: '取引の平均保有時間' },
  { column: 'avg_daily_loss_trades', title: '日平均損失取引', description: '1日の平均損失取引数' },
  { column: 'payoff_ratio', title: 'ペイオフ比率', description: '利益/損失比率' },
];

// Filter available metrics from performance data
export const getAvailableMetrics = (performanceData: any): PerformanceMetric[] => {
  return PERFORMANCE_METRICS.filter(metric => 
    performanceData[metric.column] !== null && 
    performanceData[metric.column] !== undefined
  );
};

// Get dashboard-specific metrics (subset for dashboard display)
export const getDashboardMetrics = (performanceData: any): PerformanceMetric[] => {
  const dashboardColumns = ['win_rate', 'avg_win_trade_profit', 'payoff_ratio', 'avg_holding_time'];
  return PERFORMANCE_METRICS.filter(metric => 
    dashboardColumns.includes(metric.column) &&
    performanceData[metric.column] !== null && 
    performanceData[metric.column] !== undefined
  );
}; 

// Get color based on P/L
export const getPLColor = (pnl: number) => {
  if (pnl > 0) {
    if (pnl > 5000) return "bg-green-600 text-white"
    if (pnl > 2000) return "bg-green-500 text-white"
    return "bg-green-300 text-green-900"
  } else if (pnl < 0) {
    if (pnl < -3000) return "bg-red-600 text-white"
    if (pnl < -1000) return "bg-red-500 text-white"
    return "bg-red-300 text-red-900"
  }
  return "bg-gray-100 text-gray-600"
}