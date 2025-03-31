# Typegram V1 Database Enhancements

## Overview
Implementation plan for enhancing Typegram's database structure and features using Supabase.

## Current Status
- ✅ Frontend typing experience implemented
- ✅ Basic Supabase project configured
- ✅ Client-side stats computation in place

## Database Schema Changes

### 1. Typing History Table
```sql
CREATE TABLE typing_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    script_id UUID REFERENCES scripts(id) NOT NULL,
    wpm INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    elapsed_time INTEGER NOT NULL, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- RLS Policies
ALTER TABLE typing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own typing history"
    ON typing_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own typing records"
    ON typing_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

### 2. Scripts Table Extensions
```sql
-- Add computed columns to scripts table
ALTER TABLE scripts
ADD COLUMN typed_count INTEGER DEFAULT 0,
ADD COLUMN unique_typers_count INTEGER DEFAULT 0;

-- Create view for computed stats
CREATE OR REPLACE VIEW script_stats AS
SELECT 
    script_id,
    COUNT(*) as typed_count,
    COUNT(DISTINCT user_id) as unique_typers_count
FROM typing_history
GROUP BY script_id;

-- Create trigger to update stats
CREATE OR REPLACE FUNCTION update_script_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE scripts
    SET 
        typed_count = stats.typed_count,
        unique_typers_count = stats.unique_typers_count
    FROM script_stats stats
    WHERE scripts.id = stats.script_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_script_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON typing_history
FOR EACH ROW
EXECUTE FUNCTION update_script_stats();
```

### 3. Saved Scripts Feature
```sql
CREATE TABLE saved_scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    script_id UUID REFERENCES scripts(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- RLS Policies
ALTER TABLE saved_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their saved scripts"
    ON saved_scripts
    FOR ALL
    USING (auth.uid() = user_id);
```

### 4. Combined Scripts View
```sql
CREATE OR REPLACE VIEW script_views AS
SELECT 
    s.*,
    COALESCE(ss.user_id IS NOT NULL, false) as is_saved,
    COALESCE(th.avg_wpm, 0) as average_wpm,
    COALESCE(th.avg_accuracy, 0) as average_accuracy
FROM scripts s
LEFT JOIN saved_scripts ss ON s.id = ss.script_id AND ss.user_id = auth.uid()
LEFT JOIN (
    SELECT 
        script_id,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy
    FROM typing_history
    GROUP BY script_id
) th ON s.id = th.script_id;
```

## Implementation Tasks

### Backend Tasks
- [ ] Execute schema changes in Supabase SQL editor
- [ ] Test RLS policies
- [ ] Create helper functions for stats updates
- [ ] Set up database triggers

### Frontend Tasks
- [ ] Add typing history tracking to useTypingTest hook
- [ ] Implement save/unsave script functionality
- [ ] Add UI components for saved scripts
- [ ] Display typing history stats
- [ ] Add "Save this script?" prompt after completion

### API Integration
- [ ] Create typing history upsert function
```typescript
const upsertTypingHistory = async (
  scriptId: string,
  wpm: number,
  accuracy: number,
  elapsedTime: number
) => {
  const { data, error } = await supabase
    .from('typing_history')
    .upsert({
      script_id: scriptId,
      user_id: auth.user()?.id,
      wpm,
      accuracy,
      elapsed_time: elapsedTime
    });
  if (error) throw error;
  return data;
};
```

- [ ] Implement top scripts query
```typescript
const getTopScripts = async (limit = 10) => {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .order('unique_typers_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};
```

## Testing Checklist
- [ ] Verify typing history is recorded correctly
- [ ] Check script stats are updated automatically
- [ ] Test save/unsave functionality
- [ ] Validate RLS policies
- [ ] Performance test with multiple concurrent users
- [ ] not working

## Notes
- Consider implementing caching for frequently accessed stats
- Monitor query performance and optimize as needed
- Add indexes for frequently queried columns
- Consider implementing soft delete for scripts

## Future Enhancements
- Add user achievement system
- Implement typing streaks
- Add social features (following users, sharing scripts)
- Add script categories and tags 