-- Create user_performance_metrics table
CREATE TABLE IF NOT EXISTS user_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly', 'total')),
  period_value TEXT NOT NULL,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  win_profit DECIMAL(15,2) DEFAULT 0,
  loss_loss DECIMAL(15,2) DEFAULT 0,
  win_pips DECIMAL(10,2) DEFAULT 0,
  loss_pips DECIMAL(10,2) DEFAULT 0,
  avg_win_holding_time INTEGER DEFAULT 0,
  avg_loss_holding_time INTEGER DEFAULT 0,
  max_win_streak INTEGER DEFAULT 0,
  max_loss_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_value)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_user_id ON user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_period ON user_performance_metrics(period_type, period_value);

-- Enable Row Level Security
ALTER TABLE user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own metrics
CREATE POLICY "Users can read their own performance metrics" ON user_performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own metrics
CREATE POLICY "Users can insert their own performance metrics" ON user_performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own metrics
CREATE POLICY "Users can update their own performance metrics" ON user_performance_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own metrics
CREATE POLICY "Users can delete their own performance metrics" ON user_performance_metrics
  FOR DELETE USING (auth.uid() = user_id); 