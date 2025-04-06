
-- Function to update panel positions
CREATE OR REPLACE FUNCTION public.update_panel_positions(position_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  panel_id uuid;
  new_position integer;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(position_updates)
  LOOP
    panel_id := (item->>'id')::uuid;
    new_position := (item->>'position')::integer;
    
    UPDATE public.custom_panels
    SET position = new_position,
        updated_at = now()
    WHERE id = panel_id;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_panel_positions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_panel_positions TO service_role;
