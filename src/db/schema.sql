
-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scripts Table
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT[] NOT NULL, -- Array of strings for quotes
  category TEXT NOT NULL,
  created_by TEXT NOT NULL, -- Either "system" or user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Typing History Table
CREATE TABLE IF NOT EXISTS typing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  speed_wpm INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  points INTEGER DEFAULT 1
);

-- Add constraints and indexes
CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_typing_history_user_id ON typing_history(user_id);
CREATE INDEX idx_typing_history_script_id ON typing_history(script_id);
