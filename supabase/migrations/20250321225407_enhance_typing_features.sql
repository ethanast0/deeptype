-- Modify typing_history table structure
ALTER TABLE public.typing_history
    DROP COLUMN IF EXISTS date,
    DROP COLUMN IF EXISTS time,
    DROP COLUMN IF EXISTS points,
    DROP COLUMN IF EXISTS speed_wpm,
    ADD COLUMN IF NOT EXISTS wpm INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS elapsed_time INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- RLS policies for typing_history (already has RLS enabled)
DROP POLICY IF EXISTS "Users can view their own typing history" ON public.typing_history;
CREATE POLICY "Users can view their own typing history"
    ON public.typing_history
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own typing records" ON public.typing_history;
CREATE POLICY "Users can insert their own typing records"
    ON public.typing_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Extend scripts table with stats columns
ALTER TABLE public.scripts
    ADD COLUMN IF NOT EXISTS typed_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unique_typers_count INTEGER DEFAULT 0;

-- Create view for script stats
CREATE OR REPLACE VIEW public.script_stats AS
SELECT 
    script_id,
    COUNT(*) as typed_count,
    COUNT(DISTINCT user_id) as unique_typers_count
FROM public.typing_history
GROUP BY script_id;

-- Create function to update script stats
CREATE OR REPLACE FUNCTION public.update_script_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.scripts
    SET 
        typed_count = stats.typed_count,
        unique_typers_count = stats.unique_typers_count
    FROM public.script_stats stats
    WHERE scripts.id = stats.script_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stats updates
DROP TRIGGER IF EXISTS update_script_stats_trigger ON public.typing_history;
CREATE TRIGGER update_script_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.typing_history
FOR EACH ROW
EXECUTE FUNCTION public.update_script_stats();

-- Create saved_scripts table
CREATE TABLE IF NOT EXISTS public.saved_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    script_id UUID REFERENCES public.scripts(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- Enable RLS on saved_scripts
ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for saved_scripts
CREATE POLICY "Users can manage their saved scripts"
    ON public.saved_scripts
    FOR ALL
    USING (auth.uid() = user_id);

-- Create combined view for scripts
CREATE OR REPLACE VIEW public.script_views AS
SELECT 
    s.*,
    COALESCE(ss.user_id IS NOT NULL, false) as is_saved,
    COALESCE(th.avg_wpm, 0) as average_wpm,
    COALESCE(th.avg_accuracy, 0) as average_accuracy
FROM public.scripts s
LEFT JOIN public.saved_scripts ss ON s.id = ss.script_id AND ss.user_id = auth.uid()
LEFT JOIN (
    SELECT 
        script_id,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy
    FROM public.typing_history
    GROUP BY script_id
) th ON s.id = th.script_id;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_typing_history_user_script ON public.typing_history(user_id, script_id);
CREATE INDEX IF NOT EXISTS idx_typing_history_script_id ON public.typing_history(script_id);
CREATE INDEX IF NOT EXISTS idx_saved_scripts_user_script ON public.saved_scripts(user_id, script_id);

-- Grant permissions
GRANT ALL ON TABLE public.saved_scripts TO anon;
GRANT ALL ON TABLE public.saved_scripts TO authenticated;
GRANT ALL ON TABLE public.saved_scripts TO service_role;

GRANT ALL ON TABLE public.script_stats TO anon;
GRANT ALL ON TABLE public.script_stats TO authenticated;
GRANT ALL ON TABLE public.script_stats TO service_role;

GRANT ALL ON TABLE public.script_views TO anon;
GRANT ALL ON TABLE public.script_views TO authenticated;
GRANT ALL ON TABLE public.script_views TO service_role; 