-- Drop existing dependencies first
DROP VIEW IF EXISTS public.script_stats;
DROP VIEW IF EXISTS public.script_views;
DROP TRIGGER IF EXISTS update_script_counts_trigger ON public.typing_history;
DROP TRIGGER IF EXISTS update_saves_count_trigger ON public.saved_scripts;
DROP FUNCTION IF EXISTS public.update_script_counts();
DROP FUNCTION IF EXISTS public.update_saves_count();

-- Drop existing tables (will recreate with new schema)
DROP TABLE IF EXISTS "public"."typing_history";
DROP TABLE IF EXISTS "public"."saved_scripts";
DROP TABLE IF EXISTS "public"."scripts";

-- Recreate scripts table with enhanced fields
CREATE TABLE IF NOT EXISTS "public"."scripts" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,  -- Array of strings
    "user_id" UUID REFERENCES auth.users(id),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "category" TEXT,
    "is_featured" BOOLEAN DEFAULT false,
    "saves_count" INT DEFAULT 0,
    "typed_count" INT DEFAULT 0,
    "unique_typers_count" INT DEFAULT 0
);

-- Create saved_scripts table for user preferences
CREATE TABLE IF NOT EXISTS "public"."saved_scripts" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES auth.users(id),
    "script_id" UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- Recreate typing_history with enhanced fields
CREATE TABLE IF NOT EXISTS "public"."typing_history" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES auth.users(id),
    "script_id" UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
    "wpm" INT NOT NULL,
    "accuracy" FLOAT NOT NULL,
    "elapsed_time" INT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for script statistics
CREATE OR REPLACE VIEW "public"."script_views" AS
SELECT 
    s.*,
    COALESCE(ss.saves_count, 0) as current_saves_count,
    COALESCE(th.avg_wpm, 0) as average_wpm,
    COALESCE(th.best_wpm, 0) as best_wpm,
    COALESCE(th.total_typed, 0) as total_typed,
    CASE WHEN saved.script_id IS NOT NULL THEN true ELSE false END as is_saved
FROM public.scripts s
LEFT JOIN (
    SELECT script_id, COUNT(*) as saves_count
    FROM public.saved_scripts
    GROUP BY script_id
) ss ON s.id = ss.script_id
LEFT JOIN (
    SELECT 
        script_id,
        COUNT(*) as total_typed,
        AVG(wpm) as avg_wpm,
        MAX(wpm) as best_wpm
    FROM public.typing_history
    GROUP BY script_id
) th ON s.id = th.script_id
LEFT JOIN public.saved_scripts saved ON s.id = saved.script_id AND saved.user_id = auth.uid();

-- Enable RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scripts
CREATE POLICY "Scripts are viewable by everyone"
    ON public.scripts FOR SELECT
    USING (true);

CREATE POLICY "Users can create scripts"
    ON public.scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
    ON public.scripts FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for saved_scripts
CREATE POLICY "Users can view their saved scripts"
    ON public.saved_scripts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save scripts"
    ON public.saved_scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their saved scripts"
    ON public.saved_scripts FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for typing_history
CREATE POLICY "Users can view their typing history"
    ON public.typing_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can record typing history"
    ON public.typing_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update script counts
CREATE OR REPLACE FUNCTION public.update_script_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update typed_count and unique_typers_count
        UPDATE public.scripts
        SET 
            typed_count = typed_count + 1,
            unique_typers_count = (
                SELECT COUNT(DISTINCT user_id)
                FROM public.typing_history
                WHERE script_id = NEW.script_id
            )
        WHERE id = NEW.script_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating script counts
DROP TRIGGER IF EXISTS update_script_counts_trigger ON public.typing_history;
CREATE TRIGGER update_script_counts_trigger
    AFTER INSERT ON public.typing_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_script_counts();

-- Function to update saves count
CREATE OR REPLACE FUNCTION public.update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.scripts
        SET saves_count = saves_count + 1
        WHERE id = NEW.script_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.scripts
        SET saves_count = saves_count - 1
        WHERE id = OLD.script_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating saves count
DROP TRIGGER IF EXISTS update_saves_count_trigger ON public.saved_scripts;
CREATE TRIGGER update_saves_count_trigger
    AFTER INSERT OR DELETE ON public.saved_scripts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_saves_count();

-- Grant permissions
GRANT ALL ON TABLE public.scripts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.saved_scripts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.typing_history TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.script_views TO anon, authenticated, service_role; 