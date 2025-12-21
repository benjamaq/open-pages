-- Day 1: Foundation + Core Engine - Database Schema

-- Add to stack_items table (supplements)
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'performance';
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS expected_window_days INT DEFAULT 30;
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS loading_phase_days INT;
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS peak_effect_days INT;
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS builds_tolerance BOOLEAN DEFAULT false;
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS tolerance_days INT;

-- User calibration baselines (for personalization)
CREATE TABLE IF NOT EXISTS user_baselines (
  user_id UUID PRIMARY KEY,
  calibration_complete BOOLEAN DEFAULT false,
  calibration_days INT DEFAULT 0,
  typical_sharp_hrv NUMERIC,
  typical_ok_hrv NUMERIC,
  typical_low_hrv NUMERIC,
  avg_sleep_score NUMERIC,
  stress_level TEXT, -- 'low' | 'moderate' | 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement intelligence database
CREATE TABLE IF NOT EXISTS supplement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'performance' | 'protective' | 'synergistic'
  expected_window_days INT DEFAULT 30,
  loading_phase_days INT,
  peak_effect_days INT,
  builds_tolerance BOOLEAN DEFAULT false,
  tolerance_days INT,
  primary_metrics TEXT[], -- ['hrv', 'sleep', 'mood']
  literature_effect TEXT, -- 'positive' | 'protective' | 'minimal'
  literature_confidence NUMERIC, -- 0-1
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern detection (for "why" explanations)
CREATE TABLE IF NOT EXISTS signal_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id UUID REFERENCES stack_items(id),
  user_id UUID NOT NULL,
  pattern_type TEXT, -- 'rapid_plateau' | 'slow_linear' | 'immediate_spike' | 'cyclical'
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  confidence NUMERIC
);

-- Data quality flags
CREATE TABLE IF NOT EXISTS data_quality_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  flag_type TEXT NOT NULL, -- 'sick' | 'traveling' | 'stress' | 'alcohol'
  auto_detected BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiment suggestions
CREATE TABLE IF NOT EXISTS experiment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supplement_id UUID REFERENCES stack_items(id),
  suggestion_type TEXT NOT NULL, -- 'isolation_test' | 'dose_optimization' | 'cycle_off'
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_baselines_user ON user_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_profiles_name ON supplement_profiles(name);
CREATE INDEX IF NOT EXISTS idx_signal_patterns_supplement ON signal_patterns(supplement_id, user_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_user_date ON data_quality_periods(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_experiment_suggestions_user ON experiment_suggestions(user_id, dismissed);


