-- Drop existing tables and views
DROP VIEW IF EXISTS script_views;
DROP TABLE IF EXISTS typing_history;
DROP TABLE IF EXISTS saved_scripts;
DROP TABLE IF EXISTS scripts;

-- Create scripts table
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT false,
    saves_count INTEGER DEFAULT 0,
    typed_count INTEGER DEFAULT 0,
    unique_typers_count INTEGER DEFAULT 0
);

-- Create script_quotes table
CREATE TABLE script_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    quote_index INTEGER NOT NULL,
    typed_count INTEGER DEFAULT 0,
    unique_typers_count INTEGER DEFAULT 0,
    avg_wpm INTEGER DEFAULT 0,
    best_wpm INTEGER DEFAULT 0,
    avg_accuracy DECIMAL DEFAULT 0,
    UNIQUE(script_id, quote_index)
);

-- Create saved_scripts table
CREATE TABLE saved_scripts (
    user_id UUID REFERENCES auth.users(id),
    script_id UUID REFERENCES scripts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, script_id)
);

-- Create typing_history table
CREATE TABLE typing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    script_id UUID REFERENCES scripts(id),
    quote_id UUID REFERENCES script_quotes(id),
    wpm INTEGER NOT NULL,
    accuracy DECIMAL NOT NULL,
    elapsed_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for script statistics
CREATE VIEW script_views AS
SELECT 
    s.id,
    s.name,
    s.category,
    s.is_featured,
    s.saves_count,
    s.typed_count,
    s.unique_typers_count,
    COALESCE(AVG(th.wpm), 0) as avg_wpm,
    COALESCE(MAX(th.wpm), 0) as best_wpm,
    COALESCE(AVG(th.accuracy), 0) as avg_accuracy
FROM scripts s
LEFT JOIN typing_history th ON s.id = th.script_id
GROUP BY s.id;

-- Create view for quote statistics
CREATE VIEW quote_views AS
SELECT 
    sq.id,
    sq.script_id,
    sq.content,
    sq.quote_index,
    sq.typed_count,
    sq.unique_typers_count,
    COALESCE(AVG(th.wpm), 0) as avg_wpm,
    COALESCE(MAX(th.wpm), 0) as best_wpm,
    COALESCE(AVG(th.accuracy), 0) as avg_accuracy
FROM script_quotes sq
LEFT JOIN typing_history th ON sq.id = th.quote_id
GROUP BY sq.id;

-- Function to update script and quote stats after typing
CREATE OR REPLACE FUNCTION update_typing_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update script stats
    UPDATE scripts
    SET typed_count = typed_count + 1,
        unique_typers_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM typing_history
            WHERE script_id = NEW.script_id
        )
    WHERE id = NEW.script_id;

    -- Update quote stats
    UPDATE script_quotes
    SET typed_count = typed_count + 1,
        unique_typers_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM typing_history
            WHERE quote_id = NEW.quote_id
        ),
        avg_wpm = (
            SELECT COALESCE(AVG(wpm), 0)
            FROM typing_history
            WHERE quote_id = NEW.quote_id
        ),
        best_wpm = (
            SELECT COALESCE(MAX(wpm), 0)
            FROM typing_history
            WHERE quote_id = NEW.quote_id
        ),
        avg_accuracy = (
            SELECT COALESCE(AVG(accuracy), 0)
            FROM typing_history
            WHERE quote_id = NEW.quote_id
        )
    WHERE id = NEW.quote_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after typing
CREATE TRIGGER after_typing_history_insert
    AFTER INSERT ON typing_history
    FOR EACH ROW
    EXECUTE FUNCTION update_typing_stats();

-- Function to update saves count
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE scripts
        SET saves_count = saves_count + 1
        WHERE id = NEW.script_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE scripts
        SET saves_count = saves_count - 1
        WHERE id = OLD.script_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update saves count
CREATE TRIGGER after_saved_scripts_change
    AFTER INSERT OR DELETE ON saved_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_saves_count();

-- Enable RLS
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public scripts are viewable by everyone"
    ON scripts FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own scripts"
    ON scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Script owners can update their scripts"
    ON scripts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Script owners can delete their scripts"
    ON scripts FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Public quotes are viewable by everyone"
    ON script_quotes FOR SELECT
    USING (true);

CREATE POLICY "Anyone can save scripts"
    ON saved_scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their saved scripts"
    ON saved_scripts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can unsave scripts"
    ON saved_scripts FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert typing history"
    ON typing_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their typing history"
    ON typing_history FOR SELECT
    USING (auth.uid() = user_id); 